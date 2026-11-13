import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { authorEmail, authorPassword, hasAuthorCredentials } from "./helpers.mjs";

// Entirely controlled HTTP fixtures; never access a managed Supabase project.
const API = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const APP = (process.env.E2E_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const PUBLIC_KEY = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
const id = (n) => `e0100000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const WORK = id(1), USER = id(2), CHAPTER = id(3);
const title = "Obra de teste resiliente";
const oldTitle = "Obra local preservada";
const user = { id: USER, aud: "authenticated", role: "authenticated", email: "home-fixture@example.test", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" };
const localWork = {
  id: WORK, titulo: oldTitle, autor: "Autora local", autorId: USER, genero: "Fantasia", formato: "Webnovel", classificacaoIndicativa: "Livre",
  sinopse: "Sinopse local", tags: [], capa: "", capaNome: "", publicado: true, criadaEm: "2026-01-01",
  capitulos: [{ id: CHAPTER, titulo: "Capítulo local", texto: "Texto", publicado: true }], slug: "obra-resiliente", link: "/obra/obra-resiliente",
};
const warning = page => page.getByRole("status").filter({ has: page.getByRole("button", { name: /Tentar novamente|Try again|Intentar de nuevo/ }) });

async function fixtures(page, { authenticated = false, badStorage = false, failed = false, holdCollections = false, empty = false } = {}) {
  let offline = failed;
  let release;
  let fixtureUserId = USER;
  let fixtureUser = user;
  if (authenticated) {
    // The static unsigned JWT previously stored via document.cookie could be
    // rejected by getUser(), racing INITIAL_SESSION and masking personal cache.
    // Obtain a genuine, disposable *local* session without modifying data.
    expect(API).toMatch(/^http:\/\/(?:127\.0\.0\.1|localhost):/);
    expect(APP).toMatch(/^http:\/\/(?:127\.0\.0\.1|localhost):/);
    if (!hasAuthorCredentials || !PUBLIC_KEY) {
      throw new Error("Home E2E requires the existing local author credentials.");
    }
    const client = createClient(API, PUBLIC_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await client.auth.signInWithPassword({
      email: authorEmail, password: authorPassword,
    });
    expect(error).toBeNull();
    expect(data.session?.access_token).toBeTruthy();
    expect(data.user?.id).toBeTruthy();
    fixtureUserId = data.user.id;
    fixtureUser = data.user;
    const cookieName = `sb-${new URL(API).hostname.split(".")[0]}-auth-token`;
    await page.context().addCookies([{
      name: cookieName,
      value: `base64-${Buffer.from(JSON.stringify(data.session)).toString("base64url")}`,
      url: APP,
    }]);
  }
  const collectionGate = new Promise(resolve => { release = resolve; });
  const requests = [];
  const warnings = [];
  page.on("console", message => { if (message.type() === "warning") warnings.push(message.text().slice(0, 300)); });
  await page.route(`${API}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "OPTIONS") return route.fulfill({ status: 200 });
    requests.push(url.pathname);
    if (url.pathname.includes("/auth/v1/user")) return route.fulfill({ json: fixtureUser });
    const table = url.pathname.split("/").pop();
    if (holdCollections && ["favoritos", "concluidas"].includes(table)) await collectionGate;
    if (offline && url.pathname.includes("/rest/")) return route.fulfill({ status: 503, json: { message: "controlled failure" } });
    let result = [];
    if (table === "listar_obras_catalogo" && !empty) result = [{ obra_id: WORK, cursor_id: WORK, cursor_valor: 1, cursor_data: "2026-01-01T00:00:00Z", tem_mais: false }];
    if (table === "obras" && !empty) result = [{
      id: WORK, user_id: fixtureUserId, titulo: title, autor: "Autora remota", genero: "Fantasia", formato: "Webnovel", classificacao_indicativa: "Livre", sinopse: "Sinopse", tags: [], capa_url: "", publicado: true,
      slug: "obra-resiliente", criada_em: "2026-01-01T00:00:00Z", link: "/obra/obra-resiliente",
    }];
    if (table === "capitulos") result = [{ id: CHAPTER, obra_id: WORK, user_id: fixtureUserId, titulo: "Capítulo", ordem: 1, publicado: true, criado_em: "2026-01-01T00:00:00Z" }];
    if (table === "profiles_publicos") result = [{ id: fixtureUserId, user_id: fixtureUserId, nome: "Autora remota", avatar_url: "", bio: "Bio remota" }];
    if (table === "favoritos") result = [{ obra_id: WORK }];
    return route.fulfill({ json: result });
  });
  await page.addInitScript(({ badStorage, localWork, userId }) => {
    const personalWork = { ...localWork, autorId: userId };
    localStorage.setItem(`historietas-obras:${userId}`, badStorage ? "{invalid" : JSON.stringify([personalWork]));
    localStorage.setItem(`historietas-obras-favoritas:${userId}`, JSON.stringify([localWork.id]));
    localStorage.setItem(`historietas-perfis-autores:${userId}`, JSON.stringify({ [userId]: { bio: "Bio local", avatar: "", avatarNome: "" } }));
  }, { badStorage, localWork, userId: fixtureUserId });
  return { requests, warnings, release, userId: fixtureUserId, recover: () => { offline = false; } };
}

