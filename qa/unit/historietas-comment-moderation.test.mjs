import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const fonte = readFileSync(
  new URL("../../lib/historietasCommentModeration.ts", import.meta.url),
  "utf8",
);
const javascript = typescript.transpileModule(fonte, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { usuarioPodeGerenciarComentario } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

test("comentário pode ser gerenciado pelo comentarista ou pelo autor da obra", () => {
  assert.equal(usuarioPodeGerenciarComentario("leitor", "leitor", "autor"), true);
  assert.equal(usuarioPodeGerenciarComentario("autor", "leitor", "autor"), true);
  assert.equal(usuarioPodeGerenciarComentario("outro", "leitor", "autor"), false);
});

test("identidades vazias ou apenas semelhantes não concedem gestão", () => {
  assert.equal(usuarioPodeGerenciarComentario("", "", ""), false);
  assert.equal(usuarioPodeGerenciarComentario(" autor ", "leitor", " autor "), true);
  assert.equal(usuarioPodeGerenciarComentario("autor-2", "autor", "autor-1"), false);
});
