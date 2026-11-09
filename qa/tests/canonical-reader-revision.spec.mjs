import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { randomUUID } from "node:crypto";
import { authorEmail, authorPassword, visitorEmail, visitorPassword } from "./helpers.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
let author, userId;
const works = [];
const check = (response) => { expect(response.error).toBeNull(); return response.data; };
const reader = (page) => page.locator('main[data-historietas-ler-capitulo-root="true"]');
const apiResponse = (page) => page.waitForResponse(r => new URL(r.url()).pathname === "/api/leitura-publica");

test.beforeAll(async () => {
  // Este arquivo cria/altera/remove SOMENTE fixtures descartáveis locais.
  expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(url).hostname);
  author = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  userId = check(await author.auth.signInWithPassword({ email: authorEmail, password: authorPassword })).user.id;
});
test.afterAll(async () => {
  for (const id of works) check(await author.from("obras").delete().eq("id", id));
  await author?.auth.signOut({ scope: "local" });
});

async function fixture() {
  const id = randomUUID(), one = randomUUID(), two = randomUUID(), slug = `qa-reader-revision-${randomUUID()}`;
  check(await author.from("obras").insert({ id, user_id: userId, titulo: "Obra revisão leitor", autor: "QA",
    genero: "Fantasia", formato: "Romance", classificacao_indicativa: "Livre", publicado: true, slug }));
  works.push(id);
  check(await author.from("capitulos").insert([
    { id: one, obra_id: id, user_id: userId, ordem: 1, titulo: "Primeiro capítulo revisão", texto: "Texto público antes da edição.", publicado: true },
    { id: two, obra_id: id, user_id: userId, ordem: 2, titulo: "Segundo capítulo revisão", texto: "Texto público do segundo capítulo.", publicado: false },
  ]));
  return { id, one, two, slug, path: `/obra/${slug}/capitulo/1` };
}

