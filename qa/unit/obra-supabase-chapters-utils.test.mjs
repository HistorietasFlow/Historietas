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
  "    globalThis.consultasCapitulos.push([\"from\", tabela]);",
  "    return {",
  "      select(colunas) { globalThis.consultasCapitulos.push([\"select\", colunas]); return this; },",
  "      eq(coluna, valor) { globalThis.consultasCapitulos.push([\"eq\", coluna, valor]); return this; },",
  "      order(coluna, opcoes) { globalThis.consultasCapitulos.push([\"order\", coluna, opcoes]); return this; },",
  "      range(inicio, fim) {",
  "        globalThis.consultasCapitulos.push([\"range\", inicio, fim]);",
  "        return globalThis.respostaConsultaCapitulos;",
  "      },",
  "    };",
  "  },",
  "};",
].join("\n");
const paginacaoJavascript = [
  "export async function carregarTodasPaginasSupabase(opcoes) {",
  "  globalThis.opcoesPaginacaoCapitulos = opcoes;",
  "  if (globalThis.erroPaginacaoCapitulos) throw globalThis.erroPaginacaoCapitulos;",
  "  const resposta = await opcoes.buscarPagina(0, 499);",
  "  if (resposta.error) throw resposta.error;",
  "  return resposta.data || [];",
  "}",
].join("\n");
const supabaseUrl = criarUrlModulo(supabaseJavascript);
const paginacaoUrl = criarUrlModulo(paginacaoJavascript);
const chaptersJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-supabase-chapters-utils.ts",
)
  .replace('from "../../../../lib/supabase/client";', `from "${supabaseUrl}";`)
  .replace(
    'from "../../../../lib/supabase/paginacao.mjs";',
    `from "${paginacaoUrl}";`,
  );
const { carregarCapitulosPublicadosObraSupabase } = await import(
  criarUrlModulo(chaptersJavascript),
);

function prepararConsulta({ data = [], error = null, erroPaginacao = null } = {}) {
  globalThis.consultasCapitulos = [];
  globalThis.respostaConsultaCapitulos = { data, error };
  globalThis.erroPaginacaoCapitulos = erroPaginacao;
  globalThis.opcoesPaginacaoCapitulos = null;
}

test("pagina capítulos públicos com query, filtros, ordenação e range preservados", async () => {
  const capitulos = [{ id: "capitulo-1" }, { id: "capitulo-2" }];
  prepararConsulta({ data: capitulos });

  const resultado = await carregarCapitulosPublicadosObraSupabase("obra-1");

  assert.equal(resultado, capitulos);
  assert.equal(
    globalThis.opcoesPaginacaoCapitulos.nomeColecao,
    "capítulos da obra pública",
  );
  assert.deepEqual(globalThis.consultasCapitulos, [
    ["from", "capitulos"],
    [
      "select",
      "id,obra_id,user_id,titulo,ordem,publicado,criado_em,atualizado_em",
    ],
    ["eq", "obra_id", "obra-1"],
    ["eq", "publicado", true],
    ["order", "ordem", { ascending: true }],
    ["order", "id", { ascending: true }],
    ["range", 0, 499],
  ]);
});

test("propaga o erro da paginação sem transformá-lo", async () => {
  const erro = new Error("falha da paginação");
  prepararConsulta({ erroPaginacao: erro });

  await assert.rejects(
    carregarCapitulosPublicadosObraSupabase("obra-1"),
    (erroRecebido) => erroRecebido === erro,
  );
  assert.deepEqual(globalThis.consultasCapitulos, []);
});

test("propaga o erro retornado pela página sem transformá-lo", async () => {
  const erro = new Error("falha da consulta");
  prepararConsulta({ error: erro });

  await assert.rejects(
    carregarCapitulosPublicadosObraSupabase("obra-1"),
    (erroRecebido) => erroRecebido === erro,
  );
  assert.deepEqual(globalThis.consultasCapitulos.at(-1), ["range", 0, 499]);
});
