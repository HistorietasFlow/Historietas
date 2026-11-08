import assert from "node:assert/strict";
import test from "node:test";
import { criarRecepcaoPrevalidacao, ErroPrevalidacao } from "../../lib/server/capitulos-ilustrados/receber-prevalidacao-pagina.ts";

const RESERVA = "e9400000-0000-4000-8000-000000000001";
const CAPITULO = "e9300000-0000-4000-8000-000000000001";
const canonica = { mimeType: "image/png", largura: 12, altura: 18, tamanhoBytes: 90, sha256: "a".repeat(64) };
function request(body = new Uint8Array([1, 2, 3]), overrides = {}, signal) {
  return new Request("http://localhost/api/capitulos-ilustrados/prevalidar-pagina", {
    method: "POST", headers: { authorization: "Bearer teste", "content-type": "application/octet-stream",
      "x-reserva-id": RESERVA, "x-capitulo-id": CAPITULO, "x-versao-esperada": "0", ...overrides },
    body, signal, duplex: "half",
  });
}
function setup(overrides = {}) {
  const events = [];
  const deps = {
    autenticar: async () => { events.push("auth"); return { usuarioId: "A" }; },
    limitar: async () => { events.push("limit"); return { permitido: true, tentarNovamenteSegundos: 0 }; },
    conferir: async () => { events.push("check"); return { usuarioId: "A", mimeType: "image/png",
      expiraEm: "2030-01-01T00:00:00Z", versaoEsperada: 0 }; },
    validar: async (bytes) => { events.push("decode"); assert.deepEqual([...bytes], [1, 2, 3]); return canonica; },
    ...overrides,
  };
  return { post: criarRecepcaoPrevalidacao(deps), events };
}

test("valida somente apos autenticar/autorizar; revalida e declara ausencia de upload", async () => {
  const { post, events } = setup();
  const result = await post(request());
  assert.equal(result.status, 200);
  assert.deepEqual(events, ["auth", "limit", "check", "decode", "auth", "check"]);
  assert.deepEqual(await result.json(), { estado: "validado_sem_upload", uploadHabilitado: false, ...canonica });
  assert.equal(result.headers.get("cache-control"), "no-store");
  assert.equal(result.headers.get("x-content-type-options"), "nosniff");
});

test("headers invalidos, credenciais ausentes e origem externa nao executam decoder", async () => {
  for (const [headers, status] of [
    [{ authorization: "" }, 401], [{ origin: "https://atacante.test" }, 403],
    [{ "content-type": "multipart/form-data" }, 415], [{ "x-reserva-id": "../alheia" }, 400],
    [{ "x-versao-esperada": "9007199254740992" }, 400],
    [{ "content-length": "2097153" }, 413], [{ "content-length": "-1" }, 413],
  ]) {
    const { post, events } = setup();
    assert.equal((await post(request(undefined, headers))).status, status);
    assert.deepEqual(events, []);
  }
});

test("anonimo, falha de reserva e rate limit nao leem o corpo nem decodificam", async () => {
  for (const [overrides, status] of [
    [{ autenticar: async () => null }, 401],
    [{ conferir: async () => { throw new ErroPrevalidacao(403, "reserva_indisponivel"); } }, 403],
    [{ limitar: async () => ({ permitido: false, tentarNovamenteSegundos: 12 }) }, 429],
  ]) {
    let reads = 0;
    const stream = new ReadableStream({ pull() { reads++; } }, { highWaterMark: 0 });
    const { post, events } = setup(overrides);
    const result = await post(request(stream));
    assert.equal(result.status, status);
    if (status === 429) assert.equal(result.headers.get("retry-after"), "12");
    assert.equal(reads, 0);
    assert.ok(!events.includes("decode"));
  }
});

