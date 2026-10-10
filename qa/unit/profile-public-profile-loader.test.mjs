import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-public-profile-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

function criarConsulta(respostas, chamadas, tabela) {
  const chamada = {
    tabela,
    select: "",
    eq: [],
    limit: null,
    maybeSingle: false,
  };
  chamadas.push(chamada);

  const consulta = {
    select(valor) {
      chamada.select = valor;
      return consulta;
    },
    eq(campo, valor) {
      chamada.eq.push([campo, valor]);
      return consulta;
    },
    limit(valor) {
      chamada.limit = valor;
      return consulta;
    },
    async maybeSingle() {
      chamada.maybeSingle = true;
      return respostas.shift() ?? { data: null, error: null };
    },
  };

  return consulta;
}

async function carregarModulo({
  respostas = [],
  idValido = true,
  normalizado = { nome: "Perfil normalizado" },
} = {}) {
  const chamadas = [];
  const normalizacoes = [];
  const dependencias = {
    supabase: {
      from(tabela) {
        return criarConsulta(respostas, chamadas, tabela);
      },
    },
    idAutorSupabaseValido() {
      return idValido;
    },
    normalizarPerfilUsuarioSupabase(perfil, userId, nomeFallback) {
      normalizacoes.push([perfil, userId, nomeFallback]);
      return normalizado;
    },
  };
  globalThis.__profilePublicProfileLoaderDependencies = dependencias;

  const javascript = typescript.transpileModule(
    source
      .replace(
        'import { supabase } from "../../../lib/supabase/client";',
        "const supabase = globalThis.__profilePublicProfileLoaderDependencies.supabase;",
      )
      .replace('import type { PerfilUsuarioRemoto } from "../types";\n', "")
      .replace(
        'import { normalizarPerfilUsuarioSupabase } from "./data-normalizers";',
        "const normalizarPerfilUsuarioSupabase = globalThis.__profilePublicProfileLoaderDependencies.normalizarPerfilUsuarioSupabase;",
      )
      .replace(
        'import { idAutorSupabaseValido } from "./profile-formatters";',
        "const idAutorSupabaseValido = globalThis.__profilePublicProfileLoaderDependencies.idAutorSupabaseValido;",
      ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  ).outputText;

  const modulo = await import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${indiceModulo++}`,
  );

  return { ...modulo, chamadas, normalizacoes };
}

test("rejeita ID inválido sem consultar o Supabase", async () => {
  const modulo = await carregarModulo({ idValido: false });

  assert.equal(
    await modulo.carregarPerfilUsuarioSupabase(" usuario-invalido ", "Nome"),
    null,
  );
  assert.deepEqual(modulo.chamadas, []);
  assert.deepEqual(modulo.normalizacoes, []);
});

test("consulta primeiro user_id e normaliza o perfil encontrado", async () => {
  const perfil = { id: "perfil-1", user_id: "usuario-1", nome: "Ana" };
  const normalizado = { nome: "Ana normalizada" };
  const modulo = await carregarModulo({
    respostas: [{ data: perfil, error: null }],
    normalizado,
  });

  assert.equal(
    await modulo.carregarPerfilUsuarioSupabase(" usuario-1 ", "Fallback"),
    normalizado,
  );
  assert.deepEqual(modulo.chamadas, [
    {
      tabela: "profiles_publicos",
      select: "id,user_id,nome,avatar_url,bio,sobre_bio,criado_em,username",
      eq: [["user_id", "usuario-1"]],
      limit: 1,
      maybeSingle: true,
    },
  ]);
  assert.deepEqual(modulo.normalizacoes, [
    [perfil, "usuario-1", "Fallback"],
  ]);
});

test("faz fallback por id somente quando user_id não encontra perfil", async () => {
  const perfil = { id: "usuario-2", nome: "Beto" };
  const modulo = await carregarModulo({
    respostas: [
      { data: null, error: null },
      { data: perfil, error: null },
    ],
  });

  await modulo.carregarPerfilUsuarioSupabase("usuario-2", "Fallback");

  assert.deepEqual(
    modulo.chamadas.map((chamada) => chamada.eq),
    [
      [["user_id", "usuario-2"]],
      [["id", "usuario-2"]],
    ],
  );
  assert.deepEqual(modulo.normalizacoes, [
    [perfil, "usuario-2", "Fallback"],
  ]);
});

test("propaga erro de consulta e não normaliza dados inválidos", async () => {
  const erro = new Error("consulta indisponível");
  const moduloErro = await carregarModulo({
    respostas: [{ data: null, error: erro }],
  });
  await assert.rejects(
    moduloErro.carregarPerfilUsuarioSupabase("usuario-3", "Fallback"),
    erro,
  );
  assert.deepEqual(moduloErro.normalizacoes, []);

  const moduloSemPerfil = await carregarModulo({
    respostas: [
      { data: [], error: null },
      { data: null, error: null },
    ],
    normalizado: null,
  });
  assert.equal(
    await moduloSemPerfil.carregarPerfilUsuarioSupabase(
      "usuario-4",
      "Fallback",
    ),
    null,
  );
  assert.deepEqual(moduloSemPerfil.normalizacoes, [
    [null, "usuario-4", "Fallback"],
  ]);
});

test("Perfil de Autor delega o carregamento público para o novo módulo", () => {
  assert.match(
    pagina,
    /import \{ carregarPerfilUsuarioSupabase \} from "\.\/lib\/profile-public-profile-loader";/,
  );
  assert.doesNotMatch(pagina, /async function carregarPerfilUsuarioSupabase\(/);
  assert.doesNotMatch(pagina, /normalizarPerfilUsuarioSupabase/);
  assert.match(source, /export async function carregarPerfilUsuarioSupabase\(/);
  assert.match(source, /\.from\("profiles_publicos"\)/);
  assert.match(source, /\.eq\(campo, userIdLimpo\)/);
  assert.doesNotMatch(source, /useState|useEffect|localStorage/);
});
