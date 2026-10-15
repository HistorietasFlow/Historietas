import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-author-profile-loader.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const obrasLoader = readFileSync(
  new URL("../../app/lib/home-supabase-works-loader.ts", import.meta.url),
  "utf8",
);

const estado = {
  chamadas: [],
  persistencias: [],
  respostas: [],
};
globalThis.__homeAuthorProfileLoaderState = estado;

const moduloExecutavel = modulo
  .replace(
    'import { supabase } from "../../lib/supabase/client";\n',
    `const supabase = {
  from(tabela) {
    const chamada = { tabela, select: "", in: [], limit: null };
    globalThis.__homeAuthorProfileLoaderState.chamadas.push(chamada);
    return {
      select(campos) {
        chamada.select = campos;
        return this;
      },
      in(campo, valores) {
        chamada.in.push([campo, valores]);
        return this;
      },
      async limit(limite) {
        chamada.limit = limite;
        const resposta = globalThis.__homeAuthorProfileLoaderState.respostas.shift();
        if (resposta?.erro) throw resposta.erro;
        return resposta?.resultado || { data: [], error: null };
      },
    };
  },
};
`,
  )
  .replace(
    'import { normalizarPerfilSupabaseHome } from "./home-author-profile-utils";\n',
    `const normalizarPerfilSupabaseHome = (perfil) => {
  const userId = [perfil.user_id, perfil.id]
    .find((valor) => typeof valor === "string" && Boolean(valor.trim()))
    ?.trim() || "";
  const nome = typeof perfil.nome === "string" ? perfil.nome.trim() : "";
  if (!userId || !nome) return null;
  return {
    userId,
    nome,
    avatar: typeof perfil.avatar_url === "string" ? perfil.avatar_url.trim() : "",
    bio: typeof perfil.bio === "string" && perfil.bio.trim()
      ? perfil.bio.trim()
      : typeof perfil.sobre_bio === "string" ? perfil.sobre_bio.trim() : "",
  };
};
`,
  )
  .replace(
    /import type \{[\s\S]*?\} from "\.\/home-author-profile-utils";\n/,
    "",
  )
  .replace(
    'import { salvarPerfisSupabaseHomeNoStorage } from "./home-author-storage-utils";\n',
    `const salvarPerfisSupabaseHomeNoStorage = (perfis, userId) => {
  globalThis.__homeAuthorProfileLoaderState.persistencias.push([perfis, userId]);
};
`,
  );

const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { carregarPerfisSupabaseHome } = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function perfil(overrides = {}) {
  return {
    id: "perfil-ana",
    user_id: "user-ana",
    nome: "Ana Souza",
    avatar_url: "ana.png",
    bio: "Bio da Ana",
    sobre_bio: "Sobre a Ana",
    ...overrides,
  };
}

function preparar(respostas) {
  estado.chamadas.length = 0;
  estado.persistencias.length = 0;
  estado.respostas = respostas;
}

async function comWarnings(callback) {
  const warnOriginal = console.warn;
  const warnings = [];
  console.warn = (...args) => warnings.push(args);

  try {
    return [await callback(), warnings];
  } finally {
    console.warn = warnOriginal;
  }
}

test("home-author-profile-loader ignora IDs vazios sem consultar ou persistir", async () => {
  preparar([]);

  const resultado = await carregarPerfisSupabaseHome(["", "  "], "usuario");

  assert.ok(resultado instanceof Map);
  assert.equal(resultado.size, 0);
  assert.deepEqual(estado.chamadas, []);
  assert.deepEqual(estado.persistencias, []);
});

test("home-author-profile-loader preserva trim, deduplicação e as duas consultas", async () => {
  preparar([
    { resultado: { data: [perfil()], error: null } },
    { resultado: { data: [], error: null } },
  ]);

  const resultado = await carregarPerfisSupabaseHome(
    [" user-ana ", "user-ana", " user-bia ", ""],
    "usuario",
  );

  assert.equal(resultado.get("user-ana")?.nome, "Ana Souza");
  assert.equal(resultado.get("perfil-ana")?.nome, "Ana Souza");
  assert.deepEqual(estado.chamadas, [
    {
      tabela: "profiles_publicos",
      select: "id, user_id, nome, avatar_url, bio, sobre_bio",
      in: [["user_id", ["user-ana", "user-bia"]]],
      limit: 1000,
    },
    {
      tabela: "profiles_publicos",
      select: "id, user_id, nome, avatar_url, bio, sobre_bio",
      in: [["id", ["user-ana", "user-bia"]]],
      limit: 1000,
    },
  ]);
  assert.deepEqual(estado.persistencias, [[[
    { userId: "user-ana", nome: "Ana Souza", avatar: "ana.png", bio: "Bio da Ana" },
  ], "usuario"]]);
});

