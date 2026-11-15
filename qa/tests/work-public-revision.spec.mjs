import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { randomUUID } from "node:crypto";
import { authorEmail, authorPassword, visitorEmail, visitorPassword } from "./helpers.mjs";
import { observarObraPublica, anexarDiagnosticosObra } from "./work-public-diagnostics.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const root = page => page.locator('main[data-historietas-obra-dinamica-root="true"]:visible');
const confirmation = page => page.waitForResponse(r => new URL(r.url()).pathname === "/api/obra-publica");
const check = r => { expect(r.error).toBeNull(); return r.data; };
let author, userId;
const works = [];
test.beforeAll(async () => {
  expect(["127.0.0.1", "localhost", "[::1]"]).toContain(new URL(url).hostname);
  author = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  userId = check(await author.auth.signInWithPassword({ email: authorEmail, password: authorPassword })).user.id;
});
test.afterAll(async () => { for (const id of works) check(await author.from("obras").delete().eq("id", id)); await author?.auth.signOut({ scope: "local" }); });
async function fixture() {
  const id = randomUUID(), two = randomUUID(), seven = randomUUID(), eleven = randomUUID(), slug = `qa-work-version-${randomUUID()}`;
  check(await author.from("obras").insert({ id, user_id: userId, titulo: "Obra snapshot público", autor: "QA", genero: "Fantasia", formato: "Romance",
    classificacao_indicativa: "Livre", publicado: true, slug, sinopse: "Sinopse antes da edição", tags: ["antes"] }));
  works.push(id);
  check(await author.from("capitulos").insert([2, 7, 11].map((ordem, i) => ({ id: [two, seven, eleven][i], obra_id: id, user_id: userId,
    titulo: `Capítulo real ${ordem}`, ordem, texto: `TEXTO_COMPLETO_FORA_SNAPSHOT_${ordem}`, publicado: ordem !== 11 }))));
  return { id, two, seven, eleven, slug, path: `/obra/${slug}` };
}
async function open(page, f) { const response = confirmation(page); await page.goto(f.path); expect((await response).ok()).toBe(true); await expect(root(page)).toHaveAttribute("data-public-work-state", "confirmada"); }
async function focus(page) {
  const response = confirmation(page);
  await page.evaluate(() => { window.dispatchEvent(new Event("focus")); document.dispatchEvent(new Event("visibilitychange")); });
  expect((await response).ok()).toBe(true); await expect(root(page)).toHaveAttribute("aria-busy", "false");
}

