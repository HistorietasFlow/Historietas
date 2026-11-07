import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import test from "node:test";
import sharp from "sharp";
import { ErroImagemPagina, LIMITES_IMAGEM_PAGINA, validarImagemPagina } from "../../lib/server/capitulos-ilustrados/validar-imagem-pagina.ts";

const imagem = (format, width = 12, height = 18) => sharp({ create: {
  width, height, channels: 4, background: { r: 180, g: 50, b: 90, alpha: 1 },
} }).toFormat(format).toBuffer();

function rejeita(bytes, codigo) {
  return assert.rejects(validarImagemPagina(bytes), (erro) => {
    assert.ok(erro instanceof ErroImagemPagina);
    if (codigo) assert.equal(erro.codigo, codigo);
    return true;
  });
}

function chunk(tipo, data) {
  const payload = Buffer.concat([Buffer.from(tipo), data]);
  let crc = 0xffffffff;
  for (const byte of payload) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([size, payload, checksum]);
}

test("server-only impede uso em processo cliente normal", () => {
  const result = spawnSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e",
    'import "./lib/server/capitulos-ilustrados/validar-imagem-pagina.ts";'], {
    cwd: new URL("../../", import.meta.url), encoding: "utf8", env: { ...process.env, NODE_OPTIONS: "" },
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cannot be imported from a Client Component/);
});

for (const [format, mimeType, extensao] of [["jpeg", "image/jpeg", "jpg"], ["png", "image/png", "png"], ["webp", "image/webp", "webp"]]) {
  test(`decodifica ${format} real, deriva metadados e vincula hash aos bytes canônicos`, async () => {
    const source = await imagem(format);
    const result = await validarImagemPagina(source);
    assert.ok(Object.isFrozen(result));
    assert.equal(result.mimeType, mimeType);
    assert.equal(result.extensao, extensao);
    assert.equal(result.largura, 12);
    assert.equal(result.altura, 18);
    const bytes = result.copiarBytes();
    assert.equal(result.tamanhoBytes, bytes.length);
    assert.equal(result.sha256, createHash("sha256").update(bytes).digest("hex"));
    assert.equal((await sharp(bytes).metadata()).format, format);
    bytes.fill(0);
    assert.notEqual(result.copiarBytes()[0], 0, "Consumidor recebe copia, nao o buffer interno validado.");
  });
}

test("nao aceita caminho, MIME declarado ou arquivo vazio/grande como imagem", async () => {
  await rejeita("/etc/passwd", "formato_invalido");
  await rejeita({ type: "image/png", width: 1, height: 1 }, "formato_invalido");
  await rejeita(Buffer.alloc(0), "arquivo_vazio");
  await rejeita(Buffer.alloc(LIMITES_IMAGEM_PAGINA.bytes + 1), "arquivo_grande");
  for (const text of ["<svg xmlns='http://www.w3.org/2000/svg'></svg>", "%PDF-1.7", "<script>alert(1)</script>", "GIF89a"]) {
    await rejeita(Buffer.from(text), "formato_invalido");
  }
});

test("rejeita truncamento/corrupcao mesmo com assinatura e dimensoes validas", async () => {
  for (const format of ["png", "jpeg", "webp"]) {
    const source = await imagem(format);
    await rejeita(source.subarray(0, Math.floor(source.length / 2)));
    await rejeita(Buffer.concat([source, Buffer.from("</script>")]));
  }
  const png = await imagem("png");
  const corrupted = Buffer.from(png);
  let offset = 8;
  while (corrupted.toString("ascii", offset + 4, offset + 8) !== "IDAT") offset += corrupted.readUInt32BE(offset) + 12;
  const length = corrupted.readUInt32BE(offset);
  const replaced = chunk("IDAT", Buffer.alloc(length));
  replaced.copy(corrupted, offset);
  await assert.doesNotReject(sharp(corrupted).metadata(), "Cabecalho valido nao comprova pixels validos.");
  await rejeita(corrupted, "imagem_invalida");
});

test("rejeita APNG explicitamente mesmo sem pages no decoder", async () => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0); ihdr.writeUInt32BE(1, 4); ihdr[8] = 8; ihdr[9] = 6;
  const actl = Buffer.alloc(8); actl.writeUInt32BE(2);
  const apng = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk("IHDR", ihdr),
    chunk("acTL", actl), chunk("IDAT", deflateSync(Buffer.from([0,255,0,0,255]))), chunk("IEND", Buffer.alloc(0))]);
  await rejeita(apng, "imagem_animada");
});

test("limita expansao agregada de metadados PNG sem banir metadados validos", async () => {
  const png = await imagem("png");
  const text = (size) => chunk("zTXt", Buffer.concat([Buffer.from("QA\0\0"), deflateSync(Buffer.alloc(size, 65))]));
  const insert = (...chunks) => Buffer.concat([png.subarray(0, -12), ...chunks, png.subarray(-12)]);
  const valid = await validarImagemPagina(insert(text(1024)));
  assert.equal((await sharp(valid.copiarBytes()).metadata()).comments, undefined);
  await rejeita(insert(text(1024 * 1024 + 1)), "imagem_invalida");
  await rejeita(insert(text(600 * 1024), text(600 * 1024)), "imagem_invalida");
});

