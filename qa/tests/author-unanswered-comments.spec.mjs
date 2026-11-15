import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { hasAuthorCredentials, destructiveEnabled, loginAsAuthor } from "./helpers.mjs";

const slug = (process.env.E2E_PUBLIC_WORK_SLUG || "").trim();

async function abrirDiscussao(page, navegar) {
  const barreira = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/obra-publica");
  await navegar();
  expect((await barreira).status()).toBe(200);
  await expect(page.locator('main[data-historietas-obra-dinamica-root="true"][aria-busy="false"]:not([inert]):visible')).toHaveCount(1);
  const dialog = page.getByRole("dialog", {name: "Comentários de Obra Pública E2E", exact: true});
  await expect(dialog).toBeVisible();
  const conversa = dialog.getByText("Comentário E2E 01", {exact: true}).locator("xpath=ancestor::section[1]");
  await expect(conversa.getByText("Comentário E2E 01", {exact: true})).toBeVisible();
  return {dialog, conversa};
}

test.beforeEach(async ({page}, testInfo) => {
  const eventos = [];
  page.on("response", (response) => {
    const pathname = new URL(response.url()).pathname;
    if (pathname === "/api/obra-publica" || /^\/rest\/v1\/(?:rpc\/obter_metricas_conteudos|comentarios_obras|progresso_leitura)$/.test(pathname)) {
      eventos.push({endpoint: pathname, status: response.status()});
    }
  });
  testInfo._historietasEndpoints = eventos;
});
test.afterEach(async ({page}, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  const dom = await page.locator('main[data-historietas-obra-dinamica-root="true"]').evaluateAll((elementos) => elementos.map((elemento) => ({busy: elemento.getAttribute("aria-busy"), inert: elemento.hasAttribute("inert")})));
  await testInfo.attach("endpoints-sanitizados", {body: JSON.stringify({eventos: testInfo._historietasEndpoints, dom}), contentType: "application/json"});
});

