import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const page = readFileSync(new URL("../../app/listas/page.tsx", import.meta.url), "utf8");
const pageDataHook = readFileSync(
  new URL("../../app/listas/hooks/use-listas-page-data-loader.ts", import.meta.url),
  "utf8",
);
const actionSheetRenderer = readFileSync(
  new URL(
    "../../app/listas/hooks/use-listas-work-action-sheet-renderer.tsx",
    import.meta.url,
  ),
  "utf8",
);
const profileItems = readFileSync(
  new URL("../../app/listas/lib/listas-profile-items-utils.ts", import.meta.url),
  "utf8",
);
const publicCatalog = readFileSync(
  new URL("../../app/listas/lib/listas-public-catalog-utils.ts", import.meta.url),
  "utf8",
);
const profileText = readFileSync(
  new URL("../../app/listas/lib/listas-profile-text-utils.ts", import.meta.url),
  "utf8",
);
const profileState = readFileSync(
  new URL("../../app/listas/lib/listas-profile-state-utils.ts", import.meta.url),
  "utf8",
);
const filterSort = readFileSync(
  new URL("../../app/listas/lib/listas-filter-sort-utils.ts", import.meta.url),
  "utf8",
);
const presentation = readFileSync(
  new URL("../../app/listas/lib/listas-presentation-utils.ts", import.meta.url),
  "utf8",
);

async function importarModulo(codigo) {
  const javascript = typescript.transpileModule(codigo, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);
}

const timestampData = (valor) => Date.parse(valor) || 0;
const normalizarTexto = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const dataRegistro = (registro) =>
  String(
    registro.atualizado_em ??
      registro.updated_at ??
      registro.criado_em ??
      registro.created_at ??
      "",
  ).trim();
const obterIdentificadoresObraListas = (obra) =>
  [obra.id, obra.slug, obra.titulo].filter(Boolean);
const formatarDataCurta = (valor) =>
  valor === "2024-05-15" ? "15 mai. 2024" : "Data não informada";

const itens = await importarModulo(
  profileItems
    .replace('import { dataRegistro } from "./listas-diary-annotation-utils";', `const dataRegistro = ${dataRegistro.toString()};`)
    .replace('import { timestampData } from "./listas-format-utils";', `const timestampData = ${timestampData.toString()};`)
    .replace('import { obterIdentificadoresObraListas } from "./listas-local-work-utils";', `const obterIdentificadoresObraListas = ${obterIdentificadoresObraListas.toString()};`),
);
const catalogo = await importarModulo(
  publicCatalog
    .replace('import { normalizarTexto } from "../../../lib/utils";', `const normalizarTexto = ${normalizarTexto.toString()};`)
    .replace('import { timestampData } from "./listas-format-utils";', `const timestampData = ${timestampData.toString()};`),
);
const textos = await importarModulo(
  profileText.replace(
    'import { formatarDataCurta } from "./listas-format-utils";',
    `const formatarDataCurta = ${formatarDataCurta.toString()};`,
  ),
);

function criarObra(id, extras = {}) {
  return {
    id,
    slug: id,
    titulo: `Obra ${id}`,
    link: `/obra/${id}`,
    publicadaEm: "2024-01-01",
    genero: "Fantasia",
    visualizacoes: 0,
    totalCurtidas: 0,
    totalComentarios: 0,
    capitulos: [],
    notaMedia: 0,
    ...extras,
  };
}

function criarItem(categoria, obra, extras = {}) {
  return {
    chave: `${categoria}-${obra.id}`,
    obra,
    categorias: [categoria],
    data: "2024-01-01",
    nota: 0,
    progresso: 0,
    capituloAtual: "",
    capituloAtualId: "",
    capitulosLidosIds: [],
    ...extras,
  };
}

