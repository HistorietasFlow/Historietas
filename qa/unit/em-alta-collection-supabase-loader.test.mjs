import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-collection-supabase-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const rankingLoaderFase891 = readFileSync(
  new URL("../../app/em-alta/hooks/use-em-alta-ranking-loader.ts", import.meta.url),
  "utf8",
);
const colecoesRanking = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-ranking-collections-loader.ts",
    import.meta.url,
  ),
  "utf8",
);

const estado = {
  chamadas: [],
  respostas: [],
  colecoes: [],
  falharPaginacao: null,
};
globalThis.__emAltaCollectionSupabaseLoaderState = estado;

const moduloExecutavel = modulo
  .replace(
    'import { supabase } from "../../../lib/supabase/client";\n',
    `const supabase = {
  from(tabela) {
    const chamada = { tabela, operacoes: [] };
    globalThis.__emAltaCollectionSupabaseLoaderState.chamadas.push(chamada);
    return {
      select(campos) { chamada.operacoes.push(["select", campos]); return this; },
      eq(campo, valor) { chamada.operacoes.push(["eq", campo, valor]); return this; },
      order(campo, opcoes) { chamada.operacoes.push(["order", campo, opcoes]); return this; },
      async range(inicio, fim) {
        chamada.operacoes.push(["range", inicio, fim]);
        return globalThis.__emAltaCollectionSupabaseLoaderState.respostas.shift() || {
          data: [],
          error: null,
        };
      },
    };
  },
};\n`,
  )
  .replace(
    'import { carregarTodasPaginasSupabase } from "../../../lib/supabase/paginacao.mjs";\n',
    `const carregarTodasPaginasSupabase = async ({ nomeColecao, buscarPagina }) => {
  const estado = globalThis.__emAltaCollectionSupabaseLoaderState;
  estado.colecoes.push(nomeColecao);
  if (estado.falharPaginacao) throw estado.falharPaginacao;
  const resposta = await buscarPagina(20, 39);
  if (resposta.error) throw resposta.error;
  return resposta.data || [];
};\n`,
  )
  .replace(
    'import { normalizarListaIdsEmAlta } from "./em-alta-ranking-list-utils";\n',
    `const normalizarListaIdsEmAlta = (valor) => Array.isArray(valor)
  ? Array.from(new Set(valor
    .filter((id) => typeof id === "string")
    .map((id) => id.trim())
    .filter(Boolean)))
  : [];\n`,
  );

const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { carregarIdsColecaoUsuarioSupabaseEmAlta } = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function resetarEstado() {
  estado.chamadas.length = 0;
  estado.respostas.length = 0;
  estado.colecoes.length = 0;
  estado.falharPaginacao = null;
}

test("loader retorna lista vazia sem consultar para usuário vazio", async () => {
  resetarEstado();

  assert.deepEqual(
    await carregarIdsColecaoUsuarioSupabaseEmAlta("favoritos", "  "),
    [],
  );
  assert.equal(estado.chamadas.length, 0);
  assert.equal(estado.colecoes.length, 0);
});

test("loader preserva query paginada e normaliza IDs de favoritos", async () => {
  resetarEstado();
  estado.respostas.push({
    data: [
      { obra_id: " obra-1 " },
      { obra_id: "obra-1" },
      { obra_id: "obra-2" },
      { obra_id: 3 },
      null,
      [],
    ],
    error: null,
  });

  assert.deepEqual(
    await carregarIdsColecaoUsuarioSupabaseEmAlta("favoritos", " usuario-1 "),
    ["obra-1", "obra-2"],
  );
  assert.deepEqual(estado.colecoes, ["favoritos do Em Alta"]);
  assert.deepEqual(estado.chamadas, [
    {
      tabela: "favoritos",
      operacoes: [
        ["select", "obra_id"],
        ["eq", "user_id", "usuario-1"],
        ["order", "obra_id", { ascending: true }],
        ["range", 20, 39],
      ],
    },
  ]);
});

test("loader preserva concluidas e fallback com aviso literal", async () => {
  resetarEstado();
  estado.respostas.push({ error: new Error("indisponível") });
  const avisoOriginal = console.warn;
  const avisos = [];
  console.warn = (...argumentos) => avisos.push(argumentos);

  try {
    assert.deepEqual(
      await carregarIdsColecaoUsuarioSupabaseEmAlta("concluidas", "usuario-2"),
      [],
    );
  } finally {
    console.warn = avisoOriginal;
  }

  assert.deepEqual(estado.colecoes, ["concluidas do Em Alta"]);
  assert.equal(estado.chamadas[0].tabela, "concluidas");
  assert.equal(avisos[0][0], "Não consegui acessar concluidas no Em Alta:");
  assert.ok(avisos[0][1] instanceof Error);
});

test("loader preserva fallback quando a paginação lança", async () => {
  resetarEstado();
  estado.falharPaginacao = new Error("paginação indisponível");
  const avisoOriginal = console.warn;
  console.warn = () => {};

  try {
    assert.deepEqual(
      await carregarIdsColecaoUsuarioSupabaseEmAlta("favoritos", "usuario-3"),
      [],
    );
  } finally {
    console.warn = avisoOriginal;
  }
});

test("fronteira preserva imports, contratos de query e ausência de escrita", () => {
  assert.match(modulo, /export async function carregarIdsColecaoUsuarioSupabaseEmAlta\b/);
  assert.match(
    modulo,
    /import \{ supabase \} from "\.\.\/\.\.\/\.\.\/lib\/supabase\/client";/,
  );
  assert.match(
    modulo,
    /import \{ carregarTodasPaginasSupabase \} from "\.\.\/\.\.\/\.\.\/lib\/supabase\/paginacao\.mjs";/,
  );
  assert.match(
    modulo,
    /import \{ normalizarListaIdsEmAlta \} from "\.\/em-alta-ranking-list-utils";/,
  );
  assert.match(modulo, /tabela: "favoritos" \| "concluidas"/);
  assert.match(modulo, /nomeColecao: `\$\{tabela\} do Em Alta`/);
  assert.match(
    modulo,
    /\.from\(tabela\)\s*\.select\("obra_id"\)\s*\.eq\("user_id", userIdLimpo\)\s*\.order\("obra_id", \{ ascending: true \}\)\s*\.range\(inicio, fim\)/,
  );
  assert.match(modulo, /typeof registro !== "object"/);
  assert.match(modulo, /Array\.isArray\(registro\)/);
  assert.match(modulo, /normalizarListaIdsEmAlta\(/);
  assert.match(modulo, /console\.warn\(`Não consegui acessar \$\{tabela\} no Em Alta:`, error\)/);

  for (const termoProibido of [
    /from ["']react["']/i,
    /\buse[A-Z]\w*\b/,
    /\blocalStorage\b/i,
    /<[A-Z][\w.]*/,
    /\.insert\(/,
    /\.update\(/,
    /\.delete\(/,
    /\.upsert\(/,
  ]) {
    assert.doesNotMatch(modulo, termoProibido);
  }

  assert.match(
    colecoesRanking,
    /import \{ carregarIdsColecaoUsuarioSupabaseEmAlta \} from "\.\/em-alta-collection-supabase-loader";/,
  );
  assert.match(
    rankingLoaderFase891,
    /import \{ carregarColecoesRankingEmAlta \} from "\.\.\/lib\/em-alta-ranking-collections-loader";/,
  );
  assert.doesNotMatch(
    pagina,
    /async function carregarIdsColecaoUsuarioSupabaseEmAlta\b/,
  );
});
