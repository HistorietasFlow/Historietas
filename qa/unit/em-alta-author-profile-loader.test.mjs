import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-author-profile-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);

const estado = {
  chamadas: [],
  respostas: [],
};
globalThis.__emAltaAuthorProfileLoaderState = estado;

const moduloExecutavel = modulo
  .replace(
    'import { supabase } from "../../../lib/supabase/client";\n',
    `const supabase = {
  from(tabela) {
    const chamada = { tabela, operacoes: [] };
    globalThis.__emAltaAuthorProfileLoaderState.chamadas.push(chamada);
    return {
      select(campos) { chamada.operacoes.push(["select", campos]); return this; },
      in(campo, valores) { chamada.operacoes.push(["in", campo, valores]); return this; },
      async limit(limite) {
        chamada.operacoes.push(["limit", limite]);
        const resposta = globalThis.__emAltaAuthorProfileLoaderState.respostas.shift();
        if (resposta instanceof Error) throw resposta;
        return resposta || { data: [], error: null };
      },
    };
  },
};\n`,
  )
  .replace(
    'import { adicionarProfileAutorRankingNoMapa } from "./em-alta-author-profile-utils";\n',
    `const adicionarProfileAutorRankingNoMapa = (mapa, profile) => {
  const userId = typeof profile.user_id === "string" ? profile.user_id.trim() : "";
  const id = typeof profile.id === "string" ? profile.id.trim() : "";
  if (userId) mapa.set(userId, profile);
  if (id) mapa.set(id, profile);
};\n`,
  )
  .replace(
    'import type { SupabaseProfileAutorRankingRow } from "./em-alta-models";\n',
    "",
  );
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { carregarProfilesAutoresRanking } = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function resetarEstado() {
  estado.chamadas.length = 0;
  estado.respostas.length = 0;
}

test("loader retorna Map vazio sem consultar profiles para IDs vazios", async () => {
  resetarEstado();

  const resultado = await carregarProfilesAutoresRanking([" ", ""]);

  assert.ok(resultado instanceof Map);
  assert.equal(resultado.size, 0);
  assert.equal(estado.chamadas.length, 0);
});

test("loader preserva trim, deduplicação, queries e aliases no mesmo Map", async () => {
  resetarEstado();
  const profileUserId = { id: "profile-1", user_id: "user-1", nome: "Ana" };
  const profileId = { id: "profile-2", user_id: "user-2", nome: "Bia" };
  estado.respostas.push(
    { data: [profileUserId], error: null },
    { data: [profileId], error: null },
  );

  const resultado = await carregarProfilesAutoresRanking([
    " user-1 ",
    "",
    "user-1",
    " user-2 ",
  ]);

  assert.equal(resultado.get("user-1"), profileUserId);
  assert.equal(resultado.get("profile-1"), profileUserId);
  assert.equal(resultado.get("user-2"), profileId);
  assert.equal(resultado.get("profile-2"), profileId);
  assert.deepEqual(estado.chamadas, [
    {
      tabela: "profiles",
      operacoes: [
        ["select", "id,user_id,nome,avatar_url"],
        ["in", "user_id", ["user-1", "user-2"]],
        ["limit", 1000],
      ],
    },
    {
      tabela: "profiles",
      operacoes: [
        ["select", "id,user_id,nome,avatar_url"],
        ["in", "id", ["user-1", "user-2"]],
        ["limit", 1000],
      ],
    },
  ]);
});

test("erro retornado na primeira query preserva warning e ainda consulta por id", async () => {
  resetarEstado();
  estado.respostas.push(
    { data: null, error: { message: "falha user_id" } },
    { data: [], error: null },
  );
  const avisoOriginal = console.warn;
  const avisos = [];
  console.warn = (...argumentos) => avisos.push(argumentos);

  try {
    await carregarProfilesAutoresRanking(["user-1"]);
  } finally {
    console.warn = avisoOriginal;
  }

  assert.deepEqual(avisos, [
    ["Não consegui carregar profiles por user_id no ranking:", "falha user_id"],
  ]);
  assert.equal(estado.chamadas.length, 2);
  assert.equal(estado.chamadas[1].operacoes[1][1], "id");
});