for (const device of ["desktop", "mobile"]) test.describe(device, () => {
  test.use({ viewport: device === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 900 } });
  test("SSR leve, ordem com lacunas, edição, publicação, remoção, BFCache e axe", async ({ page, request }) => {
    const f = await fixture();
    const html = await request.get(`${f.path}?obraId=intruso&slug=intruso`);
    expect(html.status()).toBe(200); const body = await html.text();
    expect(body).toContain("Obra snapshot público"); expect(body).toContain("Capítulo real 7");
    expect(body).not.toContain("TEXTO_COMPLETO_FORA_SNAPSHOT"); expect(body).not.toContain("Capítulo real 11");
    let confirms = 0, views = 0, metrics = 0;
    page.on("request", r => { const p = new URL(r.url()).pathname;
      if (p === "/api/obra-publica") confirms++;
      if (p === "/api/visualizacoes" && r.postDataJSON()?.tipo === "obra" && r.postDataJSON()?.conteudoId === f.id) views++;
      if (p.endsWith("/obter_metricas_conteudos")) metrics++;
    });
    const initialMetricsResponse = page.waitForResponse(r => new URL(r.url()).pathname.endsWith("/obter_metricas_conteudos") &&
      (r.request().postDataJSON()?.p_obra_ids || []).includes(f.id));
    await open(page, f); await initialMetricsResponse;
    await expect(root(page).getByRole("heading", { name: "Obra snapshot público", exact: true })).toHaveCSS("text-shadow", "none");
    await expect(root(page).getByRole("link", { name: /Capítulo real 7/ })).toHaveAttribute("href", `${f.path}/capitulo/7`);
    const initialViews = views, initialMetrics = metrics, initialConfirms = confirms;
    expect(initialViews).toBe(1);
    await focus(page); expect(confirms).toBe(initialConfirms + 1); expect(views).toBe(initialViews); expect(metrics).toBe(initialMetrics);
    check(await author.from("obras").update({ titulo: "Obra editada", sinopse: "", tags: [], capa_url: "" }).eq("id", f.id));
    check(await author.from("capitulos").update({ publicado: false }).eq("id", f.seven));
    check(await author.from("capitulos").update({ publicado: true }).eq("id", f.eleven));
    await focus(page);
    await expect(root(page).getByRole("heading", { name: "Obra editada", exact: true })).toBeVisible();
    await expect(root(page).getByText("Sinopse antes da edição")).toHaveCount(0);
    await expect(root(page).getByRole("link", { name: /Capítulo real 7/ })).toHaveCount(0);
    await expect(root(page).getByRole("link", { name: /Capítulo real 11/ })).toHaveAttribute("href", `${f.path}/capitulo/11`);
    const axe = await new AxeBuilder({ page }).include('main[data-historietas-obra-dinamica-root="true"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(axe.violations.filter(v => ["critical", "serious"].includes(v.impact)).map(v => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    check(await author.from("capitulos").update({ publicado: false }).eq("obra_id", f.id)); await focus(page);
    await expect(root(page).getByRole("heading", { name: "Obra editada", exact: true })).toBeVisible();
    await expect(root(page).locator("#capitulos")).toHaveCount(0);
    check(await author.from("obras").update({ publicado: false }).eq("id", f.id));
    const response = confirmation(page);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
    expect((await response).ok()).toBe(true); await expect(root(page).getByText("Obra não encontrada", { exact: true })).toBeVisible();
    await expect(root(page).getByRole("heading", { name: "Obra editada" })).toHaveCount(0);
    check(await author.from("obras").update({ publicado: true }).eq("id", f.id)); await focus(page);
    await expect(root(page).getByRole("heading", { name: "Obra editada", exact: true })).toBeVisible();
    await root(page).getByRole("button", { name: /^Abrir comentários/i }).click();
    await expect(page.getByRole("dialog", { name: /comentários/i })).toBeVisible();
    check(await author.from("obras").update({ classificacao_indicativa: "18+", avisos_conteudo: ["terror"] }).eq("id", f.id));
    await focus(page); await expect(root(page).getByText("Obra não encontrada", { exact: true })).toBeVisible();
    await expect(page.getByRole("dialog", { name: /comentários/i })).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
  });
  test("retry e respostas atrasadas não restauram dados antigos", async ({ page }) => {
    const f = await fixture(); let failed = false;
    await page.route("**/api/obra-publica?*", async route => {
      if (!failed) { failed = true; await route.fulfill({ status: 503, json: { erro: "indisponível" } }); } else await route.continue();
    });
    const response = confirmation(page); await page.goto(f.path); expect((await response).status()).toBe(503);
    await expect(root(page).getByText("Não foi possível carregar a obra agora.")).toBeVisible();
    await expect(root(page).getByRole("heading", { name: "Obra snapshot público" })).toHaveCount(0);
    const retry = confirmation(page); await root(page).getByRole("button", { name: "Tentar novamente", exact: true }).click();
    expect((await retry).ok()).toBe(true); await expect(root(page)).toHaveAttribute("data-public-work-state", "confirmada");
    await page.unroute("**/api/obra-publica?*");
    let entered, release; const reached = new Promise(r => { entered = r; }), gate = new Promise(r => { release = r; });
    let first = true;
    await page.route("**/api/obra-publica?*", async route => {
      if (!first) { await route.continue(); return; } first = false;
      const captured = await route.fetch(); entered(); await gate; await route.fulfill({ response: captured });
    });
    await page.evaluate(() => window.dispatchEvent(new Event("focus"))); await reached;
    try {
      check(await author.from("obras").update({ titulo: "Revisão atual" }).eq("id", f.id));
      await focus(page); await expect(root(page).getByRole("heading", { name: "Revisão atual", exact: true })).toBeVisible();
    } finally { const staleResponse = confirmation(page); release(); await staleResponse; }
    await expect(root(page).getByRole("heading", { name: "Revisão atual", exact: true })).toBeVisible();
  });
  test("Back/Forward, renomeação, exclusão e reutilização de slug usam a identidade atual", async ({ page }) => {
    const a = await fixture(), b = await fixture();
    check(await author.from("obras").update({ titulo: "Obra B" }).eq("id", b.id));
    await open(page, a);
    const next = confirmation(page); await page.evaluate(path => window.history.pushState({}, "", path), b.path); await next;
    await expect(root(page).getByRole("heading", { name: "Obra B", exact: true })).toBeVisible();
    check(await author.from("obras").update({ titulo: "Obra A nova" }).eq("id", a.id));
    const back = confirmation(page); await page.goBack(); await back;
    await expect(root(page).getByRole("heading", { name: "Obra A nova", exact: true })).toBeVisible();
    const forward = confirmation(page); await page.goForward(); await forward;
    await expect(root(page).getByRole("heading", { name: "Obra B", exact: true })).toBeVisible();
    check(await author.from("obras").update({ slug: `${b.slug}-novo` }).eq("id", b.id)); await focus(page);
    await expect(root(page).getByText("Obra não encontrada", { exact: true })).toBeVisible();
    check(await author.from("obras").delete().eq("id", b.id));
    const replacement = await fixture(); check(await author.from("obras").update({ slug: b.slug, titulo: "Outra identidade" }).eq("id", replacement.id));
    await focus(page); await expect(root(page).getByRole("heading", { name: "Outra identidade", exact: true })).toBeVisible();
  });
});

