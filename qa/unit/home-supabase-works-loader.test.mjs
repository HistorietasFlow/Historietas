import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-supabase-works-loader.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");

const estado = {
  capitulos: [],
  catalogo: { obraIds: ["obra-remota"] },
  catalogoErro: null,
  consultas: [],
  metricas: { carregado: false, capitulos: [], obras: new Map() },
  obras: [],
  obrasErro: null,
  perfis: new Map(),
};
globalThis.__homeSupabaseWorksLoaderState = estado;

const moduloExecutavel = modulo
  .replace(
    'import { listarSelecaoCatalogo, type ConsultaCatalogo } from "../../lib/catalogo";\n',
    `const listarSelecaoCatalogo = async (consultas) => {
  globalThis.__homeSupabaseWorksLoaderState.consultasCatalogo = consultas;
  if (globalThis.__homeSupabaseWorksLoaderState.catalogoErro) {
    throw globalThis.__homeSupabaseWorksLoaderState.catalogoErro;
  }
  return globalThis.__homeSupabaseWorksLoaderState.catalogo;
};
`,
  )
  .replace(
    'import { carregarMetricasConteudos } from "../../lib/metricas";\n',
    `const carregarMetricasConteudos = async (entrada) => {
  globalThis.__homeSupabaseWorksLoaderState.metricasEntrada = entrada;
  return globalThis.__homeSupabaseWorksLoaderState.metricas;
};
`,
  )
  .replace(
    'import { supabase } from "../../lib/supabase/client";\n',
    `const supabase = {
  from(tabela) {
    const consulta = { tabela, select: "", eq: [], executada: false, in: [], order: [], range: null };
    globalThis.__homeSupabaseWorksLoaderState.consultas.push(consulta);
    const builder = {
      select(campos) { consulta.select = campos; return builder; },
      eq(campo, valor) { consulta.eq.push([campo, valor]); return builder; },
      in(campo, valores) { consulta.in.push([campo, valores]); return builder; },
      order(campo, opcoes) { consulta.order.push([campo, opcoes]); return builder; },
      range(inicio, fim) { consulta.range = [inicio, fim]; return builder; },
      then(resolve, reject) {
        consulta.executada = true;
        const estado = globalThis.__homeSupabaseWorksLoaderState;
        const resultado = tabela === "obras"
          ? { data: estado.obras, error: estado.obrasErro }
          : { data: estado.capitulos, error: null };
        return Promise.resolve(resultado).then(resolve, reject);
      },
    };
    return builder;
  },
};
`,
  )
  .replace(
    'import { carregarTodasPaginasPorLotesSupabase } from "../../lib/supabase/paginacao.mjs";\n',
    `const carregarTodasPaginasPorLotesSupabase = async ({ itens, buscarPaginaLote }) =>
  (await buscarPaginaLote(itens, 0, 99)).data || [];
`,
  )
  .replace(
    'import { criarSlugBase } from "../../lib/utils";\n',
    'const criarSlugBase = (texto) => texto.toLowerCase().replace(/\\s+/g, "-");\n',
  )
  .replace(
    'import { carregarPerfisSupabaseHome } from "./home-author-profile-loader";\n',
    'const carregarPerfisSupabaseHome = async () => globalThis.__homeSupabaseWorksLoaderState.perfis;\n',
  )
  .replace(
    'import { obraTemConteudoPublicoHome } from "./home-local-work-utils";\n',
    'const obraTemConteudoPublicoHome = (obra) => obra.capitulos.length > 0 || Boolean(obra.arquivoObra);\n',
  )
  .replace(
    'import { aplicarProgressoLeituraHome } from "./home-reading-progress-utils";\n',
    'const aplicarProgressoLeituraHome = (obra) => obra;\n',
  )
  .replace(
    'import { normalizarObraSupabaseHome } from "./home-supabase-work-normalizers";\n',
    `const normalizarObraSupabaseHome = (obra, capitulos) => ({
  id: obra.id,
  titulo: obra.titulo || "Obra sem título",
  autor: obra.autor || "Autor não informado",
  genero: obra.genero || "Não informado",
  formato: obra.formato || "Não informado",
  classificacaoIndicativa: obra.classificacao_indicativa || "Não informada",
  sinopse: obra.sinopse || "",
  tags: obra.tags || [],
  capa: obra.capa_url || "",
  capaNome: obra.capa_nome || "",
  publicado: Boolean(obra.publicado),
  capitulos: capitulos.map((capitulo) => ({
    id: capitulo.id, titulo: capitulo.titulo || "", texto: "", curtiu: false,
    salvo: false, comentario: "", criadoEm: capitulo.criado_em || "", lido: false, lidoEm: "",
  })),
  criadaEm: obra.criada_em || "", ultimoCapituloLidoId: "", ultimaLeituraEm: "",
  progressoLeitura: 0, visualizacoes: 0, totalCurtidas: 0, totalComentarios: 0,
  slug: obra.slug || "", link: obra.link || "",
});
`,
  );

