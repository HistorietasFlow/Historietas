import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// All SDK and prefetch traffic must stay inside the HTTP fixture boundary.
// Service-worker fetches bypass Playwright page.route interception.
test.use({ serviceWorkers: "block" });

const API = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const id = n => `f0200000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const A = id(1), B = id(2), C = id(3);
const work = owner => id(owner === A ? 11 : owner === B ? 12 : 13);
const title = owner => `Lista reservada ${owner === A ? "Alfa" : owner === B ? "Beta" : "Gama"}`;
const name = owner => owner === A ? "Autora Alfa" : owner === B ? "Autora Beta" : "Autora Gama";
const routeFor = (owner, origin = "biblioteca") => `/listas?modo=perfil&origem=${origin}&usuario=${owner}`;
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; };
function session(owner) {
  if (!owner) return null;
  const now = Math.floor(Date.now() / 1000);
  const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  const user = { id: owner, aud: "authenticated", role: "authenticated", email: "listas-fixture@example.test", user_metadata: { nome: name(owner) }, app_metadata: {}, created_at: "2026-01-01T00:00:00Z" };
  return { access_token: `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: owner, aud: "authenticated", role: "authenticated", exp: now + 3600, iat: now })}.fixture`, refresh_token: "fixture", expires_at: now + 3600, expires_in: 3600, token_type: "bearer", user };
}
const releaseGates = new WeakMap();
test.afterEach(async ({ page }) => {
  releaseGates.get(page)?.();
  await page.unrouteAll({ behavior: "wait" });
});

async function setup(page, baseURL, server, { privateProfiles = [A, B], holdProfile = "", holdAuthForRoute = "", failFavorites = "", empty = false } = {}) {
  let viewer = A, failed = failFavorites;
  const gate = deferred();
  releaseGates.set(page, gate.resolve);
  const requests = [];
  const key = `sb-${new URL(API).hostname.split(".")[0]}-auth-token`;
  const initial = session(A);
  // This unsigned session belongs only to the intercepted browser SDK. Next's
  // server/proxy must remain anonymous: its real Auth rejects fixture tokens,
  // and an automatic Link prefetch can otherwise expire the browser cookie.
  await page.route(`${baseURL}/**`, async route => {
    const headers = await route.request().allHeaders();
    const cookies = (headers.cookie || "").split(";").map(cookie => cookie.trim());
    const fixtureCookie = cookie => cookie.split("=", 1)[0] === key || cookie.startsWith(`${key}.`);
    if (!cookies.some(fixtureCookie)) return route.continue();
    // continue({ headers }) cannot override Cookie. The isolated request fixture
    // also keeps redirects from restoring cookies from the browser jar.
    // The actual application server, proxy and prefetch response still run.
    const response = await server.fetch(route.request(), {
      headers: { ...headers, cookie: cookies.filter(cookie => !fixtureCookie(cookie)).join("; ") },
    });
    await route.fulfill({ response });
  });
  await page.addInitScript(({ key, initial }) => {
    document.cookie = `${key}=base64-${btoa(JSON.stringify(initial)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")}; path=/; SameSite=Lax`;
  }, { key, initial });
  await page.route(`${API}/**`, async route => {
    const request = route.request(), url = new URL(request.url());
    if (request.method() === "OPTIONS") return route.fulfill({ status: 200 });
    const table = url.pathname.split("/").pop();
    const filter = url.searchParams.get("user_id") || url.searchParams.get("id") || "";
    const owner = filter.startsWith("eq.") ? filter.slice(3) : "";
    const args = request.method() === "POST" ? request.postDataJSON() : {};
    requests.push({ table, owner, args });
    if (url.pathname.includes("/auth/v1/user")) {
      if (holdAuthForRoute && new URL(page.url()).searchParams.get("usuario") === holdAuthForRoute) await gate.promise;
      return viewer ? route.fulfill({ json: session(viewer).user }) : route.fulfill({ status: 401, json: { message: "no session" } });
    }
    if (table === "profiles_publicos") {
      if (owner === holdProfile) await gate.promise;
      return route.fulfill({ json: { id: owner, user_id: owner, nome: name(owner), username: name(owner).replaceAll(" ", ""), avatar_url: "", bio: "Bio" } });
    }
    if (table === "carregar_preferencias_privacidade_publicas") return route.fulfill({ json: { visibilidade_biblioteca: "publico", visibilidade_diario: "publico" } });
    if (table === "carregar_permissoes_abas_perfil") {
      const allowed = !privateProfiles.includes(args.p_user_id);
      return route.fulfill({ json: { biblioteca: allowed, diario: allowed } });
    }
    if (["seguindo_usuarios", "solicitacoes_seguidores"].includes(table)) return route.fulfill({ json: null });
    if (table === "favoritos" && owner === failed) return route.fulfill({ status: 503, json: { message: "controlled failure" } });
    if (table === "favoritos") return route.fulfill({ json: empty ? [] : [{ obra_id: work(owner), visibilidade: owner === viewer ? "privado" : "publico", criado_em: "2026-01-01T00:00:00Z" }] });
    if (table === "obras") {
      const filterIds = url.searchParams.get("id");
      const owners = [A, B, C].filter(owner => !filterIds || filterIds.includes(work(owner)));
      return route.fulfill({ json: owners.map(owner => ({ id: work(owner), user_id: owner, titulo: title(owner), autor: name(owner), genero: "Fantasia", formato: "Webnovel", classificacao_indicativa: "Livre", capa_url: "", publicado: true, visualizacoes: 0, slug: `fixture-${owner.slice(-1)}`, criada_em: "2026-01-01T00:00:00Z" })) });
    }
    if (table === "carregar_avaliacao_diario") return route.fulfill({ json: { media: 0, total: 0, minhaNota: 0, visivel: false } });
    return route.fulfill({ json: [] });
  });
  return {
    requests, release: gate.resolve,
    recover() { failed = ""; },
    async switchViewer(owner, event = owner ? "SIGNED_IN" : "SIGNED_OUT") {
      viewer = owner;
      const next = session(owner);
      await page.evaluate(({ key, next, event }) => {
        document.cookie = next
          ? `${key}=base64-${btoa(JSON.stringify(next)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")}; path=/; SameSite=Lax`
          : `${key}=; path=/; Max-Age=0`;
        const channel = new BroadcastChannel(key);
        channel.postMessage({ event, session: next });
        channel.close();
      }, { key, next, event });
    },
  };
}
const navigate = (page, url) => page.evaluate(url => history.pushState({}, "", url), url);
const assertLocal = baseURL => {
  expect(baseURL).toMatch(/^http:\/\/(?:127\.0\.0\.1|localhost):/);
  expect(API).toMatch(/^http:\/\/(?:127\.0\.0\.1|localhost):/);
};

for (const device of [{ name: "desktop", viewport: { width: 1440, height: 900 } }, { name: "mobile", viewport: { width: 390, height: 844 } }]) {
  test(`Listas remove perfil e contagens anteriores antes de autorizar o destino (${device.name})`, async ({ page, baseURL, request }) => {
    assertLocal(baseURL); await page.setViewportSize(device.viewport);
    const f = await setup(page, baseURL, request, { holdAuthForRoute: B });
    await page.goto(routeFor(A));
    await expect(page.getByText(title(A), { exact: true })).toBeVisible();
    // Exercise server prefetch even on mobile, where Link may not prefetch by
    // itself. It must not send this browser-only session to real server Auth.
    await page.evaluate(async () => {
      await fetch("/obra/fixture-1", { headers: { RSC: "1", "Next-Router-Prefetch": "1" } });
    });
    const cookies = await page.context().cookies();
    expect(cookies.some(cookie => cookie.name === `sb-${new URL(API).hostname.split(".")[0]}-auth-token`)).toBe(true);
    await navigate(page, routeFor(B));
    await expect(page.getByText("Carregando lista...", { exact: true })).toBeVisible();
    await expect(page.getByText(title(A), { exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: new RegExp(name(A)) })).toHaveCount(0);
    // Keep checking painted frames while validation of B is held.
    const leaked = await page.evaluate(async secret => {
      let leaked = false;
      for (let n = 0; n < 8; n++) { await new Promise(requestAnimationFrame); leaked ||= document.body.innerText.includes(secret); }
      return leaked;
    }, title(A));
    expect(leaked).toBe(false);
    f.release();
    await expect(page.getByText("Esta lista é privada", { exact: true })).toBeVisible();
    expect(f.requests.filter(r => r.table === "favoritos" && r.owner === B)).toHaveLength(0);
    const violations = (await new AxeBuilder({ page }).analyze()).violations.filter(v => ["serious", "critical"].includes(v.impact));
    expect(violations).toEqual([]);
  });

  test(`Listas ignora perfil atrasado após A → B → C (${device.name})`, async ({ page, baseURL, request }) => {
    assertLocal(baseURL); await page.setViewportSize(device.viewport);
    const f = await setup(page, baseURL, request, { holdProfile: B, privateProfiles: [A] });
    await page.goto(routeFor(A)); await expect(page.getByText(title(A), { exact: true })).toBeVisible();
    await navigate(page, routeFor(B));
    await expect.poll(() => f.requests.some(r => r.table === "profiles_publicos" && r.owner === B)).toBe(true);
    await navigate(page, routeFor(C));
    await expect(page.getByText(title(C), { exact: true })).toBeVisible();
    f.release();
    await expect(page.getByText(title(A), { exact: true })).toHaveCount(0);
    await expect(page.getByText(title(B), { exact: true })).toHaveCount(0);
    await expect(page.getByText("Organizando a lista...", { exact: true })).toHaveCount(0);
    expect(f.requests.filter(r => r.table === "favoritos" && r.owner === B)).toHaveLength(0);
  });

  test(`Listas invalida logout e troca de conta sem navegar (${device.name})`, async ({ page, baseURL, request }) => {
    assertLocal(baseURL); await page.setViewportSize(device.viewport);
    const f = await setup(page, baseURL, request);
    await page.goto(routeFor(A)); await expect(page.getByText(title(A), { exact: true })).toBeVisible();
    await f.switchViewer(null);
    await expect(page.getByText("Esta lista é privada", { exact: true })).toBeVisible();
    await expect(page.getByText(title(A), { exact: true })).toHaveCount(0);
    await f.switchViewer(B);
    await expect(page.getByText("Esta lista é privada", { exact: true })).toBeVisible();
    await navigate(page, routeFor(B));
    await expect(page.getByText(title(B), { exact: true })).toBeVisible();
    await expect(page.getByText(title(A), { exact: true })).toHaveCount(0);
    const count = f.requests.length;
    await page.getByRole("button", { name: /^Favoritas/ }).click();
    await expect(page).toHaveURL(/categoria=favoritas/);
    await expect(page.getByText(title(B), { exact: true })).toBeVisible();
    expect(f.requests.length).toBe(count);
  });

  test(`Listas distingue falha de favoritos de vazio confirmado (${device.name})`, async ({ page, baseURL, request }) => {
    assertLocal(baseURL); await page.setViewportSize(device.viewport);
    await setup(page, baseURL, request, { failFavorites: B, privateProfiles: [A] });
    await page.goto(routeFor(A)); await expect(page.getByText(title(A), { exact: true })).toBeVisible();
    await navigate(page, routeFor(B));
    await expect(page.getByText("Não foi possível abrir a lista", { exact: true })).toBeVisible();
    await expect(page.getByText(title(A), { exact: true })).toHaveCount(0);
    await expect(page.getByText("Nenhum item encontrado", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Organizando a lista...", { exact: true })).toHaveCount(0);
  });
}
