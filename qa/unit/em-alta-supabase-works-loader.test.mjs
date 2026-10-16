import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-supabase-works-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const dadosRanking = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-ranking-data-utils.ts",
    import.meta.url,
  ),
  "utf8",
);

const estado = {
  catalogo: { obraIds: [] },
  chamadas: [],
  respostas: { obras: [], capitulos: [] },
  paginaErro: null,
  metricas: {
    carregado: false,
    obras: [],
    autores: [],
    capitulos: [],
  },
  conversoes: [],
  resultadosConversao: [],
};
globalThis.__emAltaWorksLoaderState = estado;

const executavel = modulo
  .replace(
    'import { listarSelecaoCatalogo } from "../../../lib/catalogo";\n',
    `const listarSelecaoCatalogo = async (consultas) => {
  globalThis.__emAltaWorksLoaderState.consultasCatalogo = consultas;
  const catalogo = globalThis.__emAltaWorksLoaderState.catalogo;
  if (catalogo instanceof Error) throw catalogo;
  return catalogo;
};\n`,
  )
  .replace(
    'import { carregarMetricasConteudos } from "../../../lib/metricas";\n',
    `const carregarMetricasConteudos = async (argumentos) => {
  globalThis.__emAltaWorksLoaderState.metricasArgumentos = argumentos;
  return globalThis.__emAltaWorksLoaderState.metricas;
};\n`,
  )
  .replace(
    'import { supabase } from "../../../lib/supabase/client";\n',
    `const supabase = {
  from(tabela) {
    const chamada = { tabela, operacoes: [] };
    globalThis.__emAltaWorksLoaderState.chamadas.push(chamada);
    const consulta = {
      select(valor) { chamada.operacoes.push(["select", valor]); return this; },
      eq(campo, valor) { chamada.operacoes.push(["eq", campo, valor]); return this; },
      in(campo, valores) { chamada.operacoes.push(["in", campo, valores]); return this; },
      order(campo, opcoes) { chamada.operacoes.push(["order", campo, opcoes]); return this; },
      range(inicio, fim) { chamada.operacoes.push(["range", inicio, fim]); return this; },
      then(resolve, reject) {
        const resposta = globalThis.__emAltaWorksLoaderState.respostas[tabela].shift() || { data: [], error: null };
        return Promise.resolve(resposta).then(resolve, reject);
      },
    };
    return consulta;
  },
};\n`,
  )
  .replace(
    /import \{\r?\n  carregarTodasPaginasPorLotesSupabase,\r?\n\} from "\.\.\/\.\.\/\.\.\/lib\/supabase\/paginacao\.mjs";\r?\n/,
    `const carregarTodasPaginasPorLotesSupabase = async (opcoes) => {
  globalThis.__emAltaWorksLoaderState.opcoesPaginacao = opcoes;
  if (globalThis.__emAltaWorksLoaderState.paginaErro) throw globalThis.__emAltaWorksLoaderState.paginaErro;
  return opcoes.buscarPaginaLote(["obra-1"], 0, 49).then((resposta) => resposta.data || []);
};\n`,
  )
  .replace(
    'import { criarSlugBase } from "../../../lib/utils";\n',
    'const criarSlugBase = (valor) => valor.toLowerCase().replace(/\\s+/g, "-");\n',
  )
  .replace(
    'import { carregarProfilesAutoresRanking } from "./em-alta-author-profile-loader";\n',
    `const carregarProfilesAutoresRanking = async (ids) => {
  globalThis.__emAltaWorksLoaderState.profileIds = ids;
  return new Map();
};\n`,
  )
  .replace(
    'import { carregarAvataresAutoresLocaisEmAlta } from "./em-alta-local-storage-utils";\n',
    `const carregarAvataresAutoresLocaisEmAlta = (ids) => {
  globalThis.__emAltaWorksLoaderState.avatarIds = ids;
  return new Map();
};\n`,
  )
  .replace(
    /import type \{[\s\S]*?\} from "\.\/em-alta-models";\r?\n/,
    "",
  )
  .replace(
    'import { converterObraSupabaseParaLocal } from "./em-alta-supabase-work-normalizer";\n',
    `const converterObraSupabaseParaLocal = (...argumentos) => {
  const estado = globalThis.__emAltaWorksLoaderState;
  estado.conversoes.push(argumentos);
  return estado.resultadosConversao.shift() || {
    id: argumentos[0].id,
    capitulos: argumentos[1],
    arquivoObra: null,
  };
};\n`,
  );