const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { carregarObrasSupabaseHome } = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function obra(overrides = {}) {
  return {
    id: "obra-remota",
    user_id: "autor-1",
    titulo: "Obra Remota",
    autor: "Autor Remoto",
    genero: "Fantasia",
    formato: "Webcomic",
    classificacao_indicativa: "Livre",
    sinopse: "Sinopse",
    tags: ["aventura"],
    capa_url: "",
    capa_nome: "",
    arquivo_url: null,
    arquivo_nome: null,
    arquivo_tipo: null,
    arquivo_tamanho: null,
    arquivo_categoria: null,
    publicado: true,
    visualizacoes: 0,
    slug: "obra-remota",
    link: "/obra/obra-remota",
    criada_em: "2026-01-01",
    atualizado_em: "2026-01-01",
    ...overrides,
  };
}

function preparar(overrides = {}) {
  Object.assign(estado, {
    capitulos: [{ id: "capitulo-1", obra_id: "obra-remota", titulo: "Capítulo 1", criado_em: "2026-01-01" }],
    catalogo: { obraIds: ["obra-remota"] },
    catalogoErro: null,
    consultas: [],
    consultasCatalogo: null,
    metricas: { carregado: false, capitulos: [], obras: new Map() },
    metricasEntrada: null,
    obras: [obra()],
    obrasErro: null,
    perfis: new Map(),
    ...overrides,
  });
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

test("home-supabase-works-loader retorna locais sem executar a query de obras quando o catálogo está vazio", async () => {
  preparar({ catalogo: { obraIds: [] } });
  const locais = [{ id: "local", titulo: "Local" }];

  const resultado = await carregarObrasSupabaseHome(locais);

  assert.equal(resultado, locais);
  assert.equal(estado.consultas.length, 1);
  assert.equal(estado.consultas[0].tabela, "obras");
  assert.equal(estado.consultas[0].executada, false);
});

test("home-supabase-works-loader preserva as consultas publicadas, capítulos paginados e métricas", async () => {
  preparar({
    metricas: {
      carregado: true,
      capitulos: [{ id: "capitulo-1", obraId: "obra-remota", usuario: { leu: true, lidoEm: "2026-02-01" } }],
      obras: new Map([["obra-remota", { audiencia: { curtidoresUnicos: 8, comentaristasUnicos: 5 } }]]),
    },
  });

  const resultado = await carregarObrasSupabaseHome([], " usuario ");

  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].totalCurtidas, 8);
  assert.equal(resultado[0].totalComentarios, 5);
  assert.deepEqual(estado.metricasEntrada, {
    obraIds: ["obra-remota"],
    capituloIds: ["capitulo-1"],
  });
  assert.deepEqual(estado.consultas, [
    {
      tabela: "obras",
      select: "id, user_id, titulo, autor, genero, formato, classificacao_indicativa, sinopse, tags, capa_url, capa_nome, arquivo_url, arquivo_nome, arquivo_tipo, arquivo_tamanho, arquivo_categoria, publicado, visualizacoes, slug, link, criada_em, atualizado_em",
      eq: [["publicado", true]],
      executada: true,
      in: [["id", ["obra-remota"]]],
      order: [],
      range: null,
    },
    {
      tabela: "capitulos",
      select: "id, obra_id, user_id, titulo, ordem, publicado, criado_em, atualizado_em",
      eq: [["publicado", true]],
      executada: true,
      in: [["obra_id", ["obra-remota"]]],
      order: [["obra_id", { ascending: true }], ["ordem", { ascending: true }], ["id", { ascending: true }]],
      range: [0, 99],
    },
  ]);
});

test("home-supabase-works-loader preserva fallback limitado e retorno local em falhas", async () => {
  preparar({ catalogoErro: new Error("catálogo indisponível") });

  const [resultado, warnings] = await comWarnings(() => carregarObrasSupabaseHome([]));

  assert.equal(resultado.length, 1);
  assert.equal(warnings[0][0], "O catálogo paginado da Home ainda não está disponível; usando uma amostra limitada:");
  assert.deepEqual(estado.consultas[0].order, [
    ["criada_em", { ascending: false }],
    ["id", { ascending: false }],
  ]);
  assert.deepEqual(estado.consultas[0].range, [0, 49]);
});

test("home-supabase-works-loader estabelece a fronteira do loader principal", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?carregarObrasSupabaseHome,[\s\S]*?CONSULTAS_INICIAIS_CATALOGO_HOME,[\s\S]*?\} from "\.\/lib\/home-supabase-works-loader";/,
  );
  assert.doesNotMatch(pagina, /async function carregarObrasSupabaseHome\(/);
  assert.match(modulo, /export const CONSULTAS_INICIAIS_CATALOGO_HOME = \[/);
  assert.match(modulo, /export async function carregarObrasSupabaseHome\(/);
  assert.match(modulo, /\.from\("obras"\)/);
  assert.match(modulo, /\.from\("capitulos"\)/);
  assert.match(modulo, /\.eq\("publicado", true\)/);
  assert.match(modulo, /carregarTodasPaginasPorLotesSupabase/);
  assert.match(modulo, /carregarMetricasConteudos/);
  assert.match(modulo, /carregarPerfisSupabaseHome/);
  assert.doesNotMatch(modulo, /\.insert\(|\.update\(|\.delete\(|\.rpc\(/);
});
