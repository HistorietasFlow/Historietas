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
  "    globalThis.consultasCurtidasComentarios.push([\"from\", tabela]);",
  "    return {",
  "      select(colunas) { globalThis.consultasCurtidasComentarios.push([\"select\", colunas]); return this; },",
  "      in(coluna, valores) { globalThis.consultasCurtidasComentarios.push([\"in\", coluna, valores]); return this; },",
  "      order(coluna, opcoes) { globalThis.consultasCurtidasComentarios.push([\"order\", coluna, opcoes]); return this; },",
  "      range(inicio, fim) {",
  "        globalThis.consultasCurtidasComentarios.push([\"range\", inicio, fim]);",
  "        return globalThis.respostaConsultaCurtidasComentarios;",
  "      },",
  "    };",
  "  },",
  "};",
].join("\n");
const paginacaoJavascript = [
  "export async function carregarTodasPaginasPorLotesSupabase(opcoes) {",
  "  globalThis.opcoesPaginacaoCurtidasComentarios = opcoes;",
  "  if (globalThis.erroPaginacaoCurtidasComentarios) throw globalThis.erroPaginacaoCurtidasComentarios;",
  "  const primeiraResposta = await opcoes.buscarPaginaLote([\"comentario-1\", \"comentario-2\"], 0, 499);",
  "  if (primeiraResposta.error) throw primeiraResposta.error;",
  "  const segundaResposta = await opcoes.buscarPaginaLote([\"comentario-3\"], 500, 999);",
  "  if (segundaResposta.error) throw segundaResposta.error;",
  "  return [...(primeiraResposta.data || []), ...(segundaResposta.data || [])];",
  "}",
].join("\n");
const supabaseUrl = criarUrlModulo(supabaseJavascript);
const paginacaoUrl = criarUrlModulo(paginacaoJavascript);
const persistenciaCurtidasJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-supabase-comment-like-persistence.ts",
).replace('from "../../../../lib/supabase/client";', `from "${supabaseUrl}";`);
const persistenciaCurtidasUrl = criarUrlModulo(persistenciaCurtidasJavascript);
const curtidasJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-supabase-comment-likes-query.ts",
)
  .replace('from "../../../../lib/supabase/client";', `from "${supabaseUrl}";`)
  .replace(
    'from "../../../../lib/supabase/paginacao.mjs";',
    `from "${paginacaoUrl}";`,
  )
  .replace(
    'from "./obra-supabase-comment-like-persistence";',
    `from "${persistenciaCurtidasUrl}";`,
  );
const { carregarCurtidasComentariosObraSupabase } = await import(
  criarUrlModulo(curtidasJavascript),
);

function prepararConsulta({
  data = [],
  error = null,
  erroPaginacao = null,
} = {}) {
  globalThis.consultasCurtidasComentarios = [];
  globalThis.respostaConsultaCurtidasComentarios = { data, error };
  globalThis.erroPaginacaoCurtidasComentarios = erroPaginacao;
  globalThis.opcoesPaginacaoCurtidasComentarios = null;
}

test("pagina curtidas dos comentarios com tabela, query, ordenacao e ranges preservados", async () => {
  const curtidas = [
    { comentario_id: "comentario-1", usuario_id: "usuario-1" },
  ];
  prepararConsulta({ data: curtidas });

  const resultado = await carregarCurtidasComentariosObraSupabase([
    "comentario-1",
    "comentario-2",
    "comentario-3",
  ]);

  assert.deepEqual(resultado, [...curtidas, ...curtidas]);
  assert.equal(
    globalThis.opcoesPaginacaoCurtidasComentarios.nomeColecao,
    "curtidas dos comentários da obra",
  );
  assert.deepEqual(globalThis.opcoesPaginacaoCurtidasComentarios.itens, [
    "comentario-1",
    "comentario-2",
    "comentario-3",
  ]);
  assert.deepEqual(globalThis.consultasCurtidasComentarios, [
    ["from", "comentarios_obras_curtidas"],
    ["select", "comentario_id,usuario_id"],
    ["in", "comentario_id", ["comentario-1", "comentario-2"]],
    ["order", "comentario_id", { ascending: true }],
    ["order", "usuario_id", { ascending: true }],
    ["range", 0, 499],
    ["from", "comentarios_obras_curtidas"],
    ["select", "comentario_id,usuario_id"],
    ["in", "comentario_id", ["comentario-3"]],
    ["order", "comentario_id", { ascending: true }],
    ["order", "usuario_id", { ascending: true }],
    ["range", 500, 999],
  ]);
});

test("propaga o erro da paginacao sem transformá-lo", async () => {
  const erro = new Error("falha da paginação");
  prepararConsulta({ erroPaginacao: erro });

  await assert.rejects(
    carregarCurtidasComentariosObraSupabase(["comentario-1"]),
    (erroRecebido) => erroRecebido === erro,
  );
  assert.deepEqual(globalThis.consultasCurtidasComentarios, []);
});

test("propaga o erro retornado pela consulta sem transformá-lo", async () => {
  const erro = new Error("falha da consulta");
  prepararConsulta({ error: erro });

  await assert.rejects(
    carregarCurtidasComentariosObraSupabase(["comentario-1"]),
    (erroRecebido) => erroRecebido === erro,
  );
  assert.deepEqual(globalThis.consultasCurtidasComentarios.at(-1), [
    "range",
    0,
    499,
  ]);
});
