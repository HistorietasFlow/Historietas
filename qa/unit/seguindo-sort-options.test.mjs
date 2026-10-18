import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const helper = readFileSync(new URL("../../app/seguindo/lib/seguindo-sort-options.ts", import.meta.url), "utf8");

test("opções de ordenação preservam alternativas específicas de obras", () => {
  assert.match(page, /obterOpcoesOrdenacaoSeguindo\(abaConteudo\)/);
  assert.match(helper, /abaConteudo === "obras"/);
  assert.equal((helper.match(/valor: "padrao"/g) ?? []).length, 2);
  assert.equal((helper.match(/valor: "recentes"/g) ?? []).length, 2);
  assert.equal((helper.match(/valor: "titulo"/g) ?? []).length, 2);
  assert.equal((helper.match(/valor: "progresso"/g) ?? []).length, 1);
  assert.equal((helper.match(/valor: "capitulos"/g) ?? []).length, 1);
});