test("valida iTXt comprimido/normal e perfil ICC real sem manter dados privados", async () => {
  const base = await imagem("png");
  for (const compressed of [false, true]) {
    const text = Buffer.from("Descrição privada de teste", "utf8");
    const itxt = chunk("iTXt", Buffer.concat([Buffer.from("QA\0"), Buffer.from([Number(compressed), 0]),
      Buffer.from("pt\0QA\0"), compressed ? deflateSync(text) : text]));
    const source = Buffer.concat([base.subarray(0, -12), itxt, base.subarray(-12)]);
    const result = await validarImagemPagina(source);
    assert.equal((await sharp(result.copiarBytes()).metadata()).comments, undefined);
  }
  const iccInput = await sharp(base).withMetadata().png().toBuffer();
  assert.ok((await sharp(iccInput).metadata()).icc);
  const result = await validarImagemPagina(iccInput);
  const meta = await sharp(result.copiarBytes()).metadata();
  assert.equal(meta.icc, undefined); assert.equal(meta.exif, undefined);
});

test("orçamento de expansao tambem protege iTXt e iCCP", async () => {
  const png = await imagem("png");
  const compressed = deflateSync(Buffer.alloc(1024 * 1024 + 1, 65));
  for (const [type, header] of [["iCCP", Buffer.from("QA\0\0")],
    ["iTXt", Buffer.from([81,65,0,1,0,0,0])]]) {
    const source = Buffer.concat([png.subarray(0, -12), chunk(type, Buffer.concat([header, compressed])), png.subarray(-12)]);
    await rejeita(source, "imagem_invalida");
  }
});

test("rejeita WebP animado real e JPEG multipicture", async () => {
  const header = Buffer.from("47494638396101000100800000000000ffffff", "hex");
  const frame = Buffer.from("21f90400010000002c0000000001000100000202440100", "hex");
  const otherFrame = Buffer.from(frame); otherFrame[20] = 0x4c;
  const gif = Buffer.concat([header, frame, otherFrame, Buffer.from([0x3b])]);
  const webp = await sharp(gif, { animated: true }).webp({ loop: 0, delay: [100, 100] }).toBuffer();
  assert.equal((await sharp(webp, { animated: true }).metadata()).pages, 2);
  await rejeita(webp, "imagem_animada");
  const jpeg = await imagem("jpeg");
  const mpf = Buffer.from([0xff, 0xe2, 0, 6, 77, 80, 70, 0]);
  await rejeita(Buffer.concat([jpeg.subarray(0, 2), mpf, jpeg.subarray(2)]), "imagem_animada");
  await rejeita(Buffer.concat([jpeg, jpeg]), "imagem_invalida");
});

test("limites de dimensoes e pixels sao os da migration, sem resize silencioso", async () => {
  for (const [w, h] of [[2049, 10], [10, 4097], [2048, 4096]]) await rejeita(await imagem("png", w, h));
  for (const [w, h] of [[1, 1], [2048, 1], [1, 4096], [2000, 4000]]) {
    const result = await validarImagemPagina(await imagem("png", w, h));
    assert.equal(result.largura, w); assert.equal(result.altura, h);
  }
  const migration = readFileSync(new URL("../../supabase/migrations/20261107223400_infraestrutura_capitulos_ilustrados.sql", import.meta.url), "utf8");
  for (const limit of [2097152, 2048, 4096, 8000000]) assert.ok(migration.includes(String(limit)));
});

test("aplica orientacao, remove metadados e revalida dimensoes finais", async () => {
  const input = await sharp(await imagem("jpeg", 12, 18)).withMetadata({ orientation: 6 }).toBuffer();
  const result = await validarImagemPagina(input);
  assert.equal(result.largura, 18); assert.equal(result.altura, 12);
  const meta = await sharp(result.copiarBytes()).metadata();
  assert.equal(meta.exif, undefined); assert.equal(meta.icc, undefined); assert.equal(meta.orientation, undefined);
  const rotatedTooWide = await sharp(await imagem("jpeg", 10, 2050)).withMetadata({ orientation: 6 }).toBuffer();
  await rejeita(rotatedTooWide, "dimensoes_invalidas");
});

test("aceita exatamente 2 MiB de entrada valida sem reter padding/metadados", async () => {
  const png = await imagem("png");
  const padding = chunk("pADD", Buffer.alloc(LIMITES_IMAGEM_PAGINA.bytes - png.length - 12));
  const input = Buffer.concat([png.subarray(0, -12), padding, png.subarray(-12)]);
  assert.equal(input.length, LIMITES_IMAGEM_PAGINA.bytes);
  const result = await validarImagemPagina(input);
  assert.ok(result.tamanhoBytes < input.length);
});

test("rejeita saida canonica acima de 2 MiB, mesmo com entrada menor", async () => {
  const raw = Buffer.alloc(2048 * 1800 * 3);
  let seed = 123456;
  for (let index = 0; index < raw.length; index++) {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    raw[index] = seed & 255;
  }
  const input = await sharp(raw, { raw: { width: 2048, height: 1800, channels: 3 } })
    .jpeg({ quality: 35 }).toBuffer();
  assert.ok(input.length < LIMITES_IMAGEM_PAGINA.bytes);
  await rejeita(input, "arquivo_grande");
});

test("copia a entrada antes do await, limita concorrencia e libera capacidade apos falha", async () => {
  const png = await imagem("png");
  const input = Buffer.from(png);
  const pending = validarImagemPagina(input);
  input.fill(0);
  const first = await pending;
  assert.equal(first.mimeType, "image/png");
  const results = await Promise.allSettled([validarImagemPagina(png), validarImagemPagina(png), validarImagemPagina(png)]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 2);
  assert.equal(results[2].reason.codigo, "validacao_ocupada");
  await rejeita(Buffer.from("bad"));
  const next = await validarImagemPagina(png);
  assert.equal(next.sha256, first.sha256);
});