test("Listas delega itens, catálogo e textos puros sem mover Supabase", () => {
  for (const [source, helper] of [
    [actionSheetRenderer, "obterHrefContinuarLeituraListas"],
    [pageDataHook, "ordenarObrasDaSecao"],
    [pageDataHook, "ordenarRecomendacoes"],
    [actionSheetRenderer, "textoSecundarioItem"],
  ]) {
    assert.match(source, new RegExp(`import[\\s\\S]*?\\b${helper}\\b`));
    assert.doesNotMatch(page, new RegExp(`function ${helper}\\(`));
  }

  for (const [source, helper] of [
    [publicCatalog, "dataUltimoCapitulo"],
    [publicCatalog, "pontuacaoPopularidadeObra"],
    [profileText, "tituloSecaoPublica"],
    [profileText, "textoCategorias"],
  ]) {
    assert.match(source, new RegExp(`export function ${helper}\\(`));
  }

  assert.match(filterSort, /import \{ textoCategorias \} from "\.\/listas-profile-text-utils";/);
  assert.match(filterSort, /\bdataUltimoCapitulo\(/);
  assert.match(filterSort, /\bpontuacaoPopularidadeObra\(/);
  assert.match(presentation, /import \{ tituloSecaoPublica \} from "\.\/listas-profile-text-utils";/);
  assert.match(presentation, /\btituloSecaoPublica\(/);

  for (const helper of [
    "criarItemPerfil",
    "ordenarPorData",
    "mesclarTudoPerfil",
    "criarMapaObrasPorIdentificadorListas",
    "encontrarObraColecaoLocalListas",
    "mesclarItensLocaisCategoriaPerfil",
  ]) {
    assert.match(profileState, new RegExp(`import[\\s\\S]*?\\b${helper}\\b`));
  }

  for (const [source, helper] of [
    [profileItems, "normalizarIdentificadorColecaoListas"],
    [profileText, "rotuloCategoria"],
  ]) {
    assert.match(source, new RegExp(`export function ${helper}\\(`));
  }

  for (const source of [profileItems, publicCatalog, profileText, profileState, filterSort, presentation]) {
    assert.doesNotMatch(source, /supabase|\.rpc\(/);
  }
});

test("itens do perfil preservam capítulo seguinte, fallbacks, data e merge", () => {
  const obra = criarObra("obra-1", {
    capitulos: [
      { id: "c1", ordem: 1 },
      { id: "c2", ordem: 2 },
      { id: "c3", ordem: 3 },
    ],
  });
  assert.equal(
    itens.obterHrefContinuarLeituraListas(
      criarItem("lendo", obra, {
        capituloAtualId: "c1",
        capitulosLidosIds: ["c1"],
      }),
    ),
    "/obra/obra-1/capitulo/2",
  );
  assert.equal(
    itens.obterHrefContinuarLeituraListas(criarItem("lendo", criarObra("sem-capitulos"))),
    "/obra/sem-capitulos",
  );

  const antigo = criarItem("favoritas", obra, {
    data: "2024-01-01",
    nota: 3,
    progresso: 25,
    capitulosLidosIds: ["c1"],
  });
  const recente = criarItem("lendo", obra, {
    data: "2024-02-01",
    nota: 5,
    progresso: 50,
    capituloAtual: "Capítulo 2",
    capituloAtualId: "c2",
    capitulosLidosIds: ["c2"],
    ultimaLeituraEm: "2024-02-01",
  });
  const tudo = itens.mesclarTudoPerfil([[antigo], [recente]]);
  assert.equal(tudo.length, 1);
  assert.deepEqual(tudo[0].categorias, ["favoritas", "lendo"]);
  assert.equal(tudo[0].nota, 5);
  assert.equal(tudo[0].progresso, 50);
  assert.deepEqual(tudo[0].capitulosLidosIds, ["c1", "c2"]);
  assert.equal(tudo[0].ultimaLeituraEm, "2024-02-01");
  assert.deepEqual(
    itens.ordenarPorData([antigo, recente]).map((item) => item.data),
    ["2024-02-01", "2024-01-01"],
  );
});

test("coleções locais preservam prioridade, deduplicação e exclusão de concluídas", () => {
  const primeira = criarObra("obra-1", { slug: "compartilhado", titulo: "Primeira" });
  const segunda = criarObra("obra-2", { slug: "compartilhado", titulo: "Segunda" });
  const mapa = itens.criarMapaObrasPorIdentificadorListas([primeira, segunda]);
  assert.equal(itens.normalizarIdentificadorColecaoListas(" ObRa-1 "), "obra-1");
  assert.equal(itens.encontrarObraColecaoLocalListas("compartilhado", mapa), primeira);

  const remoto = criarItem("favoritas", primeira);
  const mesclados = itens.mesclarItensLocaisCategoriaPerfil(
    "favoritas",
    [remoto],
    ["obra-1", "obra-2", "obra-2"],
    mapa,
    new Set(["obra-2"]),
  );
  assert.deepEqual(mesclados.map((item) => item.obra.id), ["obra-1"]);
});

test("catálogo público preserva seções, popularidade e recomendações", () => {
  const obras = [
    criarObra("nova", {
      publicadaEm: "2024-01-01",
      capitulos: [{ criadoEm: "2024-03-01" }],
      totalCurtidas: 2,
      totalComentarios: 1,
      visualizacoes: 10,
    }),
    criarObra("curtida", {
      publicadaEm: "2024-02-01",
      totalCurtidas: 10,
      totalComentarios: 2,
      visualizacoes: 20,
      capitulos: [{ criadoEm: "2024-02-01" }, { criadoEm: "2024-02-02" }],
      notaMedia: 4,
    }),
    criarObra("comentada", {
      publicadaEm: "2024-03-01",
      totalCurtidas: 1,
      totalComentarios: 12,
      capitulos: [{ criadoEm: "2024-03-01" }],
      genero: "Drama",
      notaMedia: 5,
    }),
    criarObra("curta", {
      publicadaEm: "2024-04-01",
      capitulos: [{ criadoEm: "2024-04-01" }],
      genero: "Fantasia",
      notaMedia: 3,
    }),
  ];

  assert.equal(catalogo.dataUltimoCapitulo(obras[0]), Date.parse("2024-03-01"));
  assert.equal(catalogo.pontuacaoPopularidadeObra(obras[1]), 20 + 80 + 10 + 4);
  assert.equal(catalogo.ordenarObrasDaSecao(obras, "novos-capitulos")[0].id, "curta");
  assert.equal(catalogo.ordenarObrasDaSecao(obras, "mais-curtidas")[0].id, "curtida");
  assert.equal(catalogo.ordenarObrasDaSecao(obras, "mais-comentadas")[0].id, "comentada");
  assert.equal(catalogo.ordenarObrasDaSecao(obras, "para-ler-agora")[0].id, "comentada");
  assert.equal(catalogo.ordenarObrasDaSecao(obras, "em-alta")[0].id, "curtida");
  assert.equal(catalogo.ordenarObrasDaSecao(obras, "recentes")[0].id, "curta");

  const recomendacoes = catalogo.ordenarRecomendacoes(obras, ["curtida"]);
  assert.equal(recomendacoes.some((obra) => obra.id === "curtida"), false);
  assert.equal(recomendacoes[0].genero, "Fantasia");
});

test("textos derivados preservam títulos, ordem, pluralidade e datas", () => {
  assert.equal(textos.tituloSecaoPublica("recomendacoes", ""), "Recomendações para você");
  assert.equal(textos.tituloSecaoPublica("autores", ""), "Autores para conhecer");
  assert.equal(textos.tituloSecaoPublica("recentes", "Fantasia"), "Fantasia");
  assert.equal(textos.rotuloCategoria("concluidas"), "Concluídas");
  assert.equal(
    textos.textoCategorias(["historico", "favoritas", "lendo"]),
    "Lendo • Favoritas • Histórico",
  );

  const item = {
    progresso: 40,
    capituloAtual: "Capítulo 2",
    data: "2024-05-15",
    categorias: ["favoritas"],
    obra: { genero: "Fantasia", formato: "Romance" },
  };
  assert.equal(textos.textoSecundarioItem(item, "lendo"), "40% concluído • Capítulo 2");
  assert.equal(textos.textoSecundarioItem(item, "historico"), "Última leitura em 15 mai. 2024 • 40%");
  assert.equal(textos.textoSecundarioItem(item, "quero-ler"), "Adicionada em 15 mai. 2024");
  assert.equal(textos.textoSecundarioItem(item, "favoritas"), "Favoritada em 15 mai. 2024");
  assert.equal(textos.textoSecundarioItem(item, "concluidas"), "Concluída em 15 mai. 2024");
  assert.equal(textos.textoSecundarioItem(item, "avaliacoes"), "Favoritas");
});