test("home-author-profile-loader preserva dados da segunda consulta e aliases id/user_id", async () => {
  preparar([
    { resultado: { data: [], error: null } },
    { resultado: { data: [perfil({ id: "perfil-bia", user_id: " user-bia ", nome: "Bia" })], error: null } },
  ]);

  const resultado = await carregarPerfisSupabaseHome(["perfil-bia"]);

  assert.equal(resultado.get("user-bia")?.nome, "Bia");
  assert.equal(resultado.get("perfil-bia")?.nome, "Bia");
  assert.equal(estado.persistencias.length, 1);
});

test("home-author-profile-loader preserva duplicatas e descarta linhas inválidas", async () => {
  const duplicado = perfil();
  preparar([
    { resultado: { data: [duplicado, perfil({ nome: "  " })], error: null } },
    { resultado: { data: [duplicado], error: null } },
  ]);

  const resultado = await carregarPerfisSupabaseHome(["user-ana"]);

  assert.equal(resultado.size, 2);
  assert.equal(resultado.get("user-ana")?.nome, "Ana Souza");
  assert.equal(estado.persistencias[0][0].length, 2);
});

test("home-author-profile-loader mantém resultado e persistência se a primeira consulta retorna erro", async () => {
  preparar([
    { resultado: { data: null, error: { message: "falha user_id" } } },
    { resultado: { data: [perfil({ id: "perfil-bia", user_id: "user-bia", nome: "Bia" })], error: null } },
  ]);

  const [resultado, warnings] = await comWarnings(() => carregarPerfisSupabaseHome(["user-bia"], "usuario"));

  assert.equal(resultado.get("user-bia")?.nome, "Bia");
  assert.equal(warnings[0][0], "Não consegui carregar profiles da Home por user_id:");
  assert.equal(estado.persistencias.length, 1);
});

test("home-author-profile-loader mantém resultado e persistência se a segunda consulta retorna erro", async () => {
  preparar([
    { resultado: { data: [perfil()], error: null } },
    { resultado: { data: null, error: { message: "falha id" } } },
  ]);

  const [resultado, warnings] = await comWarnings(() => carregarPerfisSupabaseHome(["user-ana"], "usuario"));

  assert.equal(resultado.get("user-ana")?.nome, "Ana Souza");
  assert.equal(warnings[0][0], "Não consegui carregar profiles da Home por id:");
  assert.equal(estado.persistencias.length, 1);
});

test("home-author-profile-loader preserva fallbacks quando as consultas lançam exceções", async () => {
  preparar([
    { erro: new Error("falha user_id") },
    { erro: new Error("falha id") },
  ]);

  const [resultado, warnings] = await comWarnings(() => carregarPerfisSupabaseHome(["user-ana"], "usuario"));

  assert.equal(resultado.size, 0);
  assert.equal(warnings[0][0], "Não consegui acessar profiles da Home por user_id:");
  assert.equal(warnings[1][0], "Não consegui acessar profiles da Home por id:");
  assert.deepEqual(estado.persistencias, [[[], "usuario"]]);
});

test("home-author-profile-loader delega o loader Supabase para a fronteira dedicada", () => {
  assert.match(pagina, /from "\.\/lib\/home-supabase-works-loader";/);
  assert.doesNotMatch(
    pagina,
    /from "\.\/lib\/home-author-profile-loader";/,
  );
  assert.doesNotMatch(pagina, /async function carregarPerfisSupabaseHome\(/);
  assert.match(
    obrasLoader,
    /import \{ carregarPerfisSupabaseHome \} from "\.\/home-author-profile-loader";/,
  );
  assert.match(modulo, /import \{ supabase \} from "\.\.\/\.\.\/lib\/supabase\/client";/);
  assert.match(modulo, /import \{ normalizarPerfilSupabaseHome \} from "\.\/home-author-profile-utils";/);
  assert.match(modulo, /import \{ salvarPerfisSupabaseHomeNoStorage \} from "\.\/home-author-storage-utils";/);
  assert.match(modulo, /\.from\("profiles_publicos"\)/);
  assert.match(modulo, /\.in\("user_id", idsUnicos\)/);
  assert.match(modulo, /\.in\("id", idsUnicos\)/);
  assert.match(modulo, /\.limit\(1000\)/);
  assert.match(modulo, /salvarPerfisSupabaseHomeNoStorage\(perfisNormalizados, userId\)/);
  assert.doesNotMatch(modulo, /\.insert\(|\.update\(|\.delete\(|\.rpc\(/);
});
