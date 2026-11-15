import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { loadApplicationModule as load } from "../helpers/load-application-module.mjs";

const { criarEntregaPrivadaCapa } = load("lib/server/capas/entrega-privada.ts", { "server-only": {} });
const id = "c0200000-0000-4000-8000-000000000001";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const request = (options = {}, path = `/api/capas-obras/${id}`) => new Request(`http://localhost${path}`, options);
const upstream = (options = {}) => new Response(png, { headers: { "content-type": "image/png",
  "cache-control": "public, max-age=31536000", etag: "private-version", "set-cookie": "secret=value",
  location: "https://storage.test/private/path", "content-range": "bytes 0-10/20" }, ...options });

function setup(overrides = {}) {
  const events = [];
  const handle = criarEntregaPrivadaCapa({
    disponivel: () => true,
    autenticar: async () => { events.push("auth"); return { usuarioId: "A" }; },
    autorizar: async (obraId, identidade, req, signal) => {
      events.push("authorize"); assert.equal(obraId, id); assert.equal(identidade.usuarioId, "A");
      assert.ok(req instanceof Request); assert.ok(signal instanceof AbortSignal);
      return {
        async ler(options) { events.push("read"); assert.equal(options.cache, "no-store");
          assert.equal(options.redirect, "error"); assert.equal(options.signal, signal); return upstream(); },
        async revalidar(received) { events.push("confirm"); assert.equal(received, signal); return true; },
      };
    },
    ...overrides,
  });
  return { handle, events };
}

function noStore(res) {
  assert.equal(res.headers.get("cache-control"), "private, no-store, max-age=0, must-revalidate");
  for (const key of ["cdn-cache-control", "vercel-cdn-cache-control", "surrogate-control"]) assert.equal(res.headers.get(key), "no-store");
  assert.equal(res.headers.get("pragma"), "no-cache"); assert.equal(res.headers.get("expires"), "0");
  assert.equal(res.headers.get("vary"), "Cookie, Authorization");
  assert.equal(res.headers.get("cross-origin-resource-policy"), "same-origin");
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  for (const key of ["etag", "last-modified", "location", "set-cookie", "content-range", "access-control-allow-origin"]) assert.equal(res.headers.get(key), null, key);
}

test("GET e HEAD passam pela mesma autorização e conferência antes de devolver bytes/metadados", async () => {
  for (const method of ["GET", "HEAD"]) {
    const { handle, events } = setup();
    const res = await handle(request({ method }));
    assert.equal(res.status, 200); noStore(res);
    assert.deepEqual(events, ["auth", "authorize", "read", "auth", "confirm"]);
    assert.equal(res.headers.get("content-type"), "image/png");
    assert.equal(res.headers.get("content-length"), String(png.length));
    assert.deepEqual(Buffer.from(await res.arrayBuffer()), method === "HEAD" ? Buffer.alloc(0) : png);
  }
});

test("gate desativado/indefinido e todas as falhas têm no-store, inclusive HEAD sem corpo", async () => {
  const cases = [
    [{ disponivel: () => false }, 503], [{ disponivel: () => undefined }, 503],
    [{ disponivel: () => { throw new Error("segredo"); } }, 503],
    [{ autenticar: async () => null }, 401],
    [{ autenticar: async () => { throw new Error("segredo"); } }, 503],
    [{ autorizar: async () => null }, 404],
    [{ autorizar: async () => { throw new Error("bucket/token/caminho"); } }, 503],
  ];
  for (const [overrides, expected] of cases) for (const method of ["GET", "HEAD"]) {
    const { handle, events } = setup(overrides);
    const res = await handle(request({ method })); assert.equal(res.status, expected); noStore(res);
    const body = await res.text();
    if (method === "HEAD") assert.equal(body, "");
    assert.doesNotMatch(body, /segredo|bucket|token|caminho/);
    assert.ok(!events.includes("read"));
    if (overrides.disponivel) assert.deepEqual(events, []);
  }
});

test("entrada inválida, caminhos, query, Range, origem externa e métodos não abrem fonte", async () => {
  const cases = [
    [request({}, "/api/capas-obras/../privado"), 400],
    [request({}, `/api/capas-obras/${id}?url=https://storage.test`), 400],
    [request({}, `/api/capas-obras/%63${id.slice(1)}`), 400],
    [request({ headers: { range: "bytes=0-5" } }), 416],
    [request({ headers: { origin: "https://atacante.test" } }), 403],
    [request({ headers: { "sec-fetch-site": "cross-site" } }), 403],
    ...["POST", "PUT", "PATCH", "DELETE", "OPTIONS"].map(method => [request({ method }), 405]),
  ];
  for (const [req, status] of cases) {
    const { handle, events } = setup(); const res = await handle(req);
    assert.equal(res.status, status); noStore(res); assert.deepEqual(events, []);
    if (status === 405) assert.equal(res.headers.get("allow"), "GET, HEAD");
  }
});

test("condicionais não produzem 304 nem reutilizam autorização/resposta entre requisições", async () => {
  const { handle, events } = setup();
  for (let i = 0; i < 2; i++) {
    const res = await handle(request({ headers: { "if-none-match": "*", "if-modified-since": "Fri, 13 Nov 2026 00:00:00 GMT" } }));
    assert.equal(res.status, 200); noStore(res); assert.deepEqual(Buffer.from(await res.arrayBuffer()), png);
  }
  assert.deepEqual(events, ["auth", "authorize", "read", "auth", "confirm", "auth", "authorize", "read", "auth", "confirm"]);
});

