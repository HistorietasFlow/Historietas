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

const perfisJavascript = [
  "export async function carregarPerfisPublicosObra(ids) {",
  '  globalThis.eventosNormalizadorComentarios.push({ etapa: "perfis", ids });',
  "  if (globalThis.erroPerfisNormalizadorComentarios) throw globalThis.erroPerfisNormalizadorComentarios;",
  "  return globalThis.perfisNormalizadorComentarios;",
  "}",
].join("\n");
const curtidasJavascript = [
  "export async function carregarCurtidasComentariosObraSupabase(ids) {",
  '  globalThis.eventosNormalizadorComentarios.push({ etapa: "curtidas", ids });',
  "  if (globalThis.erroCurtidasNormalizadorComentarios) throw globalThis.erroCurtidasNormalizadorComentarios;",
  "  return globalThis.curtidasNormalizadorComentarios;",
  "}",
].join("\n");
const perfisUrl = criarUrlModulo(perfisJavascript);
const curtidasUrl = criarUrlModulo(curtidasJavascript);
const normalizadorJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-supabase-comment-normalizer.ts",
)
  .replace('from "./obra-public-profile-loader";', `from "${perfisUrl}";`)
  .replace(
    'from "./obra-supabase-comment-likes-query";',
    `from "${curtidasUrl}";`,
  );
const { normalizarComentariosObraSupabase } = await import(
  criarUrlModulo(normalizadorJavascript),
);

function prepararNormalizador({
  perfis = new Map(),
  curtidas = [],
  erroPerfis = null,
  erroCurtidas = null,
} = {}) {
  globalThis.eventosNormalizadorComentarios = [];
  globalThis.perfisNormalizadorComentarios = perfis;
  globalThis.curtidasNormalizadorComentarios = curtidas;
  globalThis.erroPerfisNormalizadorComentarios = erroPerfis;
  globalThis.erroCurtidasNormalizadorComentarios = erroCurtidas;
}

test("deduplica IDs, carrega perfis antes das curtidas e preserva a ordem", async () => {
  prepararNormalizador({
    perfis: new Map([
      ["usuario-b", { nome: "Bia", avatar: "bia.png" }],
      ["usuario-a", { nome: "Ana", avatar: "ana.png" }],
    ]),
    curtidas: [
      { comentario_id: " comentario-1 ", usuario_id: " usuario-2 " },
      { comentario_id: "comentario-1", usuario_id: "usuario-1" },
      { comentario_id: "comentario-1", usuario_id: "usuario-2" },
      { comentario_id: "comentario-2", usuario_id: "" },
      { comentario_id: "", usuario_id: "usuario-3" },
    ],
  });

  const comentarios = await normalizarComentariosObraSupabase([
    {
      id: " comentario-1 ",
      obra_id: " obra-1 ",
      user_id: " usuario-b ",
      comentario: " Primeiro ",
      comentario_pai_id: " pai-1 ",
      criado_em: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "comentario-2",
      obra_id: "obra-1",
      user_id: "usuario-a",
      comentario: "Segundo",
      comentario_pai_id: null,
      criado_em: "2026-01-02T00:00:00.000Z",
    },
    {
      id: "comentario-1",
      obra_id: "obra-1",
      user_id: "usuario-b",
      comentario: "Terceiro",
      comentario_pai_id: null,
      criado_em: "2026-01-03T00:00:00.000Z",
    },
  ]);

  assert.deepEqual(globalThis.eventosNormalizadorComentarios, [
    { etapa: "perfis", ids: ["usuario-b", "usuario-a"] },
    { etapa: "curtidas", ids: ["comentario-1", "comentario-2"] },
  ]);
  assert.deepEqual(comentarios, [
    {
      id: "comentario-1",
      obraId: "obra-1",
      userId: "usuario-b",
      nome: "Bia",
      avatar: "bia.png",
      texto: "Primeiro",
      criadoEm: "2026-01-01T00:00:00.000Z",
      comentarioPaiId: "pai-1",
      local: false,
      curtidas: ["usuario-2", "usuario-1"],
    },
    {
      id: "comentario-2",
      obraId: "obra-1",
      userId: "usuario-a",
      nome: "Ana",
      avatar: "ana.png",
      texto: "Segundo",
      criadoEm: "2026-01-02T00:00:00.000Z",
      comentarioPaiId: "",
      local: false,
      curtidas: [],
    },
    {
      id: "comentario-1",
      obraId: "obra-1",
      userId: "usuario-b",
      nome: "Bia",
      avatar: "bia.png",
      texto: "Terceiro",
      criadoEm: "2026-01-03T00:00:00.000Z",
      comentarioPaiId: "",
      local: false,
      curtidas: ["usuario-2", "usuario-1"],
    },
  ]);
});