const javascriptModulo = typescript.transpileModule(executavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { carregarObrasSupabasePublicadas } = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function resetarEstado() {
  estado.catalogo = { obraIds: [] };
  estado.chamadas.length = 0;
  estado.respostas = { obras: [], capitulos: [] };
  estado.paginaErro = null;
  estado.metricas = { carregado: false, obras: [], autores: [], capitulos: [] };
  estado.conversoes.length = 0;
  estado.resultadosConversao.length = 0;
  delete estado.consultasCatalogo;
  delete estado.opcoesPaginacao;
  delete estado.metricasArgumentos;
  delete estado.profileIds;
  delete estado.avatarIds;
}

function obra(overrides = {}) {
  return {
    id: "obra-1",
    user_id: "autor-1",
    titulo: "Obra Um",
    slug: "obra-um",
    ...overrides,
  };
}

test("catálogo preserva os sete critérios e retorna cedo quando vazio", async () => {
  resetarEstado();

  const resultado = await carregarObrasSupabasePublicadas([]);

  assert.deepEqual(resultado, []);
  assert.deepEqual(estado.consultasCatalogo, [
    { ordenacao: "geral", limite: 50 },
    { ordenacao: "lidas", limite: 5 },
    { ordenacao: "curtidas", limite: 5 },
    { ordenacao: "comentadas", limite: 5 },
    { ordenacao: "salvas", limite: 5 },
    { ordenacao: "recentes", limite: 5 },
    { ordenacao: "capitulos", limite: 5 },
  ]);
  assert.equal(estado.chamadas.length, 1);
  assert.equal(estado.chamadas[0].tabela, "obras");
});

test("consulta obras, capítulos, métricas, profiles e conversor na ordem preservada", async () => {
  resetarEstado();
  estado.catalogo = { obraIds: ["obra-1"] };
  estado.respostas.obras.push({ data: [obra()], error: null });
  estado.respostas.capitulos.push({
    data: [{ id: "cap-1", obra_id: "obra-1", titulo: "Capítulo", publicado: true }],
    error: null,
  });
  estado.metricas = {
    carregado: true,
    obras: [{
      id: "obra-1",
      interacoesDiretas: { curtidas: 2, comentarios: 3, bibliotecasUnicas: 4, seguidores: 5 },
      avaliacao: { total: 6, media: 4.5 },
    }],
    autores: [{ id: "autor-1", seguidores: 7 }],
    capitulos: [{ id: "cap-1", obraId: "obra-1", usuario: { leu: true, lidoEm: "2026-01-01" } }],
  };

  const resultado = await carregarObrasSupabasePublicadas(
    [{ id: "local-id", slug: "obra-um" }],
    " usuario-1 ",
  );

  assert.equal(resultado.length, 1);
  assert.deepEqual(estado.chamadas[0], {
    tabela: "obras",
    operacoes: [
      ["select", "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,visualizacoes,publicado,slug,link,criada_em,atualizado_em"],
      ["eq", "publicado", true],
      ["in", "id", ["obra-1"]],
    ],
  });
  assert.equal(estado.opcoesPaginacao.nomeColecao, "capítulos publicados do ranking");
  assert.deepEqual(estado.chamadas[1].operacoes, [
    ["select", "id,obra_id,user_id,titulo,ordem,publicado,criado_em,atualizado_em"],
    ["in", "obra_id", ["obra-1"]],
    ["eq", "publicado", true],
    ["order", "obra_id", { ascending: true }],
    ["order", "ordem", { ascending: true }],
    ["order", "id", { ascending: true }],
    ["range", 0, 49],
  ]);
  assert.deepEqual(estado.metricasArgumentos, {
    obraIds: ["obra-1"],
    capituloIds: ["cap-1"],
    autorIds: ["autor-1"],
  });
  assert.deepEqual(estado.profileIds, ["autor-1"]);
  assert.deepEqual(estado.avatarIds, ["autor-1"]);
  assert.equal(estado.conversoes.length, 1);
  assert.equal(estado.conversoes[0][2].id, "local-id");
  assert.equal(estado.conversoes[0][4]["obra-1"], 2);
  assert.equal(estado.conversoes[0][5]["obra-1"], 3);
  assert.equal(estado.conversoes[0][6]["obra-1"], 4);
  assert.equal(estado.conversoes[0][7]["obra-1"], 5);
  assert.deepEqual(estado.conversoes[0][8]["obra-1"], { total: 6, media: 4.5 });
  assert.equal(estado.conversoes[0][10]["autor-1"], 7);
  assert.equal(estado.conversoes[0][12].get("obra-1::cap-1").lido, true);
  assert.equal(estado.conversoes[0][13], true);
});

test("fallback do catálogo, falha de capítulos e filtro final preservam o loader", async () => {
  resetarEstado();
  estado.catalogo = new Error("catálogo indisponível");
  estado.respostas.obras.push({
    data: [obra(), obra({ id: "obra-2" }), obra({ id: "obra-3" })],
    error: null,
  });
  estado.paginaErro = new Error("capítulos indisponíveis");
  estado.resultadosConversao.push(
    { id: "com-capitulo", capitulos: [{}], arquivoObra: null },
    { id: "com-arquivo", capitulos: [], arquivoObra: {} },
    { id: "sem-conteudo", capitulos: [], arquivoObra: null },
  );
  const avisoOriginal = console.warn;
  const avisos = [];
  console.warn = (...argumentos) => avisos.push(argumentos);

  try {
    const resultado = await carregarObrasSupabasePublicadas([]);
    assert.deepEqual(resultado.map((item) => item.id), ["com-capitulo", "com-arquivo"]);
  } finally {
    console.warn = avisoOriginal;
  }

  assert.deepEqual(estado.chamadas[0].operacoes.slice(-3), [
    ["order", "criada_em", { ascending: false }],
    ["order", "id", { ascending: false }],
    ["range", 0, 49],
  ]);
  assert.equal(avisos[0][0], "O ranking paginado ainda não está disponível; usando uma amostra limitada:");
  assert.equal(avisos[1][0], "Não consegui carregar capítulos publicados do ranking:");
});

test("erro da consulta de obras preserva catch global e retorno vazio", async () => {
  resetarEstado();
  estado.catalogo = { obraIds: ["obra-1"] };
  estado.respostas.obras.push({ data: null, error: { message: "falha obras" } });
  const avisoOriginal = console.warn;
  const avisos = [];
  console.warn = (...argumentos) => avisos.push(argumentos);

  try {
    assert.deepEqual(await carregarObrasSupabasePublicadas([]), []);
  } finally {
    console.warn = avisoOriginal;
  }

  assert.equal(avisos[0][0], "Não consegui acessar o Supabase no Em Alta agora:");
});

test("fronteira preserva queries de leitura e responsabilidades da página", () => {
  assert.match(modulo, /export async function carregarObrasSupabasePublicadas\b/);
  assert.match(modulo, /from\("obras"\)[\s\S]*?select\([\s\S]*?id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,visualizacoes,publicado,slug,link,criada_em,atualizado_em[\s\S]*?eq\("publicado", true\)/);
  assert.match(modulo, /from\("capitulos"\)[\s\S]*?select\([\s\S]*?id,obra_id,user_id,titulo,ordem,publicado,criado_em,atualizado_em[\s\S]*?in\("obra_id", obraIdsLote\)[\s\S]*?eq\("publicado", true\)[\s\S]*?order\("obra_id", \{ ascending: true \}\)[\s\S]*?order\("ordem", \{ ascending: true \}\)[\s\S]*?order\("id", \{ ascending: true \}\)[\s\S]*?range\(inicio, fim\)/);
  assert.match(modulo, /Promise\.all\(\[[\s\S]*?carregarMetricasConteudos\([\s\S]*?carregarProfilesAutoresRanking\(autorIds\)/);
  assert.match(modulo, /\.filter\(\(obra\) => obra\.capitulos\.length > 0 \|\| Boolean\(obra\.arquivoObra\)\)/);
  for (const proibido of [
    /from ["']react["']/i,
    /\buse[A-Z]\w*\b/,
    /(?:^|[=({;]\s*)<[A-Z][\w.]*(?:\s|\/?>)/m,
    /\.insert\(/,
    /\.update\(/,
    /\.delete\(/,
    /\.upsert\(/,
  ]) {
    assert.doesNotMatch(modulo, proibido);
  }
  assert.match(
    pagina,
    /import \{ carregarObrasSupabasePublicadas \} from "\.\/lib\/em-alta-supabase-works-loader";/,
  );
  assert.doesNotMatch(pagina, /async function carregarObrasSupabasePublicadas\b/);
  assert.match(dadosRanking, /export function encontrarCapituloParaContinuar\b/);
  assert.match(pagina, /\bencontrarCapituloParaContinuar\b/);
  assert.doesNotMatch(pagina, /function encontrarCapituloParaContinuar\b/);
  assert.match(pagina, /async function carregarRanking\b/);
});
