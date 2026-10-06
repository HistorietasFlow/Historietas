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
  "  auth: {",
  "    getUser: async () => {",
  "      globalThis.chamadasGetUser += 1;",
  "      if (globalThis.respostaGetUser instanceof Error) throw globalThis.respostaGetUser;",
  "      return globalThis.respostaGetUser;",
  "    },",
  "  },",
  "};",
].join("\n");
const utilsJavascript = [
  "export function idObraSupabaseValido(id) {",
  "  return id.startsWith(\"valido-\");",
  "}",
].join("\n");
const loaderJavascript = [
  "export async function carregarPerfisPublicosObra(ids) {",
  "  globalThis.chamadasPerfisPublicos.push(ids);",
  "  return globalThis.perfisPublicos;",
  "}",
].join("\n");
const textoJavascript = [
  "export function obterTextoPerfilObra(registro, chave) {",
  "  const valor = registro[chave];",
  "  return typeof valor === \"string\" && valor.trim() ? valor.trim() : \"\";",
  "}",
  "export function normalizarPerfilPublicoObra(profile, userId, nomeFallback) {",
  "  globalThis.normalizacoes.push({ profile, userId, nomeFallback });",
  "  return { userId, nome: `normalizado:${nomeFallback}`, avatar: \"\", bio: \"\" };",
  "}",
].join("\n");
const supabaseUrl = criarUrlModulo(supabaseJavascript);
const utilsUrl = criarUrlModulo(utilsJavascript);
const loaderUrl = criarUrlModulo(loaderJavascript);
const textoUrl = criarUrlModulo(textoJavascript);
const resolvedorJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-public-profile-resolver.ts",
)
  .replace(
    'from "../../../../lib/supabase/client";',
    `from "${supabaseUrl}";`,
  )
  .replace('from "../../../../lib/utils";', `from "${utilsUrl}";`)
  .replace(
    'from "./obra-public-profile-loader";',
    `from "${loaderUrl}";`,
  )
  .replace('from "./obra-text-utils";', `from "${textoUrl}";`);
const { carregarPerfilPublicoObra } = await import(
  criarUrlModulo(resolvedorJavascript),
);

function prepararResolvedor({
  perfisPublicos = new Map(),
  respostaGetUser = { data: { user: null } },
} = {}) {
  globalThis.chamadasPerfisPublicos = [];
  globalThis.chamadasGetUser = 0;
  globalThis.normalizacoes = [];
  globalThis.perfisPublicos = perfisPublicos;
  globalThis.respostaGetUser = respostaGetUser;
}

test("retorna null para ID vazio ou invalido sem consultas", async () => {
  prepararResolvedor();

  assert.equal(await carregarPerfilPublicoObra("", "Fallback"), null);
  assert.equal(await carregarPerfilPublicoObra("  ", "Fallback"), null);
  assert.equal(await carregarPerfilPublicoObra("invalido", "Fallback"), null);
  assert.deepEqual(globalThis.chamadasPerfisPublicos, []);
  assert.equal(globalThis.chamadasGetUser, 0);
  assert.deepEqual(globalThis.normalizacoes, []);
});

test("prioriza o perfil publico e nao consulta a sessao", async () => {
  const perfilPublico = {
    userId: "valido-publico",
    nome: "Perfil público",
    avatar: "avatar-publico",
    bio: "bio pública",
  };
  prepararResolvedor({
    perfisPublicos: new Map([["valido-publico", perfilPublico]]),
  });

  const perfil = await carregarPerfilPublicoObra(" valido-publico ", "Fallback");

  assert.equal(perfil, perfilPublico);
  assert.deepEqual(globalThis.chamadasPerfisPublicos, [["valido-publico"]]);
  assert.equal(globalThis.chamadasGetUser, 0);
  assert.deepEqual(globalThis.normalizacoes, []);
});

