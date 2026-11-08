import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import test from "node:test";
import sharp from "sharp";
import { conferirPaginaArmazenada } from "../../lib/server/capitulos-ilustrados/conferir-pagina-armazenada.ts";
import { validarImagemPagina } from "../../lib/server/capitulos-ilustrados/validar-imagem-pagina.ts";

const id = (n) => `fd${n}00000-0000-4000-8000-000000000001`;
async function imagem(formato = "png") {
  return validarImagemPagina(await sharp({ create: {
    width: 12, height: 18, channels: 3, background: { r: 140, g: 60, b: 20 },
  } }).toFormat(formato).toBuffer());
}
function fixture(canonica) {
  const recibo = { tentativaId: id(1), reservaId: id(2), usuarioId: id(3), sessaoId: id(4),
    capituloId: id(5), versaoEsperada: 0, objetoId: id(6), objetoVersao: "storage-version-1",
    sha256: canonica.sha256, tamanhoBytes: canonica.tamanhoBytes, largura: canonica.largura,
    altura: canonica.altura, mimeType: canonica.mimeType,
    storagePath: `${id(3)}/capitulos/${id(5)}/${id(2)}.${canonica.extensao}` };
  const info = { id: recibo.objetoId, version: recibo.objetoVersao, name: recibo.storagePath,
    bucketId: "arquivos-obras", size: recibo.tamanhoBytes, contentType: recibo.mimeType };
  const calls = [];
  const fonte = {
    async informar(path, signal) { assert.equal(path, recibo.storagePath); assert.ok(signal instanceof AbortSignal);
      calls.push("info"); return { ...info }; },
    async baixar(path) { assert.equal(path, recibo.storagePath); calls.push("download");
      return new Response(canonica.copiarBytes()).body; },
    async validar(bytes) { calls.push("decode"); return validarImagemPagina(bytes); },
    async remover() { assert.fail("Nunca deve limpar"); },
    async publicar() { assert.fail("Nunca deve publicar"); },
    async liberarCota() { assert.fail("Nunca deve liberar capacidade"); },
  };
  return { recibo, info, fonte, calls, run: () => conferirPaginaArmazenada(recibo, fonte) };
}
function fechado(result) {
  assert.ok(Object.isFrozen(result));
  assert.equal(result.evidencia, "observacao_sem_terminalidade");
  for (const flag of ["terminalidadeComprovada", "publicacaoHabilitada", "limpezaHabilitada", "liberacaoCotaHabilitada"]) {
    assert.equal(result[flag], false, flag);
  }
  assert.equal(Object.hasOwn(result, "storagePath"), false);
  assert.equal(Object.hasOwn(result, "sha256"), false);
  return result.estado;
}

test("verificador permanece server-only, sem importacao em processo cliente", () => {
  const result = spawnSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e",
    'import "./lib/server/capitulos-ilustrados/conferir-pagina-armazenada.ts";'], {
    cwd: new URL("../../", import.meta.url), encoding: "utf8", env: { ...process.env, NODE_OPTIONS: "" },
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cannot be imported from a Client Component/);
});

for (const formato of ["png", "jpeg", "webp"]) {
  test(`confere bytes ${formato} reais, nao um ETag ou o hash do re-encode`, async () => {
    const canonica = await imagem(formato);
    const f = fixture(canonica);
    assert.equal(fechado(await f.run()), "conferido_sem_terminalidade");
    assert.deepEqual(f.calls, ["info", "download", "decode", "info"]);
    const again = await f.run();
    assert.deepEqual(again, await f.run(), "Repetir a observacao e idempotente, nao reenvia upload.");
  });
}

test("recibo invalido, caminho de outra identidade, URL e limites falham antes de IO", async () => {
  const canonica = await imagem();
  for (const change of [{ usuarioId: id(7) }, { storagePath: "https://example.test/a.png" },
    { storagePath: "../outro" }, { objetoVersao: "" }, { sha256: "forjado" },
    { tamanhoBytes: 2_097_153 }, { largura: 2049 }, { altura: 4097 },
    { largura: 2048, altura: 4096 }, { versaoEsperada: Number.MAX_SAFE_INTEGER + 1 },
    { mimeType: "__proto__" }]) {
    const f = fixture(canonica);
    Object.assign(f.recibo, change);
    assert.equal(fechado(await f.run()), "recibo_invalido");
    assert.deepEqual(f.calls, []);
  }
});

test("metadata identica/ETag nao escondem hash divergente dos bytes", async () => {
  const f = fixture(await imagem());
  f.fonte.baixar = async () => new Response(Buffer.alloc(f.recibo.tamanhoBytes, 1)).body;
  f.info.etag = f.recibo.sha256; // Nem mesmo um ETag igual ao hash esperado e prova.
  assert.equal(fechado(await f.run()), "divergente");
  assert.ok(!f.calls.includes("decode"));
});

test("MIME e dimensoes sao derivados do decoder, nao da metadata do Storage", async () => {
  const canonica = await imagem();
  for (const change of [{ largura: 13 }, { altura: 19 }, { mimeType: "image/jpeg" }]) {
    const f = fixture(canonica);
    Object.assign(f.recibo, change);
    if (change.mimeType) f.recibo.storagePath = f.recibo.storagePath.replace(/png$/, "jpg");
    Object.assign(f.info, { name: f.recibo.storagePath, contentType: f.recibo.mimeType });
    assert.equal(fechado(await f.run()), "divergente");
    assert.ok(f.calls.includes("decode"));
  }
});

