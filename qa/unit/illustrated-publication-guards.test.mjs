import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function javascript(source) {
  return ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022,
  } }).outputText;
}
const dataUrl = (source) => `data:text/javascript;base64,${Buffer.from(`${source}\n//# sourceURL=illustrated-publication-harness.js`).toString("base64")}`;
const route = readFileSync(new URL("../../app/api/arquivos-obras/url/route.ts", import.meta.url), "utf8");
// Apenas o harness exporta o parser privado; nenhum contrato de producao muda.
const parserSource = route.slice(route.indexOf("function decodificarCaminho"), route.indexOf("export async function POST"));
const { obterCaminhoArquivoObra } = await import(dataUrl(javascript(
  `const BUCKET_ARQUIVOS_OBRAS = 'arquivos-obras';\n${parserSource}\nexport { obterCaminhoArquivoObra };`,
)));

test("assinador legado bloqueia namespace ilustrado em todos os formatos aceitos", () => {
  for (const path of [
    "u/capitulos/c/r.png", "u/CAPITULOS/c/r.png", "u/%63apitulos/c/r.png",
    "arquivos-obras/u/capitulos/c/r.png",
    "https://local.test/storage/v1/object/sign/arquivos-obras/u/capitulos/c/r.png?token=nao-real",
    "https://local.test/storage/v1/object/authenticated/arquivos-obras/u/capitulos/c/r.png",
  ]) assert.equal(obterCaminhoArquivoObra(path, "u"), "", path);
  assert.equal(obterCaminhoArquivoObra("u/legado.pdf", "u"), "u/legado.pdf");
  assert.equal(obterCaminhoArquivoObra("arquivos-obras/u/legado.pdf", "u"), "u/legado.pdf");
  assert.equal(obterCaminhoArquivoObra("u/capitulos-outros.pdf", "u"), "u/capitulos-outros.pdf");
  assert.equal(obterCaminhoArquivoObra("outro/legado.pdf", "u"), "");
});

const { processarOperacaoExclusaoConta } = await import(dataUrl(javascript(
  readFileSync(new URL("../../lib/server/exclusaoConta.ts", import.meta.url), "utf8"),
)));
function executor({ pendencias = [false], status = "solicitada", checkError = null, pendenciaDepoisAuth = false } = {}) {
  const calls = [];
  const operation = { id: "op", subject_user_id: "u", status, auth_excluido_em: null,
    storage_limpo_em: status === "storage_limpo" ? "date" : null };
  let checks = 0;
  const admin = {
    async rpc(name) {
      calls.push(name);
      if (name === "ha_uploads_ilustrados_pendentes_exclusao") {
        const data = pendenciaDepoisAuth && calls.includes("deleteAuth")
          ? true : pendencias[Math.min(checks++, pendencias.length - 1)];
        return { data, error: checkError };
      }
      assert.equal(name, "reivindicar_operacao_exclusao_conta");
      return { data: { ...operation }, error: null };
    },
    from(table) {
      assert.equal(table, "operacoes_exclusao_conta");
      return { update(values) {
        calls.push(`status:${values.status || "update"}`);
        Object.assign(operation, values);
        const chain = { eq: () => chain, select: () => chain,
          maybeSingle: async () => ({ data: { ...operation }, error: null }) };
        return chain;
      } };
    },
    storage: { from: (bucket) => ({
      async list() { calls.push(`list:${bucket}`); return { data: [], error: null }; },
      async remove() { throw new Error("Fixture vazia nunca deve excluir arquivos."); },
    }) },
    auth: { admin: {
      async getUserById() { return { data: { user: { id: "u" } }, error: null }; },
      async deleteUser() { calls.push("deleteAuth"); return { error: null }; },
    } },
  };
  return { calls, operation, run: () => processarOperacaoExclusaoConta({ admin, userId: "u", lockToken: "lock" }) };
}

test("tentativa incerta impede listagem, remocao, exclusao Auth e conclusao", async () => {
  const fixture = executor({ pendencias: [true] });
  await assert.rejects(fixture.run, { code: "uploads_ilustrados_pendentes" });
  assert.equal(fixture.operation.status, "falhou");
  assert.ok(!fixture.calls.some((name) => name.startsWith("list:") || name === "deleteAuth" || name === "status:concluida"));
});
test("falha da RPC ou resposta desconhecida falham fechadas", async () => {
  for (const options of [{ pendencias: [null] }, { checkError: { code: "rede" } }]) {
    const fixture = executor(options);
    await assert.rejects(fixture.run);
    assert.ok(!fixture.calls.includes("deleteAuth"));
    assert.notEqual(fixture.operation.status, "concluida");
  }
});
test("retomada de operacao storage_limpo tambem confere ledger antes do Auth", async () => {
  const fixture = executor({ status: "storage_limpo", pendencias: [true] });
  await assert.rejects(fixture.run);
  assert.ok(!fixture.calls.includes("deleteAuth"));
});
test("pendencia que surge durante limpeza e detectada nas renovacoes", async () => {
  const fixture = executor({ pendencias: [false, true] });
  const result = await fixture.run();
  assert.equal(result.operacao.status, "falhou");
  assert.equal(result.authExcluido, false);
  assert.ok(!fixture.calls.includes("deleteAuth"));
  assert.notEqual(fixture.operation.status, "concluida");
});
test("conta sem tentativas preserva o fluxo legado completo", async () => {
  const fixture = executor();
  const result = await fixture.run();
  assert.equal(result.operacao.status, "concluida");
  assert.equal(result.authExcluido, true);
  assert.equal(fixture.calls.filter((name) => name === "deleteAuth").length, 1);
  assert.ok(fixture.calls.includes("list:arquivos-obras"));
  assert.ok(fixture.calls.lastIndexOf("ha_uploads_ilustrados_pendentes_exclusao") < fixture.calls.indexOf("status:concluida"));
});
test("pendencia descoberta apos excluir Auth impede conclusao e exige recuperacao", async () => {
  const fixture = executor({ pendenciaDepoisAuth: true });
  const result = await fixture.run();
  assert.equal(result.authExcluido, true);
  assert.equal(result.storageFinalPendente, true);
  assert.equal(result.operacao.status, "falhou");
  assert.ok(!fixture.calls.includes("status:concluida"));
});
