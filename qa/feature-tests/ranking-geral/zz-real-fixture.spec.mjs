import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

const fixtureId = (n) =>
  "f8200000-0000-4000-8000-" + String(n).padStart(12, "0");

async function getJson(request, url, options) {
  const response = await request.get(url, options);
  expect(response.status(), url).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  return response.json();
}

function sqlLocal(statement) {
  const status = execFileSync("supabase", ["status", "-o", "env"], { encoding: "utf8" });
  const match = status.split(/\r?\n/).find(line => /^DB_URL=/.test(line));
  assert.ok(match, "DB_URL local ausente");
  const value = match.slice("DB_URL=".length).replace(/^["']|["']$/g, "");
  const dbUrl = new URL(value);
  assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(dbUrl.hostname),
    "Proibido modificar banco remoto");
  const names = execFileSync("docker", ["ps", "--filter", "publish=" + dbUrl.port,
    "--format", "{{.Names}}"], { encoding: "utf8" }).trim().split(/\r?\n/)
    .filter(name => /^supabase_db_/.test(name));
  assert.equal(names.length, 1, "Container PostgreSQL descartavel unico");
  execFileSync("docker", ["exec", "-i", names[0], "psql", "-U", "postgres", "-d",
    "postgres", "-X", "-q", "-v", "ON_ERROR_STOP=1"], {
    encoding: "utf8", input: statement + "\n", timeout: 60_000,
  });
}

test("ranking real anônimo: 25 obras, duas páginas e exclusões RLS", async ({ request }) => {
  const first = await getJson(request, "/api/ranking-geral");
  expect(first.estado).toBe("ok");
  expect(first.itens).toHaveLength(20);
  expect(first.proximo).toEqual({
    obra: first.itens.at(-1).id, assinatura: expect.stringMatching(/^[a-f0-9]{32}$/),
  });
  const next = new URLSearchParams({
    obra: first.proximo.obra, assinatura: first.proximo.assinatura,
  });
  const second = await getJson(request, "/api/ranking-geral?" + next);
  expect(second.estado).toBe("ok");
  expect(second.itens).toHaveLength(5);
  expect(second.proximo).toBeNull();
  expect(second.itens[0].posicao).toBe(21);
  const all = [...first.itens, ...second.itens];
  expect(new Set(all.map(item => item.id)).size).toBe(25);
  expect(all.some(item => item.avaliacoes === 5)).toBe(true);
  expect(all.some(item => item.avaliacoes <= 4)).toBe(true);
  for (let i = 40; i <= 43; i++) {
    expect(all.some(item => item.id === fixtureId(i))).toBe(false);
  }
  // A sessao fornecida ao endpoint nao pode influenciar o cliente server-only.
  const withAuthorization = await getJson(request, "/api/ranking-geral", {
    headers: { Authorization: "Bearer qa-jwt-invalido", Cookie: "qa-session=nao-autorizada" },
  });
  expect(withAuthorization).toEqual(first);
});

test("interface real: responsividade, conteúdo, navegação e acessibilidade", async ({ page }, testInfo) => {
  await page.goto("/em-alta");
  const section = page.getByRole("region", { name: "Ranking Geral de Histórias" });
  await expect(section.getByRole("listitem")).toHaveCount(20);
  await expect(section.getByText("Poucas avaliações").first()).toBeVisible();
  await expect(section.getByText(/Nota média pública:/).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const oldRankings = await page.getByRole("heading", { name: "Ranking Mestre" }).count();
  const initialCatalog = await page.getByRole("heading", { name: "Obras publicadas" }).count();
  expect(oldRankings + initialCatalog, "Rankings anteriores mantidos").toBeGreaterThan(0);
  const reports = path.join(process.cwd(), "reports", "ranking-geral-etapa3-visual");
  mkdirSync(reports, { recursive: true });
  await section.screenshot({ path: path.join(reports, testInfo.project.name + "-pagina1.png") });
  const a11y = await new AxeBuilder({ page })
    .include('section[aria-labelledby="ranking-geral-titulo"]').analyze();
  expect(a11y.violations.map(issue => ({ id: issue.id, impact: issue.impact }))).toEqual([]);
  await section.getByRole("button", { name: "Próxima página" }).click();
  await expect(section.getByRole("listitem")).toHaveCount(5);
  await expect(section.getByRole("heading")).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await section.screenshot({ path: path.join(reports, testInfo.project.name + "-pagina2.png") });
});

test("cursor verdadeiro revogado: aviso e reinício explícito", async ({ page }) => {
  await page.goto("/em-alta");
  const section = page.getByRole("region", { name: "Ranking Geral de Histórias" });
  await expect(section.getByRole("listitem")).toHaveCount(20);
  const update = "update public.obra_avaliacoes set nota=0.5 where obra_id='" +
    fixtureId(1) + "'::uuid and user_id='" + fixtureId(102) + "'::uuid;";
  const restore = "update public.obra_avaliacoes set nota=5 where obra_id='" +
    fixtureId(1) + "'::uuid and user_id='" + fixtureId(102) + "'::uuid;";
  sqlLocal(update);
  try {
    await section.getByRole("button", { name: "Próxima página" }).click();
    await expect(section.getByText("O ranking mudou. Reinicie para consultar a classificação atual."))
      .toBeVisible();
    await section.getByRole("button", { name: "Reiniciar ranking" }).click();
    await expect(section.getByRole("listitem")).toHaveCount(20);
  } finally {
    sqlLocal(restore);
  }
});
