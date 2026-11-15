// Verificação local de UI: requer build/start com URL Supabase apontando ao
// fixture abaixo. Não usa banco, Storage, credenciais ou serviços remotos.
// E2E_BASE_URL=http://127.0.0.1:3407 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55459 node qa/scripts/check-adicionar-capitulo-recovery.mjs
import assert from "node:assert/strict";
import http from "node:http";
import { mkdir } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const app = new URL(process.env.E2E_BASE_URL || "http://127.0.0.1:3407");
const api = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:55459");
for (const url of [app, api]) assert.ok(url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname) && url.port, "Somente loopback HTTP com porta explícita");
assert.notEqual(app.port, api.port);
const A = "10000000-0000-0000-0000-000000000001", B = "10000000-0000-0000-0000-000000000002", W = "20000000-0000-0000-0000-000000000001";
const text = "Este é um capítulo de texto com conteúdo suficiente para validar a criação.";
const storageKey = `sb-${api.hostname.split(".")[0]}-auth-token`;
const report = process.env.RECOVERY_REPORT_DIR || "/tmp/adicionar-capitulo-recovery";
await mkdir(report, { recursive: true });
const user = id => ({ id, aud: "authenticated", role: "authenticated", email: `${id}@example.invalid`, app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {}, created_at: "2026-11-13T12:00:00Z" });
function session(id) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const access_token = [Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"), Buffer.from(JSON.stringify({ sub: id, aud: "authenticated", role: "authenticated", exp })).toString("base64url"), "local-inert-signature"].join(".");
  return { user: user(id), access_token, refresh_token: "local-inert-refresh", token_type: "bearer", expires_at: exp, expires_in: 3600 };
}
const defer = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; };
let scenario;
const fixture = http.createServer(async (req, res) => {
  const current = scenario;
  const headers = { "content-type": "application/json", "access-control-allow-origin": app.origin, "access-control-allow-headers": "*", "access-control-allow-methods": "GET,POST,PATCH,DELETE,HEAD,OPTIONS", "content-range": "0-0/0" };
  if (req.method === "OPTIONS") { res.writeHead(204, headers); res.end(); return; }
  const json = (value, status = 200) => { res.writeHead(status, headers); res.end(JSON.stringify(value)); };
  try {
    const url = new URL(req.url, api), chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : null;
    let owner;
    try { owner = JSON.parse(Buffer.from((req.headers.authorization || "").split(".")[1], "base64url").toString()).sub; } catch { owner = null; }
    if (url.pathname.startsWith("/auth/v1/")) return json([A, B].includes(owner) ? user(owner) : { message: "sessão ausente", code: "session_not_found" }, owner ? 200 : 401);
    if (!current) return json([]);
    if (url.pathname.endsWith("/rpc/status_aceite_termos_publicacao")) return json(true);
    if (url.pathname.endsWith("/rpc/usuario_e_admin")) return json(false);
    if (url.pathname.endsWith("/rpc/criar_notificacoes_capitulo")) { current.notifications++; return json(1); }
    if (url.pathname.endsWith("/profiles")) return json(owner ? [{ id: owner, user_id: owner, nome: "Autora", avatar_url: "" }] : []);
    if (url.pathname.endsWith("/obras")) {
      const own = owner === A && (!url.searchParams.get("user_id") || url.searchParams.get("user_id") === `eq.${A}`);
      return json(own ? [{ id: W, user_id: A, titulo: "Obra fixture", autor: "Autora", genero: "Fantasia", formato: "Romance", classificacao_indicativa: "12+", sinopse: "Fixture local", tags: [], capa_url: "", publicado: true, slug: "obra-fixture", criada_em: "2026-11-13T12:00:00Z", capitulos: [...current.rows.values()] }] : []);
    }
    if (url.pathname.endsWith("/diario_atividades") && req.method === "POST") { current.diary.push(body); return json(null, 201); }
    if (url.pathname.endsWith("/capitulos")) {
      if (req.method === "POST") {
        current.posts.push(body);
        if (owner !== A || body.user_id !== A || body.obra_id !== W) return json({ code: "42501", message: "negado" }, 403);
        if (current.kind === "conflict" && current.posts.length === 1) {
          current.rows.set(B, { id: B, obra_id: W, user_id: A, titulo: "Outro capítulo", texto: text, ordem: 1, publicado: true, tipo_conteudo: "texto", criado_em: "2026-11-13T12:00:00Z" });
          return json({ code: "23505", message: "capitulos_obra_id_ordem_key" }, 409);
        }
        if (current.rows.has(body.id) || [...current.rows.values()].some(row => row.ordem === body.ordem)) {
          return json({ code: "23505", message: "capitulos_pkey ou capitulos_obra_id_ordem_key" }, 409);
        }
        const row = { ...body, tipo_conteudo: "texto", criado_em: "2026-11-13T12:00:00Z" };
        current.rows.set(row.id, row); current.commits++;
        if (current.kind === "lost") return json({ code: "", message: "gateway perdeu a resposta após o commit" }, 504);
        if (current.kind === "reset") { req.socket.destroy(); return; }
        if (current.kind === "account") await current.gate.promise;
        return json(row, 201);
      }
      const id = url.searchParams.get("id")?.replace(/^eq\./, "");
      if (id) return json(owner === A && current.rows.has(id) ? [current.rows.get(id)] : []);
      const last = Math.max(0, ...[...current.rows.values()].map(row => row.ordem));
      return json(last ? [{ ordem: last }] : []);
    }
    return json([]);
  } catch (error) { if (!res.destroyed) json({ message: error.message }, 500); }
});
await new Promise((resolve, reject) => { fixture.once("error", reject); fixture.listen(Number(api.port), api.hostname, resolve); });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || "/usr/bin/chromium" });
let passed = 0;
try {
  for (const [device, viewport] of [["desktop", { width: 1440, height: 1000 }], ["mobile", { width: 390, height: 844 }]]) {
    for (const kind of ["success", "lost", "reset", "conflict", "cache", "account"]) {
      scenario = { kind, rows: new Map(), posts: [], diary: [], notifications: 0, commits: 0, gate: defer() };
      const context = await browser.newContext({ viewport, locale: "pt-BR" }), page = await context.newPage();
      await page.addInitScript(() => {
        const fetchOriginal = window.fetch;
        window.__postsCapitulos = 0;
        window.fetch = (input, init) => {
          if (String(input).includes("/rest/v1/capitulos?") && init?.method === "POST") window.__postsCapitulos++;
          return fetchOriginal(input, init);
        };
      });
      const errors = []; page.on("pageerror", error => errors.push(error.message));
      await context.tracing.start({ screenshots: true, snapshots: true });
      async function account(id) {
        const data = session(id);
        await context.clearCookies({ name: storageKey });
        await context.addCookies([{ name: storageKey, value: `base64-${Buffer.from(JSON.stringify(data)).toString("base64url")}`, url: app.origin, sameSite: "Lax" }]);
        if (page.url().startsWith(app.origin)) await page.evaluate(({ storageKey, data }) => { const channel = new BroadcastChannel(storageKey); channel.postMessage({ event: "SIGNED_IN", session: data }); channel.close(); }, { storageKey, data });
      }
      try {
        await account(A);
        await page.route("**/*", route => [app.origin, api.origin].includes(new URL(route.request().url()).origin) ? route.continue() : route.fulfill({ status: 403, body: "externo bloqueado" }));
        await page.goto(`${app.origin}/adicionar-capitulo?obraId=${W}`);
        const title = page.getByLabel("Título do capítulo", { exact: true }), body = page.getByLabel("Texto do capítulo", { exact: true });
        await expect(body).toBeVisible();
        await title.fill("Capítulo fixture"); await body.fill(text);
        if (kind === "cache") await page.evaluate(({ key }) => {
          const original = Storage.prototype.getItem;
          Storage.prototype.getItem = function (name) { return name === key && window.__falhaCache ? "{inválido" : original.call(this, name); };
          window.__falhaCache = true;
        }, { key: `historietas-obras:${A}` });
        await page.locator("form").evaluate(form => { form.requestSubmit(); form.requestSubmit(); });
        await expect.poll(() => scenario.posts.length >= 1).toBe(true);
        const fetchesAntesDeReload = await page.evaluate(() => window.__postsCapitulos);
        if (kind === "reset") {
          await expect(page.getByRole("button", { name: /^(Criado|Verificar criação)$/ })).toBeVisible();
          const verify = page.getByRole("button", { name: "Verificar criação", exact: true });
          if (await verify.isVisible()) await verify.click();
        } else if (kind === "account") {
          await account(B);
          await expect(page.locator("main").getByRole("alert")).toContainText("A conta ou a obra mudou");
          scenario.gate.resolve();
          await expect(body).toHaveCount(0);
          await account(A); await page.reload(); await expect(body).toHaveValue(text);
          await page.getByRole("button", { name: "Verificar criação", exact: true }).click();
        } else if (kind === "lost" || kind === "cache") {
          await expect(page.getByRole("button", { name: "Verificar criação", exact: true })).toBeVisible();
          await expect(body).toHaveValue(text);
          if (kind === "lost") { await page.reload(); await expect(body).toHaveValue(text); }
          if (kind === "cache") await page.evaluate(() => { window.__falhaCache = false; });
          await page.getByRole("button", { name: "Verificar criação", exact: true }).click();
        } else if (kind === "conflict") {
          await expect(page.getByRole("status")).toContainText("Outra criação ocupou esta ordem");
          await expect(body).toHaveValue(text);
          await page.getByRole("button", { name: "Criar capítulo", exact: true }).click();
        }
        await expect(page.getByRole("button", { name: "Criado", exact: true })).toBeDisabled();
        await expect(page.getByRole("link", { name: "Ler capítulo", exact: true })).toBeVisible();
        assert.equal(scenario.commits, 1);
        assert.equal(fetchesAntesDeReload, 1);
        if (kind !== "reset") assert.equal(scenario.posts.length, kind === "conflict" ? 2 : 1);
        assert.equal(new Set(scenario.posts.map(item => item.id)).size, kind === "conflict" ? 2 : 1);
        if (!["lost", "reset", "account"].includes(kind)) {
          await expect.poll(() => scenario.notifications).toBe(1);
          await expect.poll(() => scenario.diary.length).toBe(1);
        }
        assert.equal(scenario.notifications, ["lost", "reset", "account"].includes(kind) ? 0 : 1);
        assert.equal(scenario.diary.length, ["lost", "reset", "account"].includes(kind) ? 0 : 1);
        if (scenario.diary.length) assert.equal(scenario.diary[0].id, scenario.posts.at(-1).id);
        if (kind === "conflict") { assert.equal(scenario.posts[1].ordem, 2); assert.notEqual(scenario.posts[0].id, scenario.posts[1].id); }
        if (kind === "success") {
          const axe = await new AxeBuilder({ page }).include("form").analyze();
          assert.deepEqual(axe.violations, []);
          await page.getByRole("button", { name: "Novo capítulo", exact: true }).click();
          await expect(page.getByRole("button", { name: "Criar capítulo", exact: true })).toBeEnabled();
          assert.equal(scenario.posts.length, 1);
        }
        assert.deepEqual(errors, []);
        await page.screenshot({ path: `${report}/${device}-${kind}.png`, fullPage: true });
        console.log(`PASS ${device} ${kind}`); passed++;
      } catch (error) {
        await page.screenshot({ path: `${report}/${device}-${kind}-failed.png`, fullPage: true });
        throw error;
      } finally {
        scenario.gate.resolve();
        await context.tracing.stop({ path: `${report}/${device}-${kind}.zip` }); await context.close();
      }
    }
  }
  console.log(`${passed}/12 cenários aprovados; fixtures HTTP locais, sem banco/Storage real.`);
} finally {
  await browser.close(); fixture.closeAllConnections(); await new Promise(resolve => fixture.close(resolve));
}
