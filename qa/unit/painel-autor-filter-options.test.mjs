import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const optionsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-filter-options.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const filterStateHook = readFileSync(
  new URL(
    "../../app/painel-autor/hooks/use-painel-autor-filter-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const workFilteringSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-work-filtering.ts",
    import.meta.url,
  ),
  "utf8",
);
const optionsJavascript = typescript.transpileModule(optionsSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { FILTROS_PAINEL, ORDENACOES_PAINEL } = await import(
  `data:text/javascript;base64,${Buffer.from(optionsJavascript).toString("base64")}`,
);

globalThis.__painelAutorNormalizarTexto = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
globalThis.__painelAutorColecaoTemObra = (colecao, obra) =>
  colecao.includes(obra.id) || colecao.includes(obra.slug);
globalThis.__painelAutorFormatarGenero = (genero) => {
  const generoNormalizado = globalThis.__painelAutorNormalizarTexto(genero);
  if (generoNormalizado === "fantasia sombria") return "Fantasia";
  if (generoNormalizado === "sci-fi" || generoNormalizado === "sci fi") return "Ficção";
  return genero.trim() || "Não informado";
};
globalThis.__painelAutorObterTimestamp = (data) => {
  const timestamp = new Date(data).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};
globalThis.__painelAutorObraPublicada = (obra) =>
  obra.publicado &&
  (obra.capitulos.some((capitulo) => capitulo.publicado !== false) || Boolean(obra.arquivoObra));
globalThis.__painelAutorObraRascunho = (obra) => !globalThis.__painelAutorObraPublicada(obra);

const workFilteringJavascript = typescript.transpileModule(
  workFilteringSource
    .replace(
      'import { normalizarTexto } from "../../../lib/utils";',
      "const normalizarTexto = globalThis.__painelAutorNormalizarTexto;",
    )
    .replace(
      'import { colecaoTemObraPainel } from "./painel-autor-collection-utils";',
      "const colecaoTemObraPainel = globalThis.__painelAutorColecaoTemObra;",
    )
    .replace(
      /import \{[\s\S]*?\} from "\.\/painel-autor-format-utils";/,
      [
        "const formatarGeneroPainelAutor = globalThis.__painelAutorFormatarGenero;",
        "const obterTimestamp = globalThis.__painelAutorObterTimestamp;",
      ].join("\n"),
    )
    .replace(
      /import \{[\s\S]*?\} from "\.\/painel-autor-work-status-utils";/,
      [
        "const obraPublicadaComConteudoPainel = globalThis.__painelAutorObraPublicada;",
        "const obraRascunhoOuSemConteudoPainel = globalThis.__painelAutorObraRascunho;",
      ].join("\n"),
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { obterObrasFiltradasPainel } = await import(
  `data:text/javascript;base64,${Buffer.from(workFilteringJavascript).toString("base64")}`,
);

const obrasParaFiltrar = [
  {
    id: "publicada",
    slug: "aventura-sci-fi",
    titulo: "Aventura Cósmica",
    autor: "Ana Autora",
    genero: "Sci-Fi",
    formato: "Romance",
    classificacaoIndicativa: "12 anos",
    sinopse: "Uma jornada entre estrelas.",
    tags: ["espaco", "viagem"],
    capaNome: "capa-cosmica.png",
    arquivoObra: { nome: "aventura.pdf" },
    publicado: true,
    capitulos: [{ titulo: "O início", publicado: true }],
    criadaEm: "2026-03-01T00:00:00.000Z",
    progressoLeitura: 50,
    pontuacao: 20,
  },
  {
    id: "rascunho",
    slug: "rascunho-local",
    titulo: "Rascunho Local",
    autor: "Bia",
    genero: "Drama",
    formato: "Conto",
    classificacaoIndicativa: "Livre",
    sinopse: "Ainda em edição.",
    tags: [],
    capaNome: "",
    publicado: false,
    capitulos: [],
    criadaEm: "2026-02-01T00:00:00.000Z",
    progressoLeitura: 0,
    pontuacao: 30,
  },
  {
    id: "concluida",
    slug: "obra-concluida",
    titulo: "Obra Concluída",
    autor: "Caio",
    genero: "Fantasia sombria",
    formato: "Novela",
    classificacaoIndicativa: "16 anos",
    sinopse: "Fim da aventura.",
    tags: ["final"],
    capaNome: "final.jpg",
    publicado: true,
    capitulos: [{ titulo: "Encerramento", publicado: true }],
    criadaEm: "2026-01-01T00:00:00.000Z",
    progressoLeitura: 100,
    pontuacao: 10,
  },
];

function filtrarObras(opcoes = {}) {
  return obterObrasFiltradasPainel({
    obrasComMetricas: obrasParaFiltrar,
    busca: "",
    filtro: "todas",
    ordenacao: "pontuacao",
    obrasFavoritas: [],
    obrasConcluidas: [],
    ...opcoes,
  });
}

test("opções de filtro preservam valores, rótulos e ordem", () => {
  assert.deepEqual(FILTROS_PAINEL, [
    { valor: "todas", rotulo: "Todas as obras" },
    { valor: "publicadas", rotulo: "Publicadas" },
    { valor: "rascunhos", rotulo: "Rascunhos" },
    { valor: "sem-capitulos", rotulo: "Sem capítulos" },
    { valor: "favoritas", rotulo: "Na lista" },
    { valor: "concluidas", rotulo: "Concluídas" },
    { valor: "em-leitura", rotulo: "Em leitura" },
  ]);
});

test("opções de ordenação preservam valores, rótulos e ordem", () => {
  assert.deepEqual(ORDENACOES_PAINEL, [
    { valor: "pontuacao", rotulo: "Melhor desempenho" },
    { valor: "recentes", rotulo: "Mais recentes" },
    { valor: "titulo", rotulo: "Título" },
    { valor: "capitulos", rotulo: "Mais capítulos" },
    { valor: "progresso", rotulo: "Maior progresso" },
  ]);
});

test("filtragem preserva busca normalizada em todos os campos da obra", () => {
  for (const termoBusca of [
    "aventura cosmica",
    "ana autora",
    "sci-fi",
    "ficcao",
    "romance",
    "12 anos",
    "jornada entre estrelas",
    "espaco viagem",
    "capa-cosmica",
    "aventura.pdf",
    "o inicio",
  ]) {
    assert.deepEqual(
      filtrarObras({ busca: termoBusca }).map((obra) => obra.id),
      ["publicada"],
    );
  }
});

test("filtragem preserva coleções, status e leitura em andamento", () => {
  assert.deepEqual(
    filtrarObras({ filtro: "publicadas" }).map((obra) => obra.id),
    ["publicada", "concluida"],
  );
  assert.deepEqual(
    filtrarObras({ filtro: "rascunhos" }).map((obra) => obra.id),
    ["rascunho"],
  );
  assert.deepEqual(
    filtrarObras({ filtro: "sem-capitulos" }).map((obra) => obra.id),
    ["rascunho"],
  );
  assert.deepEqual(
    filtrarObras({ filtro: "favoritas", obrasFavoritas: ["publicada"] }).map(
      (obra) => obra.id,
    ),
    ["publicada"],
  );
  assert.deepEqual(
    filtrarObras({ filtro: "concluidas", obrasConcluidas: ["concluida"] }).map(
      (obra) => obra.id,
    ),
    ["concluida"],
  );
  assert.deepEqual(
    filtrarObras({ filtro: "em-leitura" }).map((obra) => obra.id),
    ["publicada"],
  );
});

test("filtragem preserva todas as ordenações", () => {
  assert.deepEqual(
    filtrarObras({ ordenacao: "pontuacao" }).map((obra) => obra.id),
    ["rascunho", "publicada", "concluida"],
  );
  assert.deepEqual(
    filtrarObras({ ordenacao: "recentes" }).map((obra) => obra.id),
    ["publicada", "rascunho", "concluida"],
  );
  assert.deepEqual(
    filtrarObras({ ordenacao: "titulo" }).map((obra) => obra.id),
    ["publicada", "concluida", "rascunho"],
  );
  assert.deepEqual(
    filtrarObras({ ordenacao: "capitulos" }).map((obra) => obra.id),
    ["publicada", "concluida", "rascunho"],
  );
  assert.deepEqual(
    filtrarObras({ ordenacao: "progresso" }).map((obra) => obra.id),
    ["concluida", "publicada", "rascunho"],
  );
});

test("Painel do Autor delega somente tipos e opções de filtro e ordenação", () => {
  assert.match(
    optionsSource,
    /export type FiltroPainel =\s*\| "todas"[\s\S]*?\| "em-leitura";/,
  );
  assert.match(
    optionsSource,
    /export type OrdenacaoPainel =\s*\| "pontuacao"[\s\S]*?\| "progresso";/,
  );
  assert.match(
    pagina,
    /import \{[\s\S]*?FILTROS_PAINEL,[\s\S]*?ORDENACOES_PAINEL,[\s\S]*?\} from "\.\/lib\/painel-autor-filter-options";/,
  );
  assert.doesNotMatch(pagina, /type FiltroPainel =/);
  assert.doesNotMatch(pagina, /type OrdenacaoPainel =/);
  assert.doesNotMatch(pagina, /const FILTROS_PAINEL:/);
  assert.doesNotMatch(pagina, /const ORDENACOES_PAINEL:/);
  assert.equal((pagina.match(/\bFILTROS_PAINEL\b/g) || []).length, 2);
  assert.equal((pagina.match(/\bORDENACOES_PAINEL\b/g) || []).length, 2);
  assert.match(
    pagina,
    /import \{ usePainelAutorFilterState \} from "\.\/hooks\/use-painel-autor-filter-state";/,
  );
  assert.match(pagina, /\} = usePainelAutorFilterState\(\);/);
  assert.doesNotMatch(pagina, /const \[filtro, setFiltro\] = useState<FiltroPainel>/);
  assert.doesNotMatch(
    pagina,
    /const \[ordenacao, setOrdenacao\] = useState<OrdenacaoPainel>/,
  );
  assert.match(filterStateHook, /^"use client";/);
  assert.match(filterStateHook, /const \[busca, setBusca\] = useState\(""\);/);
  assert.match(
    filterStateHook,
    /const \[buscaPainelAberta, setBuscaPainelAberta\] = useState\(false\);/,
  );
  assert.match(
    filterStateHook,
    /import type \{[\s\S]*?FiltroPainel,[\s\S]*?OrdenacaoPainel,[\s\S]*?\} from "\.\.\/lib\/painel-autor-filter-options";/,
  );
  assert.match(filterStateHook, /const \[filtro, setFiltro\] = useState<FiltroPainel>\("todas"\);/);
  assert.match(
    filterStateHook,
    /const \[ordenacao, setOrdenacao\] = useState<OrdenacaoPainel>\("pontuacao"\);/,
  );
  assert.match(
    filterStateHook,
    /const filtrosAtivos =\s*Boolean\(busca\.trim\(\)\) \|\| filtro !== "todas" \|\| ordenacao !== "pontuacao";/,
  );
  assert.match(
    filterStateHook,
    /function limparFiltros\(\) \{\s*setBusca\(""\);\s*setFiltro\("todas"\);\s*setOrdenacao\("pontuacao"\);\s*\}/,
  );
  assert.match(
    pagina,
    /import \{[\s\S]*?criarHrefLeituraCapituloPainel[\s\S]*?\} from "\.\/lib\/painel-autor-route-utils";/,
  );
  assert.match(
    readFileSync(new URL("../../app/painel-autor/hooks/use-painel-autor-auth-session.ts", import.meta.url), "utf8"),
    /supabase\.auth\.getUser\(\)/,
  );
  assert.doesNotMatch(optionsSource, /supabase|useState|useEffect|localStorage/);
  assert.doesNotMatch(filterStateHook, /supabase|useEffect|localStorage|window|document/);
});

test("Painel do Autor delega somente a filtragem pura de obras", () => {
  assert.match(
    pagina,
    /import \{ obterObrasFiltradasPainel \} from "\.\/lib\/painel-autor-work-filtering";/,
  );
  assert.doesNotMatch(pagina, /function obterObrasFiltradasPainel\(/);
  assert.match(
    pagina,
    /const obrasFiltradas = useMemo<ObraComMetricas\[]>\([\s\S]*?obterObrasFiltradasPainel\(\{[\s\S]*?obrasComMetricas,[\s\S]*?busca,[\s\S]*?filtro,[\s\S]*?ordenacao,[\s\S]*?obrasFavoritas,[\s\S]*?obrasConcluidas,[\s\S]*?\}\),[\s\S]*?\[\s*obrasComMetricas,[\s\S]*?busca,[\s\S]*?filtro,[\s\S]*?ordenacao,[\s\S]*?obrasFavoritas,[\s\S]*?obrasConcluidas,[\s\S]*?\]/,
  );
  assert.match(workFilteringSource, /export function obterObrasFiltradasPainel/);
  assert.match(workFilteringSource, /normalizarTexto\(busca\)/);
  assert.match(workFilteringSource, /obraPublicadaComConteudoPainel\(obra\)/);
  assert.match(workFilteringSource, /obraRascunhoOuSemConteudoPainel\(obra\)/);
  assert.match(workFilteringSource, /colecaoTemObraPainel\(obrasFavoritas, obra\)/);
  assert.match(workFilteringSource, /colecaoTemObraPainel\(obrasConcluidas, obra\)/);
  assert.doesNotMatch(
    workFilteringSource,
    /localStorage|supabase|useState|useEffect|window|document/,
  );
});
