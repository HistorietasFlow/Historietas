import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const root = new URL("../../", import.meta.url);
function source(path) { return readFileSync(new URL(path, root), "utf8"); }
function moduleUrl(path, imports = {}) {
  let code = ts.transpileModule(source(path), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText.replace('import "server-only";', "");
  for (const [name, url] of Object.entries(imports)) code = code.replace(`"${name}"`, JSON.stringify(url));
  return `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
}
const referenceUrl = moduleUrl("lib/private-covers/reference.ts");
const { parsePrivateCoverReference, selectCoverSource } = await import(referenceUrl);
const { runPrivateCoverUploadProtocol: run } = await import(moduleUrl(
  "lib/private-covers/upload-protocol.ts", { "./reference": referenceUrl },
));
const { uploadPrivateCover, PRIVATE_COVER_UPLOADS_ENABLED } = await import(moduleUrl("lib/private-covers/upload.ts"));
const { accountCoverQuota: account } = await import(moduleUrl("lib/private-covers/quota.ts"));
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const intent = Object.freeze({ key: id(1), workId: id(2), generation: id(3), expectedVersion: id(4) });
const ref = `private-cover:v1:${intent.workId}:${intent.generation}:${id(5)}`;
const file = new Blob(["fixture"], { type: "image/png" });
function harness(overrides = {}) {
  const calls = [];
  const ports = {
    isCurrent: () => true,
    reserve: async (value) => { calls.push(["reserve", value]); return { attemptId: id(6), reference: ref }; },
    store: async (...args) => { calls.push(["store", ...args]); return "stored"; },
    commit: async (...args) => { calls.push(["commit", ...args]); return { status: "confirmed", reference: ref }; },
    ...overrides,
  };
  return { ports, calls };
}

test("entrada pública continua desativada e não depende de ambiente", async () => {
  assert.equal(PRIVATE_COVER_UPLOADS_ENABLED, false);
  assert.deepEqual(await uploadPrivateCover(intent), { status: "disabled", key: intent.key });
  assert.doesNotMatch(source("lib/private-covers/upload.ts"), /process\.env|runPrivateCoverUploadProtocol|supabase|fetch\(/);
});

test("referência opaca canônica e congelada, sem caminho/URL", () => {
  const parsed = parsePrivateCoverReference(ref);
  assert.equal(parsed.assetId, id(5));
  assert.ok(Object.isFrozen(parsed));
  assert.throws(() => { parsed.assetId = id(9); }, TypeError);
  for (const value of [null, {}, ref + ":extra", ref + "?token=x", " " + ref, ref.replace("v1", "v2"),
    "https://cdn.test/cover.png", "../cover", "data:image/png,x", "blob:cover"]) {
    assert.equal(parsePrivateCoverReference(value), null);
  }
});

test("referência privada válida, inválida ou ausente nunca cai na URL pública antiga", () => {
  for (const reference of [ref, "https://cdn.test/cover.png", undefined, null, "", ref + "?x"]) {
    const result = selectCoverSource({ kind: "private", reference, legacyUrl: "https://cdn.test/old.png" });
    assert.equal("url" in result, false);
    assert.equal(result.kind, reference === ref ? "private" : "unavailable");
  }
  assert.deepEqual(selectCoverSource({ kind: "legacy", legacyUrl: "https://cdn.test/old.png" }),
    { kind: "legacy", url: "https://cdn.test/old.png" });
  assert.equal(selectCoverSource({ kind: "legacy", legacyUrl: ref }).kind, "unavailable");
  for (const reference of [ref, "invalid", ""]) {
    assert.equal(selectCoverSource({ kind: "legacy", reference, legacyUrl: "https://cdn.test/old.png" }).kind, "unavailable");
  }
  assert.equal(selectCoverSource({ kind: "invalid", legacyUrl: "https://cdn.test/old.png" }).kind, "unavailable");
});

test("protocolo simulado confirma somente após reserva, armazenamento e recibo coincidente", async () => {
  const { ports, calls } = harness();
  assert.deepEqual(await run(intent, file, ports), { status: "confirmed", key: intent.key, reference: ref });
  assert.deepEqual(calls.map(([name]) => name), ["reserve", "store", "commit"]);
  assert.ok(Object.isFrozen(calls[0][1]));
  assert.ok(Object.isFrozen(calls[1][1]));
  assert.deepEqual(calls[1][3], { upsert: false, cacheControl: "0", contentType: "image/png" });
});

test("validação rejeita identidade, MIME e limites antes de qualquer IO", async () => {
  for (const [value, blob] of [[{ ...intent, key: "bad" }, file], [intent, new Blob([])],
    [intent, new Blob(["x"], { type: "text/html" })],
    [intent, new Blob([new Uint8Array(2097153)], { type: "image/png" })]]) {
    const { ports, calls } = harness();
    assert.equal((await run(value, blob, ports)).status, "invalid");
    assert.equal(calls.length, 0);
  }
});

for (const stage of ["reserve", "store", "commit"]) {
  test(`resposta perdida em ${stage} conserva chave e não reenvia nem compensa`, async () => {
    const { ports, calls } = harness();
    ports[stage] = async () => { calls.push([stage]); throw new Error("lost response"); };
    assert.deepEqual(await run(intent, file, ports), { status: "uncertain", key: intent.key });
    assert.deepEqual(calls.map(([name]) => name), ["reserve", "store", "commit"].slice(0, ["reserve", "store", "commit"].indexOf(stage) + 1));
  });
}

for (const status of ["conflict", "rejected", "uncertain"]) {
  test(`armazenamento confirmado e commit ${status} não expõem referência nem liberam quota`, async () => {
    const { ports } = harness({ commit: async () => ({ status }) });
    assert.deepEqual(await run(intent, file, ports), { status, key: intent.key });
  });
}

test("recibo de outro asset é incerto; reserva de outra obra/geração nunca chega ao Storage", async () => {
  const { ports } = harness({ commit: async () => ({ status: "confirmed", reference: ref.replace(id(5), id(9)) }) });
  assert.equal((await run(intent, file, ports)).status, "uncertain");
  for (const reference of [ref.replace(id(2), id(9)), ref.replace(id(3), id(9)), "https://public.test/x"]) {
    const { ports, calls } = harness({ reserve: async () => ({ attemptId: id(6), reference }) });
    assert.equal((await run(intent, file, ports)).status, "uncertain");
    assert.equal(calls.length, 0);
  }
});

test("recusa de reserva ou Storage impede commit", async () => {
  for (const overrides of [{ reserve: async () => null }, { store: async () => "rejected" }, { store: async () => "uncertain" }]) {
    const { ports, calls } = harness(overrides);
    assert.notEqual((await run(intent, file, ports)).status, "confirmed");
    assert.equal(calls.some(([name]) => name === "commit"), false);
  }
});

for (const boundary of [0, 1, 2, 3]) {
  test(`logout/troca de contexto na fronteira ${boundary} impede exposição/reenvio`, async () => {
    let checks = 0;
    const { ports, calls } = harness({ isCurrent: () => checks++ < boundary });
    assert.deepEqual(await run(intent, file, ports), { status: "obsolete", key: intent.key });
    assert.equal(calls.length, boundary);
  });
}

const entry = (bucket, path, bytes = null, ownerId = "owner") => ({ bucket, path, bytes, ownerId });
const inventory = (objects, holds = []) => ({ complete: true, objects, holds });

test("quota inclui quatro buckets, proprietário e união de objeto/reserva pelo maior tamanho", () => {
  const result = account(inventory([
    entry("avatars", "a"), entry("capas-obras", "public"), entry("capas-obras-privadas", "private", 100),
    entry("arquivos-obras", "file", 20), entry("capas-obras-privadas", "other", 50, "other"),
  ], [entry("capas-obras-privadas", "private"), entry("capas-obras-privadas", "uncertain")]), "owner");
  assert.equal(result.globalObjects, 6);
  assert.equal(result.userObjects, 5);
  assert.equal(result.globalBytes, 1048576 + 3 * 2097152 + 70);
  assert.equal(result.userBytes, result.globalBytes - 50);
  assert.deepEqual(result.userFamilies, { avatars: 1, covers: 3, files: 1 });
});

test("capas privadas compartilham teto de 60 com públicas; substituir mantém os dois objetos", () => {
  const objects = Array.from({ length: 60 }, (_, i) => entry(i % 2 ? "capas-obras" : "capas-obras-privadas", `${i}`, 1));
  assert.equal(account(inventory(objects), "owner").withinLimits, true);
  assert.equal(account(inventory(objects, [entry("capas-obras-privadas", "new", 1)]), "owner").withinLimits, false);
  assert.equal(account(inventory(objects, [entry("capas-obras", "1", 2)]), "owner").globalObjects, 60);
});

test("limites de bytes/objetos globais e por usuário permanecem integrais", () => {
  for (const [count, bytes, owner] of [[101, 1, "owner"], [1, 100 * 1048576 + 1, "owner"],
    [5001, 1, "other"], [1, 700 * 1048576 + 1, "other"]]) {
    assert.equal(account(inventory(Array.from({ length: count }, (_, i) =>
      entry("capas-obras-privadas", `${i}`, bytes, owner))), "owner").withinLimits, false);
  }
  for (const [bucket, count] of [["avatars", 6], ["arquivos-obras", 31]]) {
    assert.equal(account(inventory(Array.from({ length: count }, (_, i) => entry(bucket, `${i}`, 1))), "owner").withinLimits, false);
  }
});

test("inventário incompleto/ambíguo ou tamanho inválido falha fechado", () => {
  assert.throws(() => account({ ...inventory([]), complete: false }, "owner"), /incomplete/);
  for (const bytes of [-1, NaN, Infinity, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => account(inventory([entry("capas-obras-privadas", "x", bytes)]), "owner"), /invalid/);
  }
  assert.throws(() => account(inventory([entry("unknown", "x")]), "owner"), /invalid/);
  assert.throws(() => account(inventory([entry("capas-obras", "x")], [entry("capas-obras", "x", 1, "other")]), "owner"), /ambiguous/);
});

test("não há consumidor ativo dos módulos preparados nem writer/cleanup concreto", () => {
  function walk(path) {
    for (const item of readdirSync(new URL(path, root), { withFileTypes: true })) {
      const next = `${path}/${item.name}`;
      if (item.isDirectory()) walk(next);
      else if (/\.(ts|tsx|mjs)$/.test(next) && !next.startsWith("lib/private-covers/")) {
        assert.doesNotMatch(source(next), /(?:from\s*|import\s*\()["'][^"']*private-covers\//, next);
      }
    }
  }
  for (const path of ["app", "components", "lib"]) walk(path);
  assert.doesNotMatch(source("lib/private-covers/upload-protocol.ts"), /getPublicUrl|createSignedUrl|\.remove\(|\.delete\(|release\(/);
});
