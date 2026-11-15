import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ serviceWorkers: "block" });
const API = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const A = "a0400000-0000-4000-8000-000000000001";
const B = "a0400000-0000-4000-8000-000000000002";
const TICKET = "a0400000-0000-4000-8000-000000000003";
const title = id => `Chamado privado ${id === A ? "Alfa" : "Beta"}`;
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; };
const releases = new WeakMap();
test.afterEach(async ({ page }) => { releases.get(page)?.(); await page.unrouteAll({ behavior: "wait" }); });
function session(id) {
  if (!id) return null;
  const now = Math.floor(Date.now() / 1000), encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  const user = { id, aud: "authenticated", role: "authenticated", email: "ajuda-fixture@example.test", user_metadata: {}, app_metadata: {}, created_at: "2026-01-01T00:00:00Z" };
  return { access_token: `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: id, aud: "authenticated", role: "authenticated", exp: now + 3600, iat: now })}.fixture`, refresh_token: "fixture", expires_at: now + 3600, expires_in: 3600, token_type: "bearer", user };
}
async function setup(page, baseURL) {
  expect(baseURL).toMatch(/^http:\/\/(?:127\.0\.0\.1|localhost):/);
  expect(API).toMatch(/^http:\/\/(?:127\.0\.0\.1|localhost):/);
  const key = `sb-${new URL(API).hostname.split(".")[0]}-auth-token`, gate = deferred();
  const f = { viewer: A, authFailure: false, listMode: "valid", createMode: "confirmed", heldOwner: "", writes: [], reads: [], release: gate.resolve };
  releases.set(page, gate.resolve);
  await page.addInitScript(({ key, initial }) => {
    document.cookie = `${key}=base64-${btoa(JSON.stringify(initial)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")}; path=/ajuda; SameSite=Lax`;
  }, { key, initial: session(A) });
  // This browser-only session is scoped to /ajuda. Other routes' server
  // prefetches must never receive an unsigned SDK fixture token.
  await page.route(`${API}/**`, async route => {
    const request = route.request(), url = new URL(request.url()), endpoint = url.pathname.split("/").pop();
    if (request.method() === "OPTIONS") return route.fulfill({ status: 200 });
    if (url.pathname.includes("/auth/v1/user")) {
      if (f.authFailure) return route.fulfill({ status: 503, json: { message: "controlled Auth failure" } });
      return route.fulfill({ json: session(f.viewer)?.user || null });
    }
    if (endpoint === "listar_meus_problemas_tecnicos") {
      const owner = f.viewer, mode = f.listMode;
      f.reads.push({ owner, args: request.postDataJSON() });
      if (owner === f.heldOwner) await gate.promise;
      if (mode === "failure") return route.fulfill({ status: 503, json: { message: "controlled read failure" } });
      return route.fulfill({ json: mode === "empty" ? [] : [{ problema_id: TICKET, categoria: "leitura", titulo: title(owner), descricao: "Descrição privada do chamado", pagina_url: "", status: "aberto", prioridade: "normal", observacao_admin: "Resposta privada", criado_em: "2026-11-13T12:00:00Z", atualizado_em: "2026-11-13T12:00:00Z" }] });
    }
    if (endpoint === "criar_problema_tecnico") {
      const mode = f.createMode;
      f.writes.push(request.postDataJSON());
      if (mode === "held") await gate.promise;
      if (mode === "uncertain") return route.fulfill({ json: null });
      if (mode === "rejected") return route.fulfill({ status: 400, json: { code: "23514", message: "controlled rejection" } });
      return route.fulfill({ json: [{ problema_id: TICKET, problema_status: "aberto", problema_criado_em: "2026-11-13T12:00:00Z" }] });
    }
    return route.fulfill({ json: [] });
  });
  f.switchViewer = async id => {
    f.viewer = id;
    await page.evaluate(({ key, next }) => {
      document.cookie = next ? `${key}=base64-${btoa(JSON.stringify(next)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")}; path=/ajuda; SameSite=Lax` : `${key}=; path=/ajuda; Max-Age=0`;
      const channel = new BroadcastChannel(key); channel.postMessage({ event: next ? "SIGNED_IN" : "SIGNED_OUT", session: next }); channel.close();
    }, { key, next: session(id) });
  };
  return f;
}
const section = page => page.getByRole("region", { name: "Meus chamados recentes", exact: true });
const submit = page => page.getByRole("button", { name: "Enviar problema técnico", exact: true });
async function fill(page) {
  await page.getByLabel("Título do problema", { exact: false }).fill("Erro ao abrir capítulo");
  await page.getByLabel("O que aconteceu?", { exact: false }).fill("A leitura não abre quando tento acessar o capítulo.");
}
for (const device of [{ name: "desktop", viewport: { width: 1440, height: 900 } }, { name: "mobile", viewport: { width: 390, height: 844 } }]) {
  test(`Ajuda preserva snapshot em falha e confirma vazio apenas na recuperação (${device.name})`, async ({ page, baseURL }) => {
    await page.setViewportSize(device.viewport); const f = await setup(page, baseURL);
    await page.goto("/ajuda#problema-tecnico"); await expect(section(page).getByText(title(A), { exact: true })).toBeVisible();
    f.authFailure = true; await page.getByRole("button", { name: "Atualizar chamados" }).click();
    await expect(section(page).getByRole("alert")).toContainText("Não foi possível confirmar sua sessão");
    await expect(page.getByText(title(A), { exact: true })).toHaveCount(0);
    await expect(submit(page)).toBeDisabled();
    f.authFailure = false;
    f.listMode = "failure"; await page.getByRole("button", { name: "Atualizar chamados" }).click();
    await expect(section(page).getByRole("alert")).toContainText("Não foi possível atualizar");
    await expect(section(page).getByText(title(A), { exact: true })).toBeVisible();
    await expect(section(page).getByRole("status")).toContainText("última consulta confirmada");
    await expect(page.getByText("Nenhum chamado recente.", { exact: true })).toHaveCount(0);
    const violations = (await new AxeBuilder({ page }).analyze()).violations.filter(v => ["serious", "critical"].includes(v.impact));
    expect(violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    f.listMode = "empty";
    await submit(page).focus(); await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Atualizar chamados" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(section(page).getByRole("status")).toHaveText("Nenhum chamado recente.");
    await expect(section(page).getByRole("article")).toHaveCount(0); expect(f.writes).toHaveLength(0);
    expect(f.reads.every(r => JSON.stringify(r.args) === '{"p_limite":20}')).toBe(true);
  });

  test(`Ajuda faz uma criação para dois submits e separa recibo de falha na atualização (${device.name})`, async ({ page, baseURL }) => {
    await page.setViewportSize(device.viewport); const f = await setup(page, baseURL);
    await page.goto("/ajuda#problema-tecnico"); await expect(submit(page)).toBeEnabled(); await fill(page);
    f.createMode = "held";
    await page.locator("#problema-tecnico form").evaluate(form => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    await expect.poll(() => f.writes.length).toBe(1);
    await expect(page.getByText(/^Problema técnico enviado\./)).toHaveCount(0);
    f.listMode = "failure"; f.release();
    await expect(page.getByText(/^Problema técnico enviado\./)).toBeVisible();
    await expect(section(page).getByRole("alert")).toBeVisible();
    await expect(section(page).getByText(title(A), { exact: true })).toBeVisible();
    await expect(page.getByLabel("Título do problema", { exact: false })).toHaveValue(""); expect(f.writes).toHaveLength(1);
  });

  test(`Ajuda não repete envio incerto e permite retry manual após rejeição confirmada (${device.name})`, async ({ page, baseURL }) => {
    await page.setViewportSize(device.viewport); const f = await setup(page, baseURL);
    await page.goto("/ajuda#problema-tecnico"); await expect(submit(page)).toBeEnabled(); await fill(page);
    f.createMode = "uncertain"; await submit(page).click();
    await expect(page.getByRole("alert").filter({ hasText: "O envio não foi confirmado" })).toBeVisible();
    await expect(submit(page)).toBeDisabled(); await expect(page.getByLabel("Título do problema", { exact: false })).toHaveValue("Erro ao abrir capítulo");
    await page.getByRole("button", { name: "Atualizar chamados" }).click();
    await expect(page.getByRole("button", { name: "Atualizar chamados" })).toBeEnabled();
    await page.locator("#problema-tecnico form").evaluate(form => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    await expect(page.getByRole("alert").filter({ hasText: "não repita o envio" })).toBeVisible(); expect(f.writes).toHaveLength(1);
    await expect(page.getByText(/^Problema técnico enviado\./)).toHaveCount(0);
    await page.getByLabel("Título do problema", { exact: false }).fill("Outro problema independente");
    f.createMode = "rejected"; await submit(page).click();
    await expect(page.getByRole("alert").filter({ hasText: "Não foi possível enviar" })).toBeVisible();
    await expect(submit(page)).toBeEnabled(); f.createMode = "confirmed"; await submit(page).click();
    await expect(page.getByText(/^Problema técnico enviado\./)).toBeVisible(); expect(f.writes).toHaveLength(3);
    expect(f.writes[1]).toEqual(f.writes[2]);
  });

  test(`Ajuda recupera sessão falha por retry manual sem fingir logout (${device.name})`, async ({ page, baseURL }) => {
    await page.setViewportSize(device.viewport); const f = await setup(page, baseURL); f.authFailure = true;
    await page.goto("/ajuda#problema-tecnico");
    await expect(section(page).getByRole("alert")).toContainText("Não foi possível confirmar sua sessão");
    await expect(submit(page)).toBeDisabled(); await expect(page.getByText("Nenhum chamado recente.", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Você precisa entrar na conta para enviar e acompanhar chamados.", { exact: true })).toHaveCount(0);
    f.authFailure = false; await page.getByRole("button", { name: "Atualizar chamados" }).click();
    await expect(section(page).getByText(title(A), { exact: true })).toBeVisible(); await expect(submit(page)).toBeEnabled(); expect(f.writes).toHaveLength(0);
  });

  test(`Ajuda descarta resposta antiga ao trocar conta e logout limpa relato (${device.name})`, async ({ page, baseURL }) => {
    await page.setViewportSize(device.viewport); const f = await setup(page, baseURL);
    await page.goto("/ajuda#problema-tecnico"); await expect(section(page).getByText(title(A), { exact: true })).toBeVisible(); await fill(page);
    f.heldOwner = A; await page.getByRole("button", { name: "Atualizar chamados" }).click();
    await expect.poll(() => f.reads.filter(r => r.owner === A).length).toBe(2);
    await f.switchViewer(B); await expect(page.getByText(title(A), { exact: true })).toHaveCount(0);
    await expect(section(page).getByText(title(B), { exact: true })).toBeVisible();
    f.release(); await expect(section(page)).toHaveAttribute("aria-busy", "false");
    await expect(page.getByText(title(A), { exact: true })).toHaveCount(0);
    await fill(page); await f.switchViewer(null);
    await expect(page.getByText("Você precisa entrar na conta para enviar e acompanhar chamados.", { exact: true })).toBeVisible();
    await expect(section(page)).toHaveCount(0); await expect(page.getByLabel("Título do problema", { exact: false })).toHaveValue(""); await expect(submit(page)).toBeDisabled();
  });
}
