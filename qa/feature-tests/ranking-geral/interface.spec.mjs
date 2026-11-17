import { test, expect } from "@playwright/test";

const id = "00000000-0000-0000-0000-000000000001";
const assinatura = "a".repeat(32);
const first = { estado: "ok", itens: [{ id, slug: "sintetica", titulo: "História sintética " + "longa ".repeat(20), posicao: 1, nota: 4.5, avaliacoes: 4 }], proximo: { obra: id, assinatura } };

test("endpoint real anônimo e sem cache (requer migration #2348 somente no descartável)", async ({ request }) => {
  const response = await request.get("/api/ranking-geral");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  const page = await response.json();
  expect(page.estado).toBe("ok");
  expect(Array.isArray(page.itens)).toBe(true);
  expect(page.itens.length).toBeLessThanOrEqual(20);
  expect((await request.get("/api/ranking-geral?obra=invalida")).status()).toBe(400);
});

test("UI controlada: carregamento, paginação, cursor revogado, vazio, erro e teclado", async ({ page }) => {
  let release;
  const hold = new Promise(resolve => { release = resolve; });
  let count = 0;
  await page.route("**/api/ranking-geral*", async route => {
    count++;
    if (count === 1) { await hold; return route.fulfill({ json: first }); }
    if (count === 2) {
      const query = new URL(route.request().url()).searchParams;
      expect(query.get("obra")).toBe(id); expect(query.get("assinatura")).toBe(assinatura);
      return route.fulfill({ json: { estado: "cursor_desatualizado" } });
    }
    if (count === 3) return route.fulfill({ status: 503, json: { estado: "indisponivel" } });
    return route.fulfill({ json: { estado: "ok", itens: [], proximo: null } });
  });
  await page.goto("/em-alta");
  const section = page.getByRole("region", { name: "Ranking Geral de Histórias" });
  await expect(section.getByRole("status")).toHaveText("Carregando Ranking Geral…");
  release();
  await expect(section.getByText("Poucas avaliações")).toBeVisible();
  await expect(section.getByText(/Nota média pública: 4,5/)).toBeVisible();
  await expect(section.locator("li")).toHaveAttribute("value", "1");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await section.getByRole("button", { name: "Próxima página" }).focus();
  await page.keyboard.press("Enter");
  await expect(section.getByText("Poucas avaliações")).toHaveCount(0);
  await expect(section.getByRole("heading")).toBeFocused();
  await section.getByRole("button", { name: "Reiniciar ranking" }).click();
  await expect(section.getByRole("alert")).toContainText("Não foi possível");
  await section.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(section.getByRole("status")).toHaveText("Nenhuma história com avaliações públicas disponível.");
  expect(count).toBe(4);
});