test("negação da revalidação durante IO descarta bytes antes de enviar", async () => {
  // O motivo real (sessão/classificação/versão) pertence ao adaptador pendente.
  const entered = deferred(), release = deferred(); let vigente = true;
  const { handle } = setup({ autorizar: async () => ({
    async ler() { entered.resolve(); await release.promise; return upstream(); },
    async revalidar() { return vigente; },
  }) });
  const pending = handle(request()); await entered.promise;
  vigente = false; release.resolve();
  const res = await pending; assert.equal(res.status, 404); noStore(res);
  assert.doesNotMatch(await res.text(), /iVBOR|storage|private-version/);
});

test("logout/troca de identidade e falha da conferência final nunca servem bytes já lidos", async () => {
  for (const next of [null, { usuarioId: "B" }]) {
    let calls = 0; const { handle } = setup({ autenticar: async () => ++calls === 1 ? { usuarioId: "A" } : next });
    const res = await handle(request()); assert.equal(res.status, 401); noStore(res);
  }
  for (const step of ["ler", "revalidar"]) {
    const { handle } = setup({ autorizar: async () => ({
      ler: async () => { if (step === "ler") throw new Error("segredo"); return upstream(); },
      revalidar: async () => { throw new Error("segredo"); },
    }) });
    const res = await handle(request()); assert.equal(res.status, 503); noStore(res); assert.doesNotMatch(await res.text(), /segredo/);
  }
});

test("duas identidades concorrentes não compartilham fonte, resultado ou decisão", async () => {
  const entered = deferred(), release = deferred(); let revogada = false;
  const { handle } = setup({
    autenticar: async req => ({ usuarioId: req.headers.get("x-teste-identidade") }),
    autorizar: async (_id, identidade) => ({
      async ler() { if (identidade.usuarioId === "A") { entered.resolve(); await release.promise; } return upstream(); },
      revalidar: async () => identidade.usuarioId === "B" || !revogada,
    }),
  });
  const old = handle(request({ headers: { "x-teste-identidade": "A" } })); await entered.promise;
  revogada = true;
  const other = await handle(request({ headers: { "x-teste-identidade": "B" } }));
  assert.equal(other.status, 200); noStore(other); assert.deepEqual(Buffer.from(await other.arrayBuffer()), png);
  release.resolve(); const rejected = await old; assert.equal(rejected.status, 404); noStore(rejected);
});

test("falha fechada para redirect, MIME não permitido, corpo vazio, truncado, grande ou fragmentado", async () => {
  for (const source of [
    () => upstream({ status: 302 }), () => upstream({ headers: { "content-type": "image/svg+xml" } }),
    () => upstream({ headers: { "content-type": "text/html" } }),
    () => new Response(null, { headers: { "content-type": "image/png" } }),
    () => new Response(new Uint8Array(2 * 1024 * 1024 + 1), { headers: { "content-type": "image/png", "content-length": "1" } }),
    () => new Response(new ReadableStream({ pull(c) { c.error(new Error("upstream secreto")); } }), { headers: { "content-type": "image/png" } }),
    () => { let n = 0; return new Response(new ReadableStream({ pull(c) { if (n++ < 4097) c.enqueue(new Uint8Array([1])); else c.close(); } }), { headers: { "content-type": "image/png" } }); },
  ]) {
    const { handle } = setup({ autorizar: async () => ({ ler: async () => source(), revalidar: async () => true }) });
    const res = await handle(request()); assert.equal(res.status, 503); noStore(res); assert.doesNotMatch(await res.text(), /secreto|storage/);
  }
});

test("aborto/prazo de IO e fechamento do gate antes da entrega não confirmam resposta", async t => {
  let enabled = true;
  const { handle } = setup({ disponivel: () => enabled, autorizar: async () => ({
    ler: async () => upstream(), revalidar: async () => { enabled = false; return true; },
  }) });
  const disabled = await handle(request()); assert.equal(disabled.status, 503); noStore(disabled);

  for (const timeout of [false, true]) {
    const entered = deferred(), controller = new AbortController();
    const { handle: slow } = setup({ autorizar: async () => ({
      async ler() { entered.resolve(); return new Promise(() => {}); }, revalidar: async () => true,
    }) });
    if (timeout) t.mock.timers.enable({ apis: ["setTimeout"] });
    const pending = slow(request({ signal: controller.signal })); await entered.promise;
    if (timeout) t.mock.timers.tick(10_001); else controller.abort();
    const res = await pending; assert.equal(res.status, 503); noStore(res);
    if (timeout) t.mock.timers.reset();
  }
});

test("Route Handler real permanece desativado em todos os métodos, sem autenticar nem autorizar", async () => {
  let authCalls = 0;
  const route = load("app/api/capas-obras/[[...obraId]]/route.ts", { "server-only": {},
    "../../../../lib/server/capas/autenticar-usuario": { autenticarUsuarioCapa: async () => { authCalls++; throw new Error("não chamar"); } },
  });
  for (const method of ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    const res = await route[method](request({ method })); assert.equal(res.status, 503); noStore(res);
    if (method === "HEAD") assert.equal(await res.text(), "");
  }
  assert.equal(authCalls, 0);
  assert.equal(route.dynamic, "force-dynamic"); assert.equal(route.revalidate, 0); assert.equal(route.fetchCache, "force-no-store");
  const source = readFileSync(new URL("../../app/api/capas-obras/[[...obraId]]/route.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /process\.env|\.rpc\(|\.storage|createSignedUrl|service_role/);
});