async function returnToTab(page) {
  const response = apiResponse(page);
  await page.evaluate(() => {
    window.dispatchEvent(new Event("blur"));
    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect((await response).status()).toBe(200);
}

for (const device of ["desktop", "mobile"]) {
  test.describe(device, () => {
    test.use({ viewport: device === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 900 } });

    test("reconcilia edição, publicação, histórico, BFCache e exclusão reais sem polling", async ({ page }) => {
      const f = await fixture(), calls = [], views = [];
      page.on("request", r => {
        const path = new URL(r.url()).pathname;
        if (path === "/api/leitura-publica") calls.push(r.url());
        if (path === "/api/visualizacoes") views.push(r.url());
      });
      const hydration = apiResponse(page);
      await page.goto(`${f.path}?obraId=conflito&capituloId=conflito`);
      await hydration;
      await expect(reader(page).getByRole("heading", { name: "Primeiro capítulo revisão" })).toBeVisible();
      await expect(reader(page).getByText("Texto público antes da edição.")).toBeVisible();
      expect(calls).toHaveLength(1);
      check(await author.from("capitulos").update({ texto: "Texto público depois da edição." }).eq("id", f.one));
      await returnToTab(page);
      await expect(reader(page).getByText("Texto público depois da edição.")).toBeVisible();
      await expect(reader(page).getByText("Texto público antes da edição.")).toHaveCount(0);
      expect(calls).toHaveLength(2);
      await expect.poll(() => views.length).toBe(1);

      check(await author.from("capitulos").update({ publicado: true }).eq("id", f.two));
      await returnToTab(page);
      const next = apiResponse(page);
      await page.getByRole("button", { name: "Próximo capítulo" }).click();
      await next;
      await expect(page).toHaveURL(new RegExp(`/obra/${f.slug}/capitulo/2$`));
      await expect(reader(page).getByText("Texto público do segundo capítulo.")).toBeVisible();
      check(await author.from("capitulos").update({ texto: "Texto atualizado antes do Back." }).eq("id", f.one));
      const back = apiResponse(page); await page.goBack(); await back;
      await expect(reader(page).getByRole("heading", { name: "Primeiro capítulo revisão" })).toBeVisible();
      await expect(reader(page).getByText("Texto atualizado antes do Back.")).toBeVisible();
      const forward = apiResponse(page); await page.goForward(); await forward;
      await expect(reader(page).getByText("Texto público do segundo capítulo.")).toBeVisible();

      check(await author.from("capitulos").update({ texto: "Texto atualizado no BFCache." }).eq("id", f.two));
      const restore = apiResponse(page);
      await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
      await restore;
      await expect(reader(page).getByText("Texto atualizado no BFCache.")).toBeVisible();
      const axe = await new AxeBuilder({ page }).include('main[data-historietas-ler-capitulo-root="true"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(axe.violations.filter(v => ["critical", "serious"].includes(v.impact)),
        axe.violations.map(v => `${v.id}: ${v.nodes.length}`).join("; ")).toEqual([]);

      check(await author.from("capitulos").delete().eq("id", f.two));
      await returnToTab(page);
      await expect(reader(page).getByText("Capítulo não encontrado", { exact: true })).toBeVisible();
      await expect(reader(page).getByText("Texto atualizado no BFCache.")).toHaveCount(0);
      expect(calls).toHaveLength(8);
    });

    test("erro temporário não exibe conteúdo antigo nem 404; retry explícito recupera", async ({ page }) => {
      const f = await fixture();
      const hydration = apiResponse(page);
      await page.goto(f.path); await hydration;
      await expect(reader(page).getByText("Texto público antes da edição.")).toBeVisible();
      await page.route("**/api/leitura-publica?**", route => route.fulfill({ status: 503, json: { erro: "Temporário" } }));
      const failure = apiResponse(page);
      await page.evaluate(() => { window.dispatchEvent(new Event("blur")); window.dispatchEvent(new Event("focus")); });
      expect((await failure).status()).toBe(503);
      await expect(reader(page).getByRole("button", { name: "Tentar novamente" })).toBeVisible();
      await expect(reader(page).getByText("Texto público antes da edição.")).toHaveCount(0);
      await expect(reader(page).getByText("Capítulo não encontrado", { exact: true })).toHaveCount(0);
      await page.unroute("**/api/leitura-publica?**");
      check(await author.from("capitulos").update({ texto: "Conteúdo confirmado após retry." }).eq("id", f.one));
      const retry = apiResponse(page);
      await reader(page).getByRole("button", { name: "Tentar novamente" }).click(); await retry;
      await expect(reader(page).getByText("Conteúdo confirmado após retry.")).toBeVisible();
    });

    test("retorno descarta resposta antiga já lida no servidor mas atrasada na rede", async ({ page }) => {
      const f = await fixture();
      let release, entered, oldRequest, calls = 0;
      const gate = new Promise(r => { release = r; }), ready = new Promise(r => { entered = r; });
      await page.route("**/api/leitura-publica?**", async route => {
        const first = calls++ === 0;
        const response = await route.fetch();
        if (first) { oldRequest = route.request(); entered(); await gate; }
        await route.fulfill({ response });
      });
      try {
        await page.goto(f.path); await ready;
        check(await author.from("capitulos").update({ texto: "Texto confirmado após retornar à aba." }).eq("id", f.one));
        const fresh = apiResponse(page);
        await page.evaluate(() => { window.dispatchEvent(new Event("blur")); window.dispatchEvent(new Event("focus")); });
        await fresh;
        await expect(reader(page).getByText("Texto confirmado após retornar à aba.")).toBeVisible();
        const old = page.waitForResponse(response => response.request() === oldRequest);
        release(); await (await old).finished();
        await page.getByRole("button", { name: "Ajustes" }).click();
        await expect(page.getByText("Tamanho da fonte")).toBeVisible();
        await expect(reader(page).getByText("Texto confirmado após retornar à aba.")).toBeVisible();
        await expect(reader(page).getByText("Texto público antes da edição.")).toHaveCount(0);
        expect(calls).toBe(2);
      } finally { release(); }
    });

    test("revalidação pendente mantém geometria; erro/retry restaura rolagem sem recarregar", async ({ page }) => {
      const f = await fixture();
      const longo = "Texto longo para preservar a geometria do leitor.\n".repeat(180);
      check(await author.from("capitulos").update({ texto: longo, publicado: true }).in("id", [f.one, f.two]));
      const hydration = apiResponse(page); await page.goto(f.path); await hydration;
      await expect(reader(page).getByRole("heading", { name: "Primeiro capítulo revisão" })).toBeVisible();
      let release, entered;
      const gate = new Promise(r => { release = r; }), requestEntered = new Promise(r => { entered = r; });
      await page.route("**/api/leitura-publica?**", async route => { entered(); await gate; await route.continue(); });
      try {
        await page.getByRole("button", { name: "Próximo capítulo" }).click(); await requestEntered;
        await expect(reader(page)).toHaveAttribute("aria-busy", "true");
        await expect(reader(page).getByRole("heading", { name: "Segundo capítulo revisão" })).toBeVisible();
        expect(await reader(page).evaluate(el => el.scrollHeight)).toBeGreaterThan(2000);
      } finally { release(); }
      await expect(reader(page)).not.toHaveAttribute("aria-busy", "true");
      await page.unroute("**/api/leitura-publica?**");
      await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }));
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(600);
      await page.route("**/api/leitura-publica?**", route => route.fulfill({ status: 503, json: { erro: "Rede" } }));
      await page.evaluate(() => { window.dispatchEvent(new Event("blur")); window.dispatchEvent(new Event("focus")); });
      await expect(reader(page).getByRole("button", { name: "Tentar novamente" })).toBeVisible();
      await page.unroute("**/api/leitura-publica?**");
      await reader(page).getByRole("button", { name: "Tentar novamente" }).click();
      await expect(reader(page).getByRole("heading", { name: "Segundo capítulo revisão" })).toBeVisible();
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(600);
    });
  });
}

