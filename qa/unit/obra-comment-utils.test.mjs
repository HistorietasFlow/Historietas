import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

function criarUrlModulo(codigo) {
  return `data:text/javascript;base64,${Buffer.from(codigo).toString("base64")}`;
}

const utilsUrl = criarUrlModulo(
  [
    "export function criarSlugBase(texto) { return texto; }",
    "export function normalizarTexto(texto) { return texto; }",
  ].join("\n"),
);
const moduloTypescript = readFileSync(
  new URL(
    "../../app/obra/[slug]/lib/obra-comment-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const moduloJavascript = typescript
  .transpileModule(moduloTypescript, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  })
  .outputText.replace(
    'from "../../../../lib/utils";',
    `from "${utilsUrl}";`,
  );
const { mesclarComentariosObraPorId } = await import(
  criarUrlModulo(moduloJavascript),
);

function criarComentario(id, texto = id) {
  return {
    id,
    obraId: "obra-1",
    userId: `usuario-${id}`,
    nome: `Usuário ${id}`,
    avatar: "",
    texto,
    criadoEm: "2026-10-06T00:00:00.000Z",
    comentarioPaiId: "",
    local: false,
    curtidas: [],
  };
}

test("atualiza IDs existentes sem mudar sua posição e anexa novos comentários", () => {
  const comentarioA = criarComentario("a", "original");
  const comentarioB = criarComentario("b");
  const comentarioAAtualizado = criarComentario("a", "atualizado");
  const comentarioC = criarComentario("c");
  const comentarioD = criarComentario("d");
  const atuais = [comentarioA, comentarioB];
  const novos = [comentarioAAtualizado, comentarioC, comentarioD];

  const mesclados = mesclarComentariosObraPorId(atuais, novos);

  assert.deepEqual(mesclados, [
    comentarioAAtualizado,
    comentarioB,
    comentarioC,
    comentarioD,
  ]);
  assert.equal(mesclados[0], comentarioAAtualizado);
  assert.equal(mesclados[1], comentarioB);
  assert.equal(mesclados[2], comentarioC);
  assert.equal(mesclados[3], comentarioD);
});

test("preserva a semântica literal do Map para duplicatas atuais e novas", () => {
  const comentarioAInicial = criarComentario("a", "primeiro atual");
  const comentarioAUltimo = criarComentario("a", "último atual");
  const comentarioB = criarComentario("b");
  const comentarioCInicial = criarComentario("c", "primeiro novo");
  const comentarioCUltimo = criarComentario("c", "último novo");

  const mesclados = mesclarComentariosObraPorId(
    [comentarioAInicial, comentarioB, comentarioAUltimo],
    [comentarioCInicial, comentarioCUltimo],
  );

  assert.deepEqual(mesclados, [comentarioAUltimo, comentarioB, comentarioCUltimo]);
  assert.equal(mesclados[0], comentarioAUltimo);
  assert.equal(mesclados[2], comentarioCUltimo);
});

test("aceita arrays vazios sem remover IDs nem mutar as entradas", () => {
  const comentarioA = criarComentario("a");
  const comentarioB = criarComentario("b");
  const atuais = Object.freeze([comentarioA, comentarioB]);
  const novos = Object.freeze([]);
  const copiaAtuais = [...atuais];

  const semNovos = mesclarComentariosObraPorId(atuais, novos);
  const semAtuais = mesclarComentariosObraPorId([], [comentarioA, comentarioB]);
  const ambosVazios = mesclarComentariosObraPorId([], []);

  assert.deepEqual(semNovos, [comentarioA, comentarioB]);
  assert.deepEqual(semAtuais, [comentarioA, comentarioB]);
  assert.deepEqual(ambosVazios, []);
  assert.deepEqual(atuais, copiaAtuais);
  assert.deepEqual(novos, []);
  assert.notEqual(semNovos, atuais);
});
