import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {criarPublicarHarness} from "../helpers/publicar-submission-harness.mjs";

const storage = readFileSync(new URL("../../app/publicar/lib/publicar-storage-operations.ts", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/publicar/page.tsx", import.meta.url), "utf8");
const controladorFormulario = readFileSync(new URL("../../app/publicar/hooks/use-publicar-form-controller.ts", import.meta.url), "utf8");
const acaoSubmissao = readFileSync(
  new URL("../../app/publicar/lib/publicar-submission-action.ts", import.meta.url),
  "utf8",
);
const hookSubmissao = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-submission.ts", import.meta.url),
  "utf8",
);

test("operações de Storage de Publicar preservam upload, limpeza e rollback", () => {
  for (const helper of ["enviarArquivoStorage", "removerArquivosStoragePublicar", "desfazerPublicacaoParcialPublicar"]) {
    assert.match(storage, new RegExp(`export async function ${helper}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`async function ${helper}\\(`));
  }
  assert.match(storage, /supabase\.storage\.from\(bucket\)\.upload/);
  assert.match(storage, /new Map\(/);
  assert.doesNotMatch(storage, /from\("capitulos"\)\.delete/);
  assert.match(storage, /from\("obras"\)\s*\.delete\(\)\s*\.eq\("id", obraIdLimpo\)/);
  assert.match(pagina, /import \{ usePublicarFormController \} from "\.\/hooks\/use-publicar-form-controller";/);
  assert.match(controladorFormulario, /import \{ usePublicarSubmission \} from "\.\/use-publicar-submission";/);
  assert.doesNotMatch(pagina, /from "\.\/lib\/publicar-submission-action";/);
  assert.match(hookSubmissao, /from "\.\.\/lib\/publicar-submission-action";/);
  assert.doesNotMatch(pagina, /from "\.\/lib\/publicar-storage-operations";/);
  assert.match(acaoSubmissao, /from "\.\/publicar-storage-operations";/);
  assert.match(acaoSubmissao, /enviarArquivoStorage\("capas-obras", userId, capaArquivo\)/);
  assert.match(acaoSubmissao, /desfazerPublicacaoParcialPublicar\(/);
});

const arquivo = {bucket: "capas-obras", caminho: "usuario/capa.png", publicUrl: "https://example.test/capa.png"};

test("limpeza deduplica bucket/caminho e confirma cada objeto removido", async () => {
  const s = criarPublicarHarness();
  s.arquivos.add("capas-obras:usuario/capa.png");
  assert.equal(await s.storage.removerArquivosStoragePublicar([arquivo, {...arquivo}]), true);
  assert.deepEqual(s.calls, ["capas-obras:remove"]);
  assert.equal(s.arquivos.size, 0);
  assert.equal(await s.storage.removerArquivosStoragePublicar([]), true);
});

for (const resultado of [
  {data: null, error: {message: "Recusado"}}, {data: null, error: null},
  {data: [], error: null}, {data: [{name: "outro.png"}], error: null},
  {data: [{name: arquivo.caminho}, {name: arquivo.caminho}], error: null},
  new Error("Timeout"),
]) {
  test(`Storage não confirma limpeza sem recibo do objeto exato: ${JSON.stringify(resultado)}`, async () => {
    const s = criarPublicarHarness();
    s.falhas.set("capas-obras:remove", () => {if (resultado instanceof Error) throw resultado; return resultado;});
    assert.equal(await s.storage.removerArquivosStoragePublicar([arquivo]), false);
  });
}

test("limpeza parcial entre buckets é falha, mesmo com um objeto confirmado", async () => {
  const s = criarPublicarHarness();
  s.arquivos.add("capas-obras:usuario/capa.png");
  s.falhas.set("arquivos-obras:remove", () => ({data: [], error: null}));
  assert.equal(await s.storage.removerArquivosStoragePublicar([
    arquivo, {...arquivo, bucket: "arquivos-obras"},
  ]), false);
  assert.deepEqual(s.calls.sort(), ["arquivos-obras:remove", "capas-obras:remove"]);
});

test("compensação só remove obra preparada do dono; capítulos saem pelo cascade existente", async () => {
  for (const [userId, publicado, esperado] of [["usuario", false, true], ["outro", false, false], ["usuario", true, false]]) {
    const s = criarPublicarHarness();
    s.obras.set("obra", {id: "obra", user_id: "usuario", publicado});
    s.capitulos.set("capitulo", {id: "capitulo", obra_id: "obra"});
    s.arquivos.add("capas-obras:usuario/capa.png");
    assert.equal(await s.storage.desfazerPublicacaoParcialPublicar("obra", [arquivo], userId), esperado);
    assert.equal(s.obras.size, esperado ? 0 : 1);
    assert.equal(s.capitulos.size, esperado ? 0 : 1);
    assert.equal(s.arquivos.size, esperado ? 0 : 1);
    assert.equal(s.calls.includes("capitulos:delete"), false);
  }
});

test("tipo inválido antes do upload não produz estado incerto nem IO", async () => {
  const s = criarPublicarHarness();
  await assert.rejects(s.storage.enviarArquivoStorage("capas-obras", "usuario", new File(["x"], "arquivo.exe")),
    erro => !(erro instanceof s.storage.UploadPublicarIncertoError));
  assert.deepEqual(s.calls, []);
});
