import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const estrutura = ler("../../app/ler-capitulo/lib/ler-capitulo-comment-thread-structure.ts");
const js = typescript.transpileModule(estrutura, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const helpers = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);

const comentario = (id, criadoEm, curtidas, comentarioPaiId = "") => ({
  id,
  criadoEm,
  curtidas,
  comentarioPaiId,
});

test("estrutura de threads preserva datas inválidas, respostas e relevância", () => {
  const dados = [
    comentario("a", "2026-01-01", ["u1", "u2"]),
    comentario("b", "2026-01-02", []),
    comentario("r1", "2026-01-03", [], "b"),
    comentario("r2", "2026-01-04", [], "r1"),
    comentario("orfa", "inválido", [], "ausente"),
  ];

  const relevantes = helpers.criarEstruturaComentariosCapitulo(dados, "relevantes");

  assert.equal(helpers.dataComentarioCapitulo(dados[4]), 0);
  assert.deepEqual(relevantes.comentariosRaiz.map((item) => item.id), ["a", "b", "orfa"]);
  assert.deepEqual(relevantes.respostasPorRaiz.get("b").map((item) => item.id), ["r1", "r2"]);
  assert.deepEqual(
    helpers.criarEstruturaComentariosCapitulo(dados, "recentes").comentariosRaiz.map((item) => item.id),
    ["b", "a", "orfa"],
  );
});

test("estrutura protege contra ciclos sem elevar comentários cíclicos a raízes", () => {
  const dados = [
    comentario("raiz", "2026-01-01", []),
    comentario("a", "2026-01-02", [], "b"),
    comentario("b", "2026-01-03", [], "a"),
  ];

  const estruturaComentarios = helpers.criarEstruturaComentariosCapitulo(dados, "relevantes");

  assert.deepEqual(estruturaComentarios.comentariosRaiz.map((item) => item.id), ["raiz"]);
  assert.deepEqual(estruturaComentarios.respostasPorRaiz.get("a").map((item) => item.id), ["b"]);
  assert.deepEqual(estruturaComentarios.respostasPorRaiz.get("b").map((item) => item.id), ["a"]);
});

test("módulo contém somente a estrutura pura das threads", () => {
  assert.match(estrutura, /export type OrdenacaoComentariosCapitulo = "relevantes" \| "recentes";/);
  assert.match(estrutura, /export function dataComentarioCapitulo\(/);
  assert.match(estrutura, /export function criarEstruturaComentariosCapitulo\(/);
  assert.match(estrutura, /new Set<string>\(\[comentario\.id\]\)/);
  assert.match(estrutura, /a\.curtidas\.length \* 3 \+ \(respostasPorRaiz\.get\(a\.id\)\?\.length \|\| 0\)/);
  assert.doesNotMatch(estrutura, /useState|useMemo|supabase|localStorage|createPortal/);
});