test("exceções e erro da segunda query preservam warnings e fallback", async () => {
  resetarEstado();
  estado.respostas.push(
    new Error("falha user_id"),
    { data: null, error: { message: "falha id" } },
  );
  const avisoOriginal = console.warn;
  const avisos = [];
  console.warn = (...argumentos) => avisos.push(argumentos);

  try {
    const resultado = await carregarProfilesAutoresRanking(["user-1"]);
    assert.equal(resultado.size, 0);
  } finally {
    console.warn = avisoOriginal;
  }

  assert.equal(estado.chamadas.length, 2);
  assert.equal(avisos[0][0], "Não consegui acessar profiles por user_id no ranking:");
  assert.equal(avisos[1][0], "Não consegui carregar profiles por id no ranking:");

  resetarEstado();
  estado.respostas.push({ data: [], error: null }, new Error("falha id"));
  const avisosSegundaExcecao = [];
  console.warn = (...argumentos) => avisosSegundaExcecao.push(argumentos);

  try {
    await carregarProfilesAutoresRanking(["user-1"]);
  } finally {
    console.warn = avisoOriginal;
  }

  assert.equal(
    avisosSegundaExcecao[0][0],
    "Não consegui acessar profiles por id no ranking:",
  );
});

test("fronteira preserva loader de leitura e delegação da página", () => {
  assert.match(modulo, /export async function carregarProfilesAutoresRanking\b/);
  assert.match(
    modulo,
    /import \{ supabase \} from "\.\.\/\.\.\/\.\.\/lib\/supabase\/client";/,
  );
  assert.match(
    modulo,
    /import \{ adicionarProfileAutorRankingNoMapa \} from "\.\/em-alta-author-profile-utils";/,
  );
  assert.match(
    modulo,
    /import type \{ SupabaseProfileAutorRankingRow \} from "\.\/em-alta-models";/,
  );
  assert.match(
    modulo,
    /\.from\("profiles"\)\s*\.select\("id,user_id,nome,avatar_url"\)\s*\.in\("user_id", idsUnicos\)\s*\.limit\(1000\)/,
  );
  assert.match(
    modulo,
    /\.from\("profiles"\)\s*\.select\("id,user_id,nome,avatar_url"\)\s*\.in\("id", idsUnicos\)\s*\.limit\(1000\)/,
  );
  assert.ok(
    modulo.indexOf('.in("user_id", idsUnicos)') < modulo.indexOf('.in("id", idsUnicos)'),
  );
  assert.match(modulo, /Não consegui carregar profiles por user_id no ranking:/);
  assert.match(modulo, /Não consegui acessar profiles por user_id no ranking:/);
  assert.match(modulo, /Não consegui carregar profiles por id no ranking:/);
  assert.match(modulo, /Não consegui acessar profiles por id no ranking:/);
  assert.match(modulo, /adicionarProfileAutorRankingNoMapa\(profilesPorUsuario, profile\)/);

  for (const termoProibido of [
    /from ["']react["']/i,
    /\buse[A-Z]\w*\b/,
    /\blocalStorage\b/i,
    /\.auth\b/,
    /\.insert\(/,
    /\.update\(/,
    /\.delete\(/,
    /\.upsert\(/,
    /<[A-Z][\w.]*/,
  ]) {
    assert.doesNotMatch(modulo, termoProibido);
  }

  assert.match(
    pagina,
    /import \{ carregarProfilesAutoresRanking \} from "\.\/lib\/em-alta-author-profile-loader";/,
  );
  assert.doesNotMatch(pagina, /async function carregarProfilesAutoresRanking\b/);
});