test("progresso canônico entre desktop/mobile usa duas sessões reais e aguarda identidade aplicada", async ({ browser, baseURL }) => {
  expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(baseURL).hostname);
  const f = await fixture(), contexts = [], clients = [];
  check(await author.from("capitulos").update({ publicado: true }).eq("id", f.two));
  async function device(width) {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    clients.push(client);
    const session = check(await client.auth.signInWithPassword({ email: visitorEmail, password: visitorPassword })).session;
    expect(session).toBeTruthy();
    const cookies = new Map();
    const serverAuth = createServerClient(url, key, { cookies: { getAll: () => [], setAll: values => {
      for (const cookie of values) cookies.set(cookie.name, cookie);
    } } });
    check(await serverAuth.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token }));
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    contexts.push(context);
    // Sessão validada pelo Auth local; cookies só em memória, nunca em relatórios/arquivos.
    await context.addCookies([...cookies.values()].filter(c => c.value).map(c => ({ name: c.name, value: c.value, url: baseURL, sameSite: "Lax" })));
    return context.newPage();
  }
  async function open(page, reload = false) {
    const ready = page.waitForResponse(r => new URL(r.url()).pathname.endsWith("/rpc/obter_metricas_conteudos") && r.ok() &&
      (r.request().postDataJSON()?.p_obra_ids || []).length === 0 &&
      (r.request().postDataJSON()?.p_capitulo_ids || []).includes(f.one));
    if (reload) await page.reload({ waitUntil: "domcontentloaded" });
    else await page.goto(f.path, { waitUntil: "domcontentloaded" });
    await ready;
  }
  try {
    const desktop = await device(1440), mobile = await device(390);
    await open(desktop); await open(mobile);
    const save = desktop.waitForResponse(r => r.url().includes("/rpc/salvar_progresso_leitura"));
    await desktop.getByRole("button", { name: "Marcar capítulo como lido", exact: true }).click();
    expect((await save).ok()).toBe(true);
    await expect(desktop.getByRole("button", { name: "Marcar capítulo como não lido", exact: true })).toBeVisible();
    await open(mobile, true);
    await expect(mobile.getByRole("button", { name: "Marcar capítulo como não lido", exact: true })).toBeVisible();
    const undo = mobile.waitForResponse(r => r.url().includes("/rpc/salvar_progresso_leitura"));
    await mobile.getByRole("button", { name: "Marcar capítulo como não lido", exact: true }).click();
    expect((await undo).ok()).toBe(true);
    await open(desktop, true);
    await expect(desktop.getByRole("button", { name: "Marcar capítulo como lido", exact: true })).toBeVisible();
  } finally {
    for (const context of contexts) await context.close();
    for (const client of clients) await client.auth.signOut({ scope: "local" });
  }
});
