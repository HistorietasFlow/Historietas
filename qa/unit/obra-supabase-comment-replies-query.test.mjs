import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

function transpilarModuloTypescript(caminho) {
  const texto = readFileSync(new URL(caminho, import.meta.url), "utf8");

  return typescript.transpileModule(texto, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
}

function criarUrlModulo(codigo) {
  return `data:text/javascript;base64,${Buffer.from(codigo).toString("base64")}`;
}

const supabaseJavascript = [
  "export const supabase = {",
  "  from(tabela) {",
  "    globalThis.consultasRespostasComentarios.push([\"from\", tabela]);",
  "    return {",
  "      select(colunas) { globalThis.consultasRespostasComentarios.push([\"select\", colunas]); return this; },",
  "      eq(coluna, valor) { globalThis.consultasRespostasComentarios.push([\"eq\", coluna, valor]); return this; },",
  "      in(coluna, valores) { globalThis.consultasRespostasComentarios.push([\"in\", coluna, valores]); return this; },",
  "      order(coluna, opcoes) { globalThis.consultasRespostasComentarios.push([\"order\", coluna, opcoes]); return this; },",
  "      range(inicio, fim) {",
  "        globalThis.consultasRespostasComentarios.push([\"range\", inicio, fim]);",
  "        return globalThis.respostaConsultaRespostasComentarios;",
  "      },",
  "    };",
  "  },",
  "};",
].join("\n");
const paginacaoJavascript = [
  "export async function carregarTodasPaginasPorLotesSupabase(opcoes) {",
  "  globalThis.opcoesPaginacaoRespostasComentarios = opcoes;",
  "  if (globalThis.erroPaginacaoRespostasComentarios) throw globalThis.erroPaginacaoRespostasComentarios;",
  "  const primeiraResposta = await opcoes.buscarPaginaLote([\"pai-1\", \"pai-2\"], 0, 499);",
  "  if (primeiraResposta.error) throw primeiraResposta.error;",
  "  const segundaResposta = await opcoes.buscarPaginaLote([\"pai-3\"], 500, 999);",
  "  if (segundaResposta.error) throw segundaResposta.error;",
  "  return [...(primeiraResposta.data || []), ...(segundaResposta.data || [])];",
  "}",
].join("\n");
const supabaseUrl = criarUrlModulo(supabaseJavascript);
const paginacaoUrl = criarUrlModulo(paginacaoJavascript);
const consultaRespostasJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-supabase-comment-replies-query.ts",
)
  .replace('from "../../../../lib/supabase/client";', `from "${supabaseUrl}";`)
  .replace(
    'from "../../../../lib/supabase/paginacao.mjs";',
    `from "${paginacaoUrl}";`,
  )
  .replace('from "./obra-comment-utils";', "from \"data:text/javascript,\";");
const { carregarRespostasComentariosObraSupabase } = await import(
  criarUrlModulo(consultaRespostasJavascript),
);

function prepararConsulta({ data = [], error = null, erroPaginacao = null } = {}) {
  globalThis.consultasRespostasComentarios = [];
  globalThis.respostaConsultaRespostasComentarios = { data, error };
  globalThis.erroPaginacaoRespostasComentarios = erroPaginacao;
  globalThis.opcoesPaginacaoRespostasComentarios = null;
}

test("pagina respostas dos comentarios com query, filtros, ordenacoes, ranges e lotes preservados", async () => {
  const respostas = [{ id: "resposta-1" }];
  prepararConsulta({ data: respostas });

  const resultado = await carregarRespostasComentariosObraSupabase("obra-1", [
    "pai-1",
    "pai-2",
    "pai-3",
  ]);

  assert.deepEqual(resultado, [...respostas, ...respostas]);
  assert.equal(
    globalThis.opcoesPaginacaoRespostasComentarios.nomeColecao,
    "respostas dos comentários da obra",
  );
  assert.deepEqual(globalThis.opcoesPaginacaoRespostasComentarios.itens, [
    "pai-1",
    "pai-2",
    "pai-3",
  ]);
  assert.deepEqual(globalThis.consultasRespostasComentarios, [
    ["from", "comentarios_obras"],
    ["select", "id,obra_id,user_id,comentario,comentario_pai_id,criado_em"],
    ["eq", "obra_id", "obra-1"],
    ["in", "comentario_pai_id", ["pai-1", "pai-2"]],
    ["order", "criado_em", { ascending: true }],
    ["order", "id", { ascending: true }],
    ["range", 0, 499],
    ["from", "comentarios_obras"],
    ["select", "id,obra_id,user_id,comentario,comentario_pai_id,criado_em"],
    ["eq", "obra_id", "obra-1"],
    ["in", "comentario_pai_id", ["pai-3"]],
    ["order", "criado_em", { ascending: true }],
    ["order", "id", { ascending: true }],
    ["range", 500, 999],
  ]);
});

test("propaga o erro da paginacao sem transforma-lo", async () => {
  const erro = new Error("falha da paginação");
  prepararConsulta({ erroPaginacao: erro });

  await assert.rejects(
    carregarRespostasComentariosObraSupabase("obra-1", ["pai-1"]),
    (erroRecebido) => erroRecebido === erro,
  );
  assert.deepEqual(globalThis.consultasRespostasComentarios, []);
});

test("propaga o erro retornado pela consulta sem transforma-lo", async () => {
  const erro = new Error("falha da consulta");
  prepararConsulta({ error: erro });

  await assert.rejects(
    carregarRespostasComentariosObraSupabase("obra-1", ["pai-1"]),
    (erroRecebido) => erroRecebido === erro,
  );
  assert.deepEqual(globalThis.consultasRespostasComentarios.at(-1), [
    "range",
    0,
    499,
  ]);
});
