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
  "    globalThis.consultasPersistenciaComentarios.push([\"from\", tabela]);",
  "    return {",
  "      insert(payload) {",
  "        globalThis.consultasPersistenciaComentarios.push([\"insert\", payload]);",
  "        return {",
  "          select(colunas) {",
  "            globalThis.consultasPersistenciaComentarios.push([\"select\", colunas]);",
  "            return {",
  "              single() {",
  "                globalThis.consultasPersistenciaComentarios.push([\"single\"]);",
  "                return globalThis.respostaPersistenciaComentarios;",
  "              },",
  "            };",
  "          },",
  "        };",
  "      },",
  "    };",
  "  },",
  "};",
].join("\n");
const supabaseUrl = criarUrlModulo(supabaseJavascript);
const persistenciaComentariosJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-supabase-comment-persistence.ts",
).replace('from "../../../../lib/supabase/client";', `from "${supabaseUrl}";`);
const { inserirComentarioObraSupabase } = await import(
  criarUrlModulo(persistenciaComentariosJavascript),
);

function prepararConsulta(resposta) {
  globalThis.consultasPersistenciaComentarios = [];
  globalThis.respostaPersistenciaComentarios = resposta;
}

const payload = {
  obra_id: "obra-1",
  user_id: "usuario-1",
  comentario: "Comentário de teste",
  comentario_pai_id: "comentario-pai-1",
};

test("insere comentário com tabela, payload, seleção e single preservados", async () => {
  const resposta = {
    data: {
      id: "comentario-1",
      ...payload,
      criado_em: "2026-10-06T12:00:00.000Z",
    },
    error: null,
  };
  prepararConsulta(resposta);

  const resultado = await inserirComentarioObraSupabase(payload);

  assert.equal(resultado, resposta);
  assert.deepEqual(globalThis.consultasPersistenciaComentarios, [
    ["from", "comentarios_obras"],
    ["insert", payload],
    [
      "select",
      "id,obra_id,user_id,comentario,comentario_pai_id,criado_em",
    ],
    ["single"],
  ]);
});

test("retorna o erro bruto sem transformação", async () => {
  const erro = new Error("falha ao inserir comentário");
  const resposta = { data: null, error: erro };
  prepararConsulta(resposta);

  const resultado = await inserirComentarioObraSupabase({
    ...payload,
    comentario_pai_id: null,
  });

  assert.equal(resultado, resposta);
  assert.equal(resultado.data, null);
  assert.equal(resultado.error, erro);
});
