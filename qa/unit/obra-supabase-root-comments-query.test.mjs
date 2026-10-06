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
  "    globalThis.consultasRaizesComentarios.push([\"from\", tabela]);",
  "    return {",
  "      select(colunas) { globalThis.consultasRaizesComentarios.push([\"select\", colunas]); return this; },",
  "      eq(coluna, valor) { globalThis.consultasRaizesComentarios.push([\"eq\", coluna, valor]); return this; },",
  "      is(coluna, valor) { globalThis.consultasRaizesComentarios.push([\"is\", coluna, valor]); return this; },",
  "      order(coluna, opcoes) { globalThis.consultasRaizesComentarios.push([\"order\", coluna, opcoes]); return this; },",
  "      range(inicio, fim) {",
  "        globalThis.consultasRaizesComentarios.push([\"range\", inicio, fim]);",
  "        return globalThis.respostaConsultaRaizesComentarios;",
  "      },",
  "    };",
  "  },",
  "};",
].join("\n");
const supabaseUrl = criarUrlModulo(supabaseJavascript);
const consultaRaizesJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-supabase-root-comments-query.ts",
).replace('from "../../../../lib/supabase/client";', `from "${supabaseUrl}";`);
const { consultarPaginaRaizesComentariosObraSupabase } = await import(
  criarUrlModulo(consultaRaizesJavascript),
);

function prepararConsulta(resposta) {
  globalThis.consultasRaizesComentarios = [];
  globalThis.respostaConsultaRaizesComentarios = resposta;
}

test("consulta comentários raiz com tabela, seleção, filtros, ordenações e range preservados", async () => {
  const resposta = {
    data: [{ id: "comentario-raiz" }],
    error: null,
  };
  prepararConsulta(resposta);

  const resultado = await consultarPaginaRaizesComentariosObraSupabase(
    "obra-1",
    20,
    40,
  );

  assert.equal(resultado, resposta);
  assert.deepEqual(globalThis.consultasRaizesComentarios, [
    ["from", "comentarios_obras"],
    [
      "select",
      "id,obra_id,user_id,comentario,comentario_pai_id,criado_em",
    ],
    ["eq", "obra_id", "obra-1"],
    ["is", "comentario_pai_id", null],
    ["order", "criado_em", { ascending: false }],
    ["order", "id", { ascending: false }],
    ["range", 20, 40],
  ]);
});

test("retorna data e erro da consulta sem transformação", async () => {
  const erro = new Error("falha da consulta raiz");
  const resposta = { data: null, error: erro };
  prepararConsulta(resposta);

  const resultado = await consultarPaginaRaizesComentariosObraSupabase(
    "obra-1",
    0,
    20,
  );

  assert.equal(resultado, resposta);
  assert.equal(resultado.data, null);
  assert.equal(resultado.error, erro);
});