test("propaga a falha dos perfis sem iniciar o carregamento de curtidas", async () => {
  const erro = new Error("falha dos perfis");
  prepararNormalizador({ erroPerfis: erro });

  await assert.rejects(
    normalizarComentariosObraSupabase([
      {
        id: "comentario-1",
        obra_id: "obra-1",
        user_id: "usuario-1",
        comentario: "Texto",
        comentario_pai_id: null,
        criado_em: null,
      },
    ]),
    (erroRecebido) => erroRecebido === erro,
  );
  assert.deepEqual(globalThis.eventosNormalizadorComentarios, [
    { etapa: "perfis", ids: ["usuario-1"] },
  ]);
});

test("absorve a falha das curtidas e conserva os comentários normalizados", async () => {
  prepararNormalizador({
    erroCurtidas: new Error("falha das curtidas"),
  });

  const [comentario] = await normalizarComentariosObraSupabase([
    {
      id: "comentario-1",
      obra_id: "obra-1",
      user_id: "usuario-1",
      comentario: "Texto",
      comentario_pai_id: null,
      criado_em: "2026-01-01T00:00:00.000Z",
    },
  ]);

  assert.deepEqual(globalThis.eventosNormalizadorComentarios, [
    { etapa: "perfis", ids: ["usuario-1"] },
    { etapa: "curtidas", ids: ["comentario-1"] },
  ]);
  assert.equal(comentario.curtidas.length, 0);
  assert.equal(comentario.nome, "Usuário");
  assert.equal(comentario.avatar, "");
});

test("descarta linhas inválidas e preserva os fallbacks finais", async () => {
  prepararNormalizador();

  const comentarios = await normalizarComentariosObraSupabase([
    {
      id: "",
      obra_id: "obra-1",
      user_id: "usuario-1",
      comentario: "Texto",
      comentario_pai_id: null,
      criado_em: null,
    },
    {
      id: "comentario-2",
      obra_id: "",
      user_id: "usuario-1",
      comentario: "Texto",
      comentario_pai_id: null,
      criado_em: null,
    },
    {
      id: "comentario-3",
      obra_id: "obra-1",
      user_id: "",
      comentario: "Texto",
      comentario_pai_id: null,
      criado_em: null,
    },
    {
      id: "comentario-4",
      obra_id: "obra-1",
      user_id: "usuario-1",
      comentario: "  ",
      comentario_pai_id: null,
      criado_em: null,
    },
    {
      id: " comentario-valido ",
      obra_id: " obra-valida ",
      user_id: " usuario-valido ",
      comentario: " Texto válido ",
      comentario_pai_id: " pai ",
      criado_em: null,
    },
  ]);

  assert.equal(comentarios.length, 1);
  assert.deepEqual(comentarios[0], {
    id: "comentario-valido",
    obraId: "obra-valida",
    userId: "usuario-valido",
    nome: "Usuário",
    avatar: "",
    texto: "Texto válido",
    criadoEm: comentarios[0].criadoEm,
    comentarioPaiId: "pai",
    local: false,
    curtidas: [],
  });
  assert.match(comentarios[0].criadoEm, /^\d{4}-\d{2}-\d{2}T/);
});