test("progresso autenticado entre dispositivos é separado do snapshot e não aparece ao visitante", async ({ browser, baseURL }, info) => {
  const f = await fixture();
  const visitor = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const session = check(await visitor.auth.signInWithPassword({ email: visitorEmail, password: visitorPassword })).session;
  const cookies = new Map(), contexts = [], diagnostics = [];
  const serverAuth = createServerClient(url, key, { cookies: { getAll: () => [], setAll: values => { for (const c of values) cookies.set(c.name, c); } } });
  check(await serverAuth.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token }));
  check(await visitor.rpc("salvar_progresso_leitura", { p_obra_id: f.id, p_capitulo_id: f.two, p_lido: true, p_progresso: 50, p_ocorrido_em: new Date().toISOString() }));
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } }); contexts.push(context);
      await context.addCookies([...cookies.values()].filter(c => c.value).map(c => ({ name: c.name, value: c.value, url: baseURL, sameSite: "Lax" })));
      await context.addInitScript(({ id, slug, user }) => {
        localStorage.setItem(`historietas-obras:${user}`, JSON.stringify([{ id, slug, titulo: "Rascunho local intacto",
          sinopse: "SINOPSE_LOCAL_NAO_RESTAURAR", capa: "/capa-antiga.png", tags: ["TAG_LOCAL_NAO_RESTAURAR"],
          capitulos: [{ id: "removido", titulo: "CAPITULO_LOCAL_NAO_RESTAURAR", texto: "privado" }] }]));
      }, { id: f.id, slug: f.slug, user: session.user.id });
      const page = await context.newPage();
      diagnostics.push(await observarObraPublica(page, width === 390 ? "mobile" : "desktop"));
      await open(page, f);
      await expect(root(page).getByRole("link", { name: "Continuar leitura: Obra snapshot público", exact: true }).filter({ hasText: "Continuar leitura" })).toHaveAttribute("href", `${f.path}/capitulo/7`);
      await expect(root(page).getByText(/LOCAL_NAO_RESTAURAR/)).toHaveCount(0);
      expect(await page.evaluate(user => JSON.parse(localStorage.getItem(`historietas-obras:${user}`))[0].titulo, session.user.id)).toBe("Rascunho local intacto");
    }
    const context = await browser.newContext(); contexts.push(context); const anonymous = await context.newPage();
    diagnostics.push(await observarObraPublica(anonymous, "anonimo"));
    await open(anonymous, f);
    await expect(root(anonymous).getByRole("link", { name: "Começar a ler: Obra snapshot público", exact: true }).filter({ hasText: "Começar a ler" })).toHaveAttribute("href", `${f.path}/capitulo/2`);
  } catch (error) {
    await anexarDiagnosticosObra(info, diagnostics);
    throw error;
  } finally { for (const d of diagnostics) d.dispose(); for (const c of contexts) await c.close(); await visitor.auth.signOut({ scope: "local" }); }
});