test("usa metadata somente para o proprio usuario e preserva prioridades", async () => {
  prepararResolvedor({
    respostaGetUser: {
      data: {
        user: {
          id: "valido-proprio",
          email: "email@example.com",
          user_metadata: {
            nome: " Nome prioritário ",
            name: "Name secundário",
            full_name: "Full name terciário",
            avatar_url: " avatar-url ",
            avatar: "avatar secundário",
            picture: "picture terciária",
          },
        },
      },
    },
  });

  const perfil = await carregarPerfilPublicoObra("valido-proprio", "Fallback");

  assert.deepEqual(perfil, {
    userId: "valido-proprio",
    nome: "Nome prioritário",
    avatar: "avatar-url",
    bio: "",
  });
  assert.equal(globalThis.chamadasGetUser, 1);
  assert.deepEqual(globalThis.normalizacoes, []);
});

test("ignora metadata de outra identidade e usa o fallback final normalizado", async () => {
  prepararResolvedor({
    respostaGetUser: {
      data: {
        user: {
          id: "valido-outra-pessoa",
          user_metadata: { nome: "Não deve aparecer" },
        },
      },
    },
  });

  const perfil = await carregarPerfilPublicoObra("valido-alvo", "Fallback");

  assert.deepEqual(perfil, {
    userId: "valido-alvo",
    nome: "normalizado:Fallback",
    avatar: "",
    bio: "",
  });
  assert.deepEqual(globalThis.normalizacoes, [
    { profile: null, userId: "valido-alvo", nomeFallback: "Fallback" },
  ]);
});

test("preserva a cascata de nome, avatar, limite e bio vazio", async () => {
  const casosNome = [
    { metadata: { name: "Nome" }, email: "", nomeEsperado: "Nome" },
    {
      metadata: { full_name: "Nome completo" },
      email: "",
      nomeEsperado: "Nome completo",
    },
    { metadata: {}, email: "email@example.com", nomeEsperado: "email" },
    { metadata: {}, email: "", nomeEsperado: "Fallback" },
  ];

  for (const { metadata, email, nomeEsperado } of casosNome) {
    prepararResolvedor({
      respostaGetUser: {
        data: {
          user: {
            id: "valido-cascata",
            email,
            user_metadata: metadata,
          },
        },
      },
    });

    const perfil = await carregarPerfilPublicoObra("valido-cascata", "Fallback");
    assert.equal(perfil.nome, nomeEsperado);
  }

  prepararResolvedor({
    respostaGetUser: {
      data: {
        user: {
          id: "valido-avatar",
          user_metadata: { avatar: "avatar", picture: "picture" },
        },
      },
    },
  });
  assert.equal(
    (await carregarPerfilPublicoObra("valido-avatar", "Fallback")).avatar,
    "avatar",
  );

  prepararResolvedor({
    respostaGetUser: {
      data: {
        user: {
          id: "valido-limite",
          user_metadata: { nome: "a".repeat(81), picture: "picture" },
        },
      },
    },
  });
  const perfilLimitado = await carregarPerfilPublicoObra("valido-limite", "Fallback");
  assert.equal(perfilLimitado.nome, "a".repeat(80));
  assert.equal(perfilLimitado.avatar, "picture");
  assert.equal(perfilLimitado.bio, "");
});

test("aceita metadata somente quando ela e um objeto", async () => {
  prepararResolvedor({
    respostaGetUser: {
      data: {
        user: {
          id: "valido-metadata",
          user_metadata: "invalido",
        },
      },
    },
  });

  const perfil = await carregarPerfilPublicoObra("valido-metadata", "Fallback");

  assert.deepEqual(perfil, {
    userId: "valido-metadata",
    nome: "Fallback",
    avatar: "",
    bio: "",
  });
  assert.deepEqual(globalThis.normalizacoes, []);
});

test("absorve erro de getUser e trata sessao ausente pelo fallback final", async () => {
  prepararResolvedor({ respostaGetUser: new Error("falha da sessao") });
  const perfilComErro = await carregarPerfilPublicoObra("valido-erro", "Fallback erro");

  assert.deepEqual(perfilComErro, {
    userId: "valido-erro",
    nome: "normalizado:Fallback erro",
    avatar: "",
    bio: "",
  });

  prepararResolvedor();
  const perfilSemSessao = await carregarPerfilPublicoObra("valido-sem-sessao", "Fallback sessão");

  assert.deepEqual(perfilSemSessao, {
    userId: "valido-sem-sessao",
    nome: "normalizado:Fallback sessão",
    avatar: "",
    bio: "",
  });
  assert.equal(globalThis.chamadasGetUser, 1);
});
