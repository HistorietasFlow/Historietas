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
  "    globalThis.consultasPersistenciaCurtidasComentarios.push([\"from\", tabela]);",
  "    return {",
  "      delete() {",
  "        globalThis.consultasPersistenciaCurtidasComentarios.push([\"delete\"]);",
  "        let filtros = 0;",
  "        const consulta = {",
  "          eq(campo, valor) {",
  "            globalThis.consultasPersistenciaCurtidasComentarios.push([\"eq\", campo, valor]);",
  "            filtros += 1;",
  "            return filtros === 2 ? globalThis.respostaPersistenciaCurtidasComentarios : consulta;",
  "          },",
  "        };",
  "        return consulta;",
  "      },",
  "      insert(payload) {",
  "        globalThis.consultasPersistenciaCurtidasComentarios.push([\"insert\", payload]);",
  "        return globalThis.respostaPersistenciaCurtidasComentarios;",
  "      },",
  "    };",
  "  },",
  "};",
].join("\n");
const supabaseUrl = criarUrlModulo(supabaseJavascript);
const persistenciaCurtidasJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-supabase-comment-like-persistence.ts",
).replace('from "../../../../lib/supabase/client";', `from "${supabaseUrl}";`);
const {
  inserirCurtidaComentarioObraSupabase,
  removerCurtidaComentarioObraSupabase,
  WORK_COMMENT_LIKES_TABLE,
} = await import(criarUrlModulo(persistenciaCurtidasJavascript));

function prepararConsulta(resposta) {
  globalThis.consultasPersistenciaCurtidasComentarios = [];
  globalThis.respostaPersistenciaCurtidasComentarios = resposta;
}

test("remove curtida com tabela, delete e filtros na ordem atual", async () => {
  const resposta = { data: null, error: null };
  prepararConsulta(resposta);

  const resultado = await removerCurtidaComentarioObraSupabase(
    "comentario-1",
    "usuario-1",
  );

  assert.equal(WORK_COMMENT_LIKES_TABLE, "comentarios_obras_curtidas");
  assert.equal(resultado, resposta);
  assert.deepEqual(globalThis.consultasPersistenciaCurtidasComentarios, [
    ["from", "comentarios_obras_curtidas"],
    ["delete"],
    ["eq", "comentario_id", "comentario-1"],
    ["eq", "usuario_id", "usuario-1"],
  ]);
});

test("insere curtida com tabela e payload exatos", async () => {
  const resposta = { data: null, error: null };
  prepararConsulta(resposta);

  const resultado = await inserirCurtidaComentarioObraSupabase(
    "comentario-1",
    "usuario-1",
  );

  assert.equal(resultado, resposta);
  assert.deepEqual(globalThis.consultasPersistenciaCurtidasComentarios, [
    ["from", "comentarios_obras_curtidas"],
    [
      "insert",
      {
        comentario_id: "comentario-1",
        usuario_id: "usuario-1",
      },
    ],
  ]);
});

test("retorna erros brutos sem transformacao", async () => {
  const erroRemover = new Error("falha ao remover curtida");
  const respostaRemover = { data: null, error: erroRemover };
  prepararConsulta(respostaRemover);

  const resultadoRemover = await removerCurtidaComentarioObraSupabase(
    "comentario-1",
    "usuario-1",
  );

  assert.equal(resultadoRemover, respostaRemover);
  assert.equal(resultadoRemover.error, erroRemover);

  const erroInserir = new Error("falha ao inserir curtida");
  const respostaInserir = { data: null, error: erroInserir };
  prepararConsulta(respostaInserir);

  const resultadoInserir = await inserirCurtidaComentarioObraSupabase(
    "comentario-1",
    "usuario-1",
  );

  assert.equal(resultadoInserir, respostaInserir);
  assert.equal(resultadoInserir.error, erroInserir);
});