for (const device of [
  { name: "desktop", viewport: { width: 1440, height: 900 } },
  { name: "mobile", viewport: { width: 390, height: 844 } },
]) {
  test(`Home normal sem aviso (${device.name})`, async ({ page, baseURL }) => {
    expect(baseURL).toMatch(/^http:\/\/(?:127\.0\.0\.1|localhost):/);
    expect(API).toMatch(/^http:\/\/(?:127\.0\.0\.1|localhost):/);
    await page.setViewportSize(device.viewport);
    const f = await fixtures(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: title, exact: true, level: 1 })).toBeVisible();
    await expect(warning(page)).toHaveCount(0);
    expect(f.requests.filter(path => path.endsWith("listar_obras_catalogo"))).toHaveLength(6);
    expect(f.requests.filter(path => path.endsWith("/obras"))).toHaveLength(1);
    expect(f.requests.filter(path => path.endsWith("/capitulos"))).toHaveLength(1);
    expect(f.requests.filter(path => path.endsWith("profiles_publicos"))).toHaveLength(2);
    await expect.poll(() => f.requests.filter(path => path.endsWith("obter_metricas_conteudos")).length).toBe(2); // works + author ratings

  });

  test(`Home distingue catálogo vazio confirmado de erro (${device.name})`, async ({ page, baseURL }) => {
    expect(baseURL).toMatch(/^http:\/\/(?:127\.0\.0\.1|localhost):/);
    expect(API).toMatch(/^http:\/\/(?:127\.0\.0\.1|localhost):/);
    await page.setViewportSize(device.viewport);
    const f = await fixtures(page, { empty: true });
    await page.goto("/");
    await expect(page.getByText("Nenhuma obra cadastrada", { exact: true })).toBeVisible();
    await expect(warning(page), JSON.stringify(f)).toHaveCount(0);
    expect(f.requests.filter(path => path.endsWith("listar_obras_catalogo"))).toHaveLength(6);
    expect(f.requests.filter(path => path.endsWith("/obras"))).toHaveLength(0);
  });

  test(`Home preserva cache pessoal na falha, avisa e recupera no retry (${device.name})`, async ({ page, baseURL }) => {
    expect(baseURL).toMatch(/^http:\/\/(?:127\.0\.0\.1|localhost):/);
    expect(API).toMatch(/^http:\/\/(?:127\.0\.0\.1|localhost):/);
    await page.setViewportSize(device.viewport);
    const f = await fixtures(page, { authenticated: true, failed: true });
    await page.goto("/");
    await expect(warning(page)).toBeVisible();
    await expect(page.getByRole("heading", { name: oldTitle, exact: true, level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Salvo", exact: true }).first()).toBeVisible();
    await expect(page.getByText("Nenhuma obra cadastrada", { exact: true })).toHaveCount(0);
    const violations = (await new AxeBuilder({ page }).analyze()).violations.filter(v => ["serious", "critical"].includes(v.impact));
    expect(violations).toEqual([]);
    for (const [language, message] of [["en", "Some data could not be refreshed."], ["es", "No se pudieron actualizar todos los datos."], ["pt-BR", "Não foi possível atualizar todos os dados."]]) {
      await page.evaluate(language => {
        localStorage.setItem("historietas-idioma", language);
        dispatchEvent(new StorageEvent("storage", { key: "historietas-idioma", newValue: language }));
      }, language);
      await expect(warning(page)).toContainText(message);
    }
    const retry = warning(page).getByRole("button", { name: "Tentar novamente", exact: true });
    await retry.focus(); await expect(retry).toBeFocused();
    f.recover(); await retry.press("Enter");
    await expect(warning(page)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: title, exact: true, level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true);
  });

  test(`Home ignora JSON inválido sem perder favoritos e inicia obras antes das coleções (${device.name})`, async ({ page, baseURL }) => {
    expect(baseURL).toMatch(/^http:\/\/(?:127\.0\.0\.1|localhost):/);
    expect(API).toMatch(/^http:\/\/(?:127\.0\.0\.1|localhost):/);
    await page.setViewportSize(device.viewport);
    const f = await fixtures(page, { authenticated: true, badStorage: true, holdCollections: true });
    await page.goto("/");
    await expect.poll(() => f.requests.some(path => path.endsWith("/obras"))).toBe(true);
    await expect(page.getByRole("status", { name: "Carregando página inicial" })).toBeVisible();
    f.release();
    await expect(page.getByRole("heading", { name: title, exact: true, level: 1 })).toBeVisible();
    await expect(warning(page)).toBeVisible();
    await expect(page.getByRole("button", { name: "Salvo", exact: true }).first()).toBeVisible();
    expect(await page.evaluate(userId => localStorage.getItem(`historietas-obras:${userId}`), f.userId)).toBe("{invalid");
  });
}
