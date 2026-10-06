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

const raizesJavascript = [
  "export async function consultarPaginaRaizesComentariosObraSupabase(obraId, inicio, fim) {",
  "  globalThis.chamadasRaizesComentarios.push({ obraId, inicio, fim });",
  "  return globalThis.respostaRaizesComentarios;",
  "}",
].join("\n");
const respostasJavascript = [
  "export async function carregarRespostasComentariosObraSupabase(obraId, idsPais) {",
  "  globalThis.chamadasRespostasComentarios.push({ obraId, idsPais });",
  "  const resposta = globalThis.respostasComentarios.shift();",
  "  if (resposta instanceof Error) throw resposta;",
  "  return resposta || [];",
  "}",
].join("\n");
const normalizadorJavascript = [
  "export async function normalizarComentariosObraSupabase(comentarios) {",
  "  globalThis.comentariosEnviadosAoNormalizador.push(comentarios);",
  "  return comentarios;",
  "}",
].join("\n");
const raizesUrl = criarUrlModulo(raizesJavascript);
const respostasUrl = criarUrlModulo(respostasJavascript);
const normalizadorUrl = criarUrlModulo(normalizadorJavascript);
const carregadorJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-supabase-comments-page-loader.ts",
)
  .replace(
    'from "./obra-supabase-root-comments-query";',
    `from "${raizesUrl}";`,
  )
  .replace(
    'from "./obra-supabase-comment-replies-query";',
    `from "${respostasUrl}";`,
  )
  .replace(
    'from "./obra-supabase-comment-normalizer";',
    `from "${normalizadorUrl}";`,
  );
const { carregarPaginaComentariosObraSupabase } = await import(
  criarUrlModulo(carregadorJavascript),
);

function criarComentario(id, comentarioPaiId = null) {
  return {
    id,
    obra_id: "obra-1",
    user_id: "usuario-1",
    comentario: `Texto ${id}`,
    comentario_pai_id: comentarioPaiId,
    criado_em: "2026-01-01T00:00:00.000Z",
  };
}

function prepararCarregador({
  respostaRaizesComentarios = { data: [], error: null },
  respostasComentarios = [],
} = {}) {
  globalThis.chamadasRaizesComentarios = [];
  globalThis.chamadasRespostasComentarios = [];
  globalThis.comentariosEnviadosAoNormalizador = [];
  globalThis.respostaRaizesComentarios = respostaRaizesComentarios;
  globalThis.respostasComentarios = [...respostasComentarios];
}

test("normaliza offset, usa a sentinela e percorre descendentes sem duplicar IDs", async () => {
  const raizes = Array.from({ length: 21 }, (_, indice) =>
    criarComentario(`raiz-${indice}`),
  );
  const respostaVazia = criarComentario(" ", "raiz-0");
  const respostaDuplicada = criarComentario("raiz-1", "raiz-0");
  const respostaPrimeiroNivel = criarComentario("resposta-1", "raiz-0");
  const respostaSegundoNivel = criarComentario("resposta-2", "resposta-1");

  prepararCarregador({
    respostaRaizesComentarios: { data: raizes, error: null },
    respostasComentarios: [
      [respostaPrimeiroNivel, respostaVazia, respostaDuplicada],
      [respostaSegundoNivel, respostaPrimeiroNivel],
      [],
    ],
  });

  const pagina = await carregarPaginaComentariosObraSupabase("obra-1", -8);

  const idsRaizesExibidas = raizes.slice(0, 20).map((comentario) => comentario.id);
  assert.deepEqual(globalThis.chamadasRaizesComentarios, [
    { obraId: "obra-1", inicio: 0, fim: 20 },
  ]);
  assert.deepEqual(globalThis.chamadasRespostasComentarios, [
    { obraId: "obra-1", idsPais: idsRaizesExibidas },
    { obraId: "obra-1", idsPais: ["resposta-1"] },
    { obraId: "obra-1", idsPais: ["resposta-2"] },
  ]);
  assert.equal(pagina.temMais, true);
  assert.equal(pagina.proximoOffset, 20);
  assert.deepEqual(
    pagina.comentarios.map((comentario) => comentario.id),
    [...idsRaizesExibidas, "resposta-1", "resposta-2"],
  );
  assert.deepEqual(
    globalThis.comentariosEnviadosAoNormalizador[0].map(
      (comentario) => comentario.id,
    ),
    [...idsRaizesExibidas, "resposta-1", "resposta-2"],
  );
});

test("trata data raiz inválida como coleção vazia sem iniciar busca de descendentes", async () => {
  prepararCarregador({
    respostaRaizesComentarios: { data: { id: "invalido" }, error: null },
  });

  const pagina = await carregarPaginaComentariosObraSupabase("obra-1", -1);

  assert.deepEqual(globalThis.chamadasRaizesComentarios, [
    { obraId: "obra-1", inicio: 0, fim: 20 },
  ]);
  assert.deepEqual(globalThis.chamadasRespostasComentarios, []);
  assert.equal(pagina.temMais, false);
  assert.equal(pagina.proximoOffset, 0);
  assert.deepEqual(pagina.comentarios, []);
  assert.deepEqual(globalThis.comentariosEnviadosAoNormalizador, [[]]);
});

test("propaga sem transformação o erro bruto da consulta de raízes", async () => {
  const erro = new Error("falha das raízes");
  prepararCarregador({
    respostaRaizesComentarios: { data: null, error: erro },
  });

  await assert.rejects(
    carregarPaginaComentariosObraSupabase("obra-1", 40),
    (erroRecebido) => erroRecebido === erro,
  );
  assert.deepEqual(globalThis.chamadasRaizesComentarios, [
    { obraId: "obra-1", inicio: 40, fim: 60 },
  ]);
  assert.deepEqual(globalThis.chamadasRespostasComentarios, []);
  assert.deepEqual(globalThis.comentariosEnviadosAoNormalizador, []);
});