test("corpo chunked e Content-Length mentiroso nao ultrapassam 2 MiB", async () => {
  let canceled = 0;
  const stream = new ReadableStream({ start(controller) {
    controller.enqueue(new Uint8Array(2 * 1024 * 1024));
    controller.enqueue(new Uint8Array([1]));
  }, cancel() { canceled++; } });
  const { post, events } = setup();
  assert.equal((await post(request(stream, { "content-length": "1" }))).status, 413);
  assert.equal(canceled, 1);
  assert.ok(!events.includes("decode"));
});

test("corpo vazio e fragmentacao adversarial sao recusados", async () => {
  const { post, events } = setup();
  assert.equal((await post(request(new Uint8Array()))).status, 400);
  let chunks = 0;
  const stream = new ReadableStream({ pull(controller) {
    if (++chunks <= 4097) controller.enqueue(new Uint8Array([1]));
    else controller.close();
  } });
  assert.equal((await post(request(stream))).status, 413);
  assert.ok(!events.includes("decode"));
});

test("cancelamento durante recepcao libera capacidade, mesmo com cancel pendente", async () => {
  const controller = new AbortController();
  const { post } = setup();
  let pulling;
  const started = new Promise(resolve => { pulling = resolve; });
  const stream = new ReadableStream({ pull() { pulling(); }, cancel() { return new Promise(() => {}); } });
  const result = post(request(stream, {}, controller.signal));
  await started;
  controller.abort();
  assert.equal((await result).status, 408);
  assert.equal((await post(request())).status, 200);
});

test("logout, troca de conta, expiracao/release/versao durante decode nao aprovam resposta antiga", async () => {
  for (const status of [401, 403, 409, 410]) {
    let authCalls = 0;
    let checkCalls = 0;
    const { post } = setup({
      autenticar: async () => ++authCalls === 2 && status === 401 ? { usuarioId: "B" } : { usuarioId: "A" },
      conferir: async () => {
        if (++checkCalls === 2) throw new ErroPrevalidacao(status, "estado_alterado");
        return { usuarioId: "A", mimeType: "image/png", expiraEm: "2030-01-01T00:00:00Z", versaoEsperada: 0 };
      },
    });
    assert.equal((await post(request())).status, status);
  }
});

test("prazo de recepcao cancela stream lenta e limpa o timer", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let started;
  const reading = new Promise(resolve => { started = resolve; });
  const stream = new ReadableStream({ pull() { started(); } }, { highWaterMark: 0 });
  const { post } = setup();
  const result = post(request(stream));
  await reading;
  t.mock.timers.tick(10_001);
  assert.equal((await result).status, 408);
  assert.equal((await post(request())).status, 200);
  t.mock.timers.runAll();
});

test("formato e identidade divergentes sao recusados; erros privados nao vazam", async () => {
  const cases = [
    [{ validar: async () => ({ ...canonica, mimeType: "image/webp" }) }, 422],
    [{ conferir: async () => ({ usuarioId: "B", versaoEsperada: 0 }) }, 409],
    [{ validar: async () => { throw new Error("segredo/token/caminho"); } }, 503],
    [{ validar: async () => { throw new ErroPrevalidacao(422, "imagem_invalida"); } }, 422],
  ];
  for (const [overrides, status] of cases) {
    const { post } = setup(overrides);
    const result = await post(request());
    assert.equal(result.status, status);
    assert.doesNotMatch(await result.text(), /segredo|token|caminho/);
  }
});

test("no maximo duas recepcoes simultaneas, sem fila; erro libera slot", async () => {
  let finish;
  let entered = 0;
  const gate = new Promise(resolve => { finish = resolve; });
  let started;
  const ready = new Promise(resolve => { started = resolve; });
  const { post } = setup({ validar: async () => {
    if (++entered === 2) started();
    await gate;
    throw new ErroPrevalidacao(422, "imagem_invalida");
  } });
  const requests = [post(request()), post(request())];
  await ready;
  assert.equal((await post(request())).status, 503);
  finish();
  assert.deepEqual((await Promise.all(requests)).map(result => result.status), [422, 422]);
  assert.equal((await setup().post(request())).status, 200);
});
