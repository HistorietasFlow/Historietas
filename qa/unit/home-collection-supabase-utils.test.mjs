import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-collection-supabase-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const acaoFavoritoHero = readFileSync(
  new URL("../../app/lib/home-hero-favorite-action.ts", import.meta.url),
  "utf8",
);
const loaderInicial = readFileSync(
  new URL("../../app/lib/home-initial-data-loader.ts", import.meta.url),
  "utf8",
);

const estado = {
  chamadas: [],
  colecoes: [],
  usuario: { id: "usuario-1" },
  respostasRange: [],
  respostasInsert: [],
  respostasDelete: [],
};
globalThis.__homeCollectionSupabaseUtilsState = estado;

const moduloExecutavel = modulo
  .replace(
    'import { supabase } from "../../lib/supabase/client";\n',
    `const supabase = {
  auth: {
    async getUser() {
      return { data: { user: globalThis.__homeCollectionSupabaseUtilsState.usuario } };
    },
  },
  from(tabela) {
    const chamada = { tabela, operacoes: [] };
    let deletePendente = false;
    globalThis.__homeCollectionSupabaseUtilsState.chamadas.push(chamada);
    const builder = {
      select(campos) { chamada.operacoes.push(["select", campos]); return this; },
      eq(campo, valor) { chamada.operacoes.push(["eq", campo, valor]); return this; },
      order(campo, opcoes) { chamada.operacoes.push(["order", campo, opcoes]); return this; },
      async range(inicio, fim) {
        chamada.operacoes.push(["range", inicio, fim]);
        const resposta = globalThis.__homeCollectionSupabaseUtilsState.respostasRange.shift();
        if (resposta?.erro) throw resposta.erro;
        return resposta?.resultado || { data: [], error: null };
      },
      delete() { chamada.operacoes.push(["delete"]); deletePendente = true; return this; },
      async insert(payload) {
        chamada.operacoes.push(["insert", payload]);
        const resposta = globalThis.__homeCollectionSupabaseUtilsState.respostasInsert.shift();
        if (resposta?.erro) throw resposta.erro;
        return resposta?.resultado || { error: null };
      },
    };
    builder.then = (resolver, rejeitar) => {
      if (!deletePendente) return undefined;
      const resposta = globalThis.__homeCollectionSupabaseUtilsState.respostasDelete.shift();
      if (resposta?.erro) return rejeitar(resposta.erro);
      return resolver(resposta?.resultado || { error: null });
    };
    return builder;
  },
};
`,
  )
  .replace(
    'import { carregarTodasPaginasSupabase } from "../../lib/supabase/paginacao.mjs";\n',
    `const carregarTodasPaginasSupabase = async ({ nomeColecao, buscarPagina }) => {
  globalThis.__homeCollectionSupabaseUtilsState.colecoes.push(nomeColecao);
  const resultado = await buscarPagina(0, 99);
  if (resultado.error) throw resultado.error;
  return resultado.data || [];
};
`,
  )
  .replace(
    'import { idObraSupabaseValido } from "../../lib/utils";\n',
    'const idObraSupabaseValido = (id) => id === "obra-valida";\n',
  )
  .replace(
    'import { normalizarListaIdsHome } from "./home-collection-utils";\n',
    'const normalizarListaIdsHome = (ids) => Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));\n',
  );

const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { carregarIdsColecaoUsuarioHome, sincronizarColecaoObraHome } = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function resetarEstado() {
  estado.chamadas.length = 0;
  estado.colecoes.length = 0;
  estado.usuario = { id: "usuario-1" };
  estado.respostasRange.length = 0;
  estado.respostasInsert.length = 0;
  estado.respostasDelete.length = 0;
}

test("home-collection-supabase-utils carrega coleções paginadas com trim e normalização", async () => {
  resetarEstado();
  estado.respostasRange.push({
    resultado: {
      data: [
        { obra_id: " obra-1 " },
        { obra_id: "obra-1" },
        { obra_id: "obra-2" },
        { obra_id: 3 },
        null,
        [],
      ],
      error: null,
    },
  });

  const ids = await carregarIdsColecaoUsuarioHome("favoritos", " usuario-1 ");

  assert.deepEqual(ids, ["obra-1", "obra-2"]);
  assert.deepEqual(estado.colecoes, ["favoritos da Home"]);
  assert.deepEqual(estado.chamadas[0], {
    tabela: "favoritos",
    operacoes: [
      ["select", "obra_id"],
      ["eq", "user_id", "usuario-1"],
      ["order", "obra_id", { ascending: true }],
      ["range", 0, 99],
    ],
  });
});

test("home-collection-supabase-utils preserva vazio, concluídas e fallback de falha", async () => {
  resetarEstado();
  assert.deepEqual(await carregarIdsColecaoUsuarioHome("favoritos", "  "), []);
  assert.equal(estado.chamadas.length, 0);

  estado.respostasRange.push({ erro: new Error("indisponível") });
  assert.deepEqual(await carregarIdsColecaoUsuarioHome("concluidas", "usuario-2"), []);
  assert.equal(estado.colecoes[0], "concluidas da Home");
  assert.equal(estado.chamadas[0].tabela, "concluidas");
});