for (const cenario of [
  {nome: "desktop", viewport: {width: 1440, height: 900}},
  {nome: "mobile", viewport: {width: 390, height: 844}},
]) {
  test(`atalho do painel identifica pendências paginadas e preserva acessibilidade — ${cenario.nome}`, async ({page, baseURL}) => {
    test.skip(!hasAuthorCredentials || !destructiveEnabled || !slug, "Requer fixtures E2E locais descartáveis.");
    expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(baseURL).hostname);
    expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname);
    await page.setViewportSize(cenario.viewport);
    await loginAsAuthor(page);
    const metricasPainel = page.waitForResponse((response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/rest/v1/rpc/obter_metricas_conteudos",
    );
    await page.goto("/painel-autor", {waitUntil: "domcontentloaded"});
    expect((await metricasPainel).status()).toBe(200);
    const card = page.locator("article").filter({has: page.getByRole("heading", {name: "Obra Pública E2E", exact: true})});
    await expect(card).toHaveCount(1);
    await card.getByRole("button", {name: "Abrir opções de Obra Pública E2E", exact: true}).click();
    const acoes = page.getByRole("dialog", {name: "Ações de Obra Pública E2E", exact: true});
    const atalho = acoes.getByRole("link", {name: "Ver comentários", exact: true});
    await expect(atalho).toHaveAttribute("href", `/obra/${encodeURIComponent(slug)}?comentarios=1`);

    const consultas = [];
    page.on("request", (request) => {
      if (request.method() === "GET" && /\/rest\/v1\/comentarios_obras\?/.test(request.url())) consultas.push(request.url());
    });
    const {dialog, conversa} = await abrirDiscussao(page, () => atalho.click());
    await expect(conversa.getByText("Sem resposta do autor", {exact: true})).toBeVisible();
    await expect(dialog.getByText("Comentário E2E 21", {exact: true})).toHaveCount(0);
    expect(new Set(consultas).size).toBe(consultas.length);
    expect(consultas.filter((url) => new URL(url).searchParams.has("comentario_pai_id") && new URL(url).searchParams.get("comentario_pai_id") === "is.null")).toHaveLength(1);

    await expect(page).toHaveTitle(/Obra Pública E2E/);
    const axe = await new AxeBuilder({page}).include('[data-historietas-obra-comments-root="true"]').analyze();
    expect(axe.violations.filter((violacao) => ["serious", "critical"].includes(violacao.impact))).toEqual([]);
    await dialog.getByRole("button", {name: "Carregar mais comentários", exact: true}).click();
    const paginaDois = dialog.getByText("Comentário E2E 25", {exact: true}).locator("xpath=ancestor::section[1]");
    await expect(paginaDois.getByText("Sem resposta do autor", {exact: true})).toBeVisible();
    await expect(dialog.getByRole("button", {name: "Carregar mais comentários", exact: true})).toHaveCount(0);
  });

  test(`resposta, recarga e remoção atualizam a pendência — ${cenario.nome}`, async ({page, baseURL}) => {
    test.skip(!hasAuthorCredentials || !destructiveEnabled || !slug, "Requer fixtures E2E locais descartáveis.");
    expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(baseURL).hostname);
    expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname);
    await page.setViewportSize(cenario.viewport);
    await loginAsAuthor(page);
    const {dialog, conversa} = await abrirDiscussao(page, () => page.goto(`/obra/${encodeURIComponent(slug)}?comentarios=1`, {waitUntil: "domcontentloaded"}));
    await expect(conversa.getByText("Sem resposta do autor", {exact: true})).toBeVisible();
    await conversa.getByRole("button", {name: "Responder", exact: true}).click();
    const texto = `Resposta do autor E2E ${cenario.nome}`;
    await dialog.getByRole("textbox").fill(texto);
    const gravacao = page.waitForResponse((response) => response.request().method() === "POST" && /\/rest\/v1\/comentarios_obras(?:\?|$)/.test(response.url()));
    await dialog.getByRole("button", {name: "Enviar comentário", exact: true}).click();
    expect((await gravacao).status()).toBeLessThan(300);
    await expect(conversa.getByText(texto, {exact: true})).toBeVisible();
    await expect(conversa.getByText("Sem resposta do autor", {exact: true})).toHaveCount(0);

    // Reabrir consulta o servidor; resposta recolhida também conta como resposta.
    await abrirDiscussao(page, () => page.reload({waitUntil: "domcontentloaded"}));
    await expect(conversa.getByText("Comentário E2E 01", {exact: true})).toBeVisible();
    await expect(conversa.getByRole("button", {name: "Ver 1 resposta", exact: true})).toBeVisible();
    await expect(conversa.getByText("Sem resposta do autor", {exact: true})).toHaveCount(0);
    await conversa.getByRole("button", {name: "Ver 1 resposta", exact: true}).click();
    const resposta = conversa.getByText(texto, {exact: true}).locator("xpath=ancestor::article[1]");
    page.once("dialog", (confirmacao) => confirmacao.accept());
    await resposta.getByRole("button", {name: "Remover", exact: true}).click();
    await expect(conversa.getByText(texto, {exact: true})).toHaveCount(0);
    await expect(conversa.getByText("Sem resposta do autor", {exact: true})).toBeVisible();

  });
}

test("visitante não recebe marcadores privados do autor", async ({page}) => {
  test.skip(!slug, "Requer obra pública de teste.");
  await page.goto(`/obra/${encodeURIComponent(slug)}?comentarios=1`, {waitUntil: "domcontentloaded"});
  const dialog = page.getByRole("dialog", {name: "Comentários de Obra Pública E2E", exact: true});
  await expect(dialog.getByText("Comentário E2E 01", {exact: true})).toBeVisible();
  await expect(dialog.getByText("Sem resposta do autor", {exact: true})).toHaveCount(0);
});