test("arquivo com hash igual mas binario invalido nao e confirmado", async () => {
  const f = fixture(await imagem());
  const invalid = Buffer.alloc(f.recibo.tamanhoBytes, 1);
  f.recibo.sha256 = createHash("sha256").update(invalid).digest("hex");
  f.fonte.baixar = async () => new Response(invalid).body;
  assert.equal(fechado(await f.run()), "inconclusivo");
});

test("ID, versao, bucket, nome, tamanho ou MIME desconhecidos/divergentes bloqueiam", async () => {
  for (const change of [{ id: id(8) }, { version: "outra" }, { version: undefined },
    { bucketId: "avatars" }, { name: "outra/conta" }, { size: 1 }, { contentType: "text/plain" }]) {
    const f = fixture(await imagem());
    Object.assign(f.info, change);
    assert.equal(fechado(await f.run()), "divergente");
    assert.deepEqual(f.calls, ["info"]);
  }
});

test("troca/exclusao entre leitura e segunda observacao nao confirma versao antiga", async () => {
  for (const after of [null, { version: "substituida" }, { id: id(8) }]) {
    const f = fixture(await imagem());
    let reads = 0;
    f.fonte.informar = async () => ++reads === 1 ? { ...f.info } : after && { ...f.info, ...after };
    assert.equal(fechado(await f.run()), "objeto_alterado");
  }
});

test("ausencia inicial e escrita atrasada: retry so observa, nunca libera nem publica", async () => {
  const f = fixture(await imagem());
  let gravado = false;
  f.fonte.informar = async () => gravado ? { ...f.info } : null;
  assert.equal(fechado(await f.run()), "nao_observado");
  assert.deepEqual(f.calls, []);
  gravado = true; // Barreira deterministica, nao um sleep nem prova de fence fisico.
  assert.equal(fechado(await f.run()), "conferido_sem_terminalidade");
});

test("falha, stream interrompido, bytes a mais/a menos e retry preservam bloqueios", async () => {
  for (const mode of ["info", "download", "interrompido", "excesso", "parcial"]) {
    const canonica = await imagem();
    const f = fixture(canonica);
    const original = { ...f.fonte };
    if (mode === "info") f.fonte.informar = async () => { throw new Error("falha privada"); };
    else f.fonte.baixar = async () => {
      if (mode === "download") throw new Error("rede");
      if (mode === "interrompido") return new ReadableStream({ start(c) { c.error(new Error("conexao perdida")); } });
      return new Response(Buffer.alloc(f.recibo.tamanhoBytes + (mode === "excesso" ? 1 : -1))).body;
    };
    const result = await f.run();
    assert.notEqual(fechado(result), "conferido_sem_terminalidade");
    assert.ok(!JSON.stringify(result).includes("falha privada"));
    Object.assign(f.fonte, original);
    assert.equal(fechado(await f.run()), "conferido_sem_terminalidade");
  }
});

test("cancelamento, concorrencia limitada e cleanup permitem nova leitura sem renovar direitos", async () => {
  const f = fixture(await imagem());
  const controllers = [new AbortController(), new AbortController()];
  let entered = 0;
  let enteredResolve;
  const bothEntered = new Promise((resolve) => { enteredResolve = resolve; });
  const original = f.fonte.informar;
  f.fonte.informar = async () => {
    if (++entered === 2) enteredResolve();
    return new Promise(() => {});
  };
  const pending = controllers.map((c) => conferirPaginaArmazenada(f.recibo, f.fonte, c.signal));
  await bothEntered;
  assert.equal(fechado(await f.run()), "ocupado");
  controllers.forEach((c) => c.abort());
  for (const result of await Promise.all(pending)) assert.equal(fechado(result), "inconclusivo");
  f.fonte.informar = original;
  assert.equal(fechado(await f.run()), "conferido_sem_terminalidade");
});

test("alteracao do recibo pelo chamador apos iniciar nao troca o alvo lido", async () => {
  const f = fixture(await imagem());
  const path = f.recibo.storagePath;
  f.fonte.informar = async (p) => {
    assert.equal(p, path);
    f.recibo.storagePath = "caminho-forjado";
    return { ...f.info };
  };
  f.fonte.baixar = async (p) => { assert.equal(p, path); return new Response((await imagem()).copiarBytes()).body; };
  assert.equal(fechado(await f.run()), "conferido_sem_terminalidade");
});

test("abort anterior nao inicia IO e nao deixa ocupacao/timer pendente", async () => {
  const f = fixture(await imagem());
  const controller = new AbortController(); controller.abort();
  assert.equal(fechado(await conferirPaginaArmazenada(f.recibo, f.fonte, controller.signal)), "inconclusivo");
  assert.deepEqual(f.calls, []);
  assert.equal(fechado(await f.run()), "conferido_sem_terminalidade");
});

test("flood de chunks vazios e limitado e cancela a leitura, nao um writer", async () => {
  const f = fixture(await imagem());
  let cancelou = false;
  f.fonte.baixar = async () => new ReadableStream({
    pull(c) { c.enqueue(new Uint8Array()); }, cancel() { cancelou = true; },
  });
  assert.equal(fechado(await f.run()), "divergente");
  assert.equal(cancelou, true);
});