test("home-collection-supabase-utils sincroniza delete, inserção parcial e fallback", async () => {
  resetarEstado();
  assert.equal(
    await sincronizarColecaoObraHome("favoritos", "obra-valida", true),
    true,
  );
  assert.equal(estado.chamadas.length, 2);
  assert.deepEqual(estado.chamadas[1].operacoes, [["insert", {
    user_id: "usuario-1",
    obra_id: "obra-valida",
    visibilidade: "parcial",
  }]]);

  resetarEstado();
  estado.respostasInsert.push(
    { resultado: { error: { message: "visibilidade ausente" } } },
    { resultado: { error: null } },
  );

  assert.equal(
    await sincronizarColecaoObraHome("favoritos", "obra-valida", true),
    true,
  );
  assert.deepEqual(estado.chamadas[0], {
    tabela: "favoritos",
    operacoes: [
      ["delete"],
      ["eq", "user_id", "usuario-1"],
      ["eq", "obra_id", "obra-valida"],
    ],
  });
  assert.deepEqual(estado.chamadas[1].operacoes, [["insert", {
    user_id: "usuario-1",
    obra_id: "obra-valida",
    visibilidade: "parcial",
  }]]);
  assert.deepEqual(estado.chamadas[2].operacoes, [["insert", {
    user_id: "usuario-1",
    obra_id: "obra-valida",
  }]]);
});

test("home-collection-supabase-utils preserva guards, remoção e falhas de sincronização", async () => {
  resetarEstado();
  estado.usuario = null;
  assert.equal(await sincronizarColecaoObraHome("favoritos", "obra-valida", true), false);
  assert.equal(estado.chamadas.length, 0);

  estado.usuario = { id: "usuario-1" };
  assert.equal(await sincronizarColecaoObraHome("concluidas", "inválida", true), false);
  assert.equal(estado.chamadas.length, 0);

  assert.equal(await sincronizarColecaoObraHome("concluidas", "obra-valida", false), true);
  assert.equal(estado.chamadas.length, 1);
  assert.equal(estado.chamadas[0].tabela, "concluidas");
  assert.equal(estado.chamadas.filter(({ operacoes }) => operacoes.some(([tipo]) => tipo === "insert")).length, 0);

  resetarEstado();
  const avisoOriginal = console.warn;
  const avisos = [];
  console.warn = (...args) => avisos.push(args);
  estado.respostasInsert.push(
    { resultado: { error: { message: "falhou" } } },
    { resultado: { error: { message: "falhou novamente" } } },
  );
  try {
    assert.equal(await sincronizarColecaoObraHome("concluidas", "obra-valida", true), false);
  } finally {
    console.warn = avisoOriginal;
  }
  assert.match(avisos[0][0], /Não consegui sincronizar concluidas na Home:/);

  resetarEstado();
  const avisosDelete = [];
  console.warn = (...args) => avisosDelete.push(args);
  estado.respostasDelete.push({ resultado: { error: { message: "delete falhou" } } });
  try {
    assert.equal(await sincronizarColecaoObraHome("favoritos", "obra-valida", true), false);
  } finally {
    console.warn = avisoOriginal;
  }
  assert.match(avisosDelete[0][0], /Não consegui sincronizar favoritos na Home:/);
});

test("home-collection-supabase-utils estabelece a fronteira das coleções", () => {
  assert.match(
    pagina,
    /import \{ carregarSnapshotInicialHome \} from "\.\/lib\/home-initial-data-loader";/,
  );
  assert.match(
    loaderInicial,
    /import \{ carregarIdsColecaoUsuarioHome \} from "\.\/home-collection-supabase-utils";/,
  );
  assert.match(
    acaoFavoritoHero,
    /import \{ sincronizarColecaoObraHome \} from "\.\/home-collection-supabase-utils";/,
  );
  assert.doesNotMatch(pagina, /async function carregarIdsColecaoUsuarioHome\b/);
  assert.doesNotMatch(pagina, /async function sincronizarColecaoObraHome\b/);
  assert.match(modulo, /export async function carregarIdsColecaoUsuarioHome\b/);
  assert.match(modulo, /export async function sincronizarColecaoObraHome\b/);
  assert.match(modulo, /\.from\(tabela\)\s*\.select\("obra_id"\)\s*\.eq\("user_id", userIdLimpo\)\s*\.order\("obra_id", \{ ascending: true \}\)\s*\.range\(inicio, fim\)/);
  assert.match(modulo, /\.from\(tabela\)\s*\.delete\(\)\s*\.eq\("user_id", userId\)\s*\.eq\("obra_id", obraId\)/);
  assert.match(modulo, /visibilidade: "parcial"/);
  assert.match(modulo, /\.insert\(payloadBase\)/);
  assert.doesNotMatch(modulo, /useEffect|useState|localStorage|carregarObrasSupabaseHome/);
  assert.match(
    pagina,
    /import \{[\s\S]*?carregarObrasSupabaseHome,[\s\S]*?\} from "\.\/lib\/home-supabase-works-loader";/,
  );
});
