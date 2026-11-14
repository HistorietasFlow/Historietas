import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ launchOptions: { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined } });

const A = "10000000-0000-0000-0000-000000000001";
const B = "10000000-0000-0000-0000-000000000002";
const X = "20000000-0000-0000-0000-000000000001";
const Y = "20000000-0000-0000-0000-000000000002";
const row = (id, nome) => ({ id, user_id: id, nome, username: nome.toLowerCase(), avatar_url: "" });
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; };
const user = id => ({ id, aud: "authenticated", role: "authenticated", email: `${id}@example.invalid`, app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" });
function session(id) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = [Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"), Buffer.from(JSON.stringify({ sub: id, aud: "authenticated", role: "authenticated", exp })).toString("base64url"), "local-inert-signature"].join(".");
  return { access_token: token, refresh_token: "local-inert-refresh", expires_at: exp, expires_in: 3600, token_type: "bearer", user: user(id) };
}

// HTTP/SDK controlados sobre a aplicação real. Não acessa Supabase nem credenciais reais.
async function setup(page, baseURL, options = {}) {
  expect(baseURL).toMatch(/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/);
  const origin = new URL(baseURL).origin;
  const apiURL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:55459";
  const storageKey = `sb-${new URL(apiURL).hostname.split(".")[0]}-auth-token`;
  let owner = null;
  const stats = { searches: [], followed: [], auth: 0, writes: [] }, pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.route("**/*", async route => {
    const request = route.request(), url = new URL(request.url());
    const json = (value, status = 200) => route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": origin, "content-range": "0-0/0" }, body: JSON.stringify(value) });
    if (url.pathname.startsWith("/auth/v1/")) {
      ++stats.auth;
      return json(owner ? user(owner) : { code: "session_not_found", message: "sem sessão" }, owner ? 200 : 401);
    }
    if (url.pathname.startsWith("/rest/v1/")) {
      const pattern = url.searchParams.get("nome") || url.searchParams.get("username");
      if (url.pathname.endsWith("/profiles") && pattern?.startsWith("ilike.")) {
        const term = pattern.slice("ilike.%".length, -1);
        stats.searches.push({ term, select: url.searchParams.get("select"), limit: url.searchParams.get("limit"), owner });
        const result = await (options.search ?? (async () => ({ rows: [row(X, "Ana")] })))(term, owner);
        return json(result.rows ?? { message: "falha controlada" }, result.status ?? 200);
      }
      if (url.pathname.endsWith("/profiles")) return json(owner ? [row(owner, owner === A ? "Conta A" : "Conta B")] : []);
      if (url.pathname.endsWith("/seguindo_usuarios") && url.searchParams.get("select") === "seguido_id" && url.searchParams.get("limit") === "5000") {
        stats.followed.push(owner);
        return json((await options.followed?.(owner) ?? []).map(id => ({ seguido_id: id })));
      }
      if (url.pathname.endsWith("/rpc/solicitar_ou_seguir_usuario")) {
        stats.writes.push(owner);
        const result = await (options.follow ?? (async () => "seguindo"))(owner);
        return json(result);
      }
      if (url.pathname.endsWith("/rpc/usuario_e_admin")) return json(false);
      // maybeSingle usa representação singular; nenhuma relação prévia na fixture.
      if (request.headers().accept?.includes("vnd.pgrst.object")) return json(null);
      return json([]);
    }
    if (url.origin === origin) return route.continue();
    return route.fulfill({ status: 403, body: "externo bloqueado pela fixture" });
  });
  async function account(id) {
    owner = id;
    const data = id ? session(id) : null;
    await page.context().clearCookies({ name: storageKey });
    if (data) await page.context().addCookies([{ name: storageKey, value: `base64-${Buffer.from(JSON.stringify(data)).toString("base64url")}`, url: origin, sameSite: "Lax" }]);
    await page.evaluate(({ data, storageKey }) => {
      const channel = new BroadcastChannel(storageKey);
      channel.postMessage({ event: data ? "SIGNED_IN" : "SIGNED_OUT", session: data });
      channel.close();
    }, { data, storageKey });
  }
  // Inicializa anonimamente. A sessão simulada fica somente no cliente e não
  // é enviada ao middleware/servidor ou a um Supabase real da CI.
  const initialized = page.waitForRequest(request => new URL(request.url()).pathname.endsWith("/rest/v1/comunidade_posts"));
  await page.goto("/comunidade"); await initialized;
  await account(A);
  await expect.poll(() => stats.followed.includes(A)).toBe(true);
  const input = page.getByRole("textbox", { name: "Buscar publicações ou usuários" }).filter({ visible: true });
  if (!await input.count()) await page.getByRole("button", { name: "Abrir busca", exact: true }).click();
  await expect(input).toBeVisible();
  const section = page.getByRole("region", { name: "Usuários encontrados" });
  return { stats, input, section, pageErrors, account };
}

for (const [name, viewport] of [["desktop", { width: 1440, height: 1000 }], ["mobile", { width: 390, height: 844 }]]) {
  test.describe(`Comunidade busca concorrente ${name}`, () => {
    test.use({ viewport });

    test("termos rápidos, resposta antiga, falha e recuperação mantêm lista atual", async ({ page, baseURL }) => {
      const old = deferred(); let oldPending = true;
      const h = await setup(page, baseURL, { search: async term => {
        if (term === "Ana" && oldPending) await old.promise;
        if (term === "Erro") return { status: 403 };
        return { rows: [row(term === "Bia" ? Y : X, term)] };
      } });
      await h.input.fill("An"); await h.input.fill("Ana");
      await expect.poll(() => h.stats.searches.filter(call => call.term === "Ana").length).toBe(2);
      const authAtSearch = h.stats.auth;
      await h.input.fill("Bia");
      await expect(h.section.getByRole("link", { name: "Bia", exact: true })).toBeVisible();
      oldPending = false; old.resolve();
      await page.evaluate(() => new Promise(requestAnimationFrame));
      await expect(h.section.getByRole("link", { name: "Ana", exact: true })).toHaveCount(0);
      await h.input.fill("Erro");
      await expect(h.section.getByRole("link", { name: "Bia", exact: true })).toHaveCount(0);
      await expect(h.section.getByText("Nenhum usuário encontrado.")).toBeVisible();
      await h.input.fill("Ana");
      await expect(h.section.getByRole("link", { name: "Ana", exact: true })).toBeVisible();
      expect(h.stats.searches.some(call => call.term === "An")).toBe(false);
      expect(h.stats.searches).toHaveLength(8);
      expect(h.stats.auth).toBe(authAtSearch);
      expect(h.stats.searches.every(call => call.limit === "20" && ["id,user_id,nome,avatar_url", "id,user_id,nome,avatar_url,username"].includes(call.select))).toBe(true);
      await expect(h.input).toBeFocused();
      const axe = await new AxeBuilder({ page }).include('section[aria-label="Usuários encontrados"]').analyze();
      expect(axe.violations).toEqual([]);
      expect(h.pageErrors).toEqual([]);
    });

    test("carga inicial atrasada mantém seguir e demais IDs remotos", async ({ page, baseURL }) => {
      const load = deferred();
      const h = await setup(page, baseURL, {
        followed: async () => { await load.promise; return [Y]; },
        search: async term => ({ rows: [row(term === "Bia" ? Y : X, term)] }),
      });
      await h.input.fill("Ana");
      const button = h.section.getByRole("button", { name: "Seguir", exact: true });
      await button.click();
      await expect(h.section.getByRole("button", { name: "Seguindo", exact: true })).toBeVisible();
      const loaded = page.waitForResponse(response => response.url().includes("/seguindo_usuarios?") && new URL(response.url()).searchParams.get("limit") === "5000");
      load.resolve(); await loaded;
      await h.input.fill("Bia");
      await expect(h.section.getByRole("button", { name: "Seguindo", exact: true })).toBeVisible();
      await h.input.fill("Ana");
      await expect(h.section.getByRole("button", { name: "Seguindo", exact: true })).toBeVisible();
      expect(h.stats.writes).toEqual([A]);
      expect(h.pageErrors).toEqual([]);
    });

    test("troca de conta e logout invalidam resultado de busca em voo", async ({ page, baseURL }) => {
      const old = deferred(), visitor = deferred();
      const h = await setup(page, baseURL, { search: async (_term, owner) => {
        if (owner === A) await old.promise;
        if (!owner) await visitor.promise;
        return { rows: [row(owner === A ? X : Y, owner === A ? "Ana antiga" : owner ? "Ana atual" : "Ana pública")] };
      } });
      await h.input.fill("Ana");
      await expect.poll(() => h.stats.searches.filter(call => call.owner === A).length).toBe(2);
      await h.account(B);
      await expect.poll(() => h.stats.followed.includes(B)).toBe(true);
      await expect(h.section.getByRole("link", { name: "Ana atual", exact: true })).toBeVisible();
      old.resolve();
      await page.evaluate(() => new Promise(requestAnimationFrame));
      await expect(h.section.getByRole("link", { name: "Ana antiga", exact: true })).toHaveCount(0);
      await h.account(null);
      await expect.poll(() => h.stats.searches.filter(call => call.owner === null).length).toBe(2);
      await expect(h.section.getByRole("link", { name: "Ana atual", exact: true })).toHaveCount(0);
      visitor.resolve();
      await expect(h.section.getByRole("link", { name: "Ana pública", exact: true })).toBeVisible();
      expect(h.pageErrors).toEqual([]);
    });
  });
}
