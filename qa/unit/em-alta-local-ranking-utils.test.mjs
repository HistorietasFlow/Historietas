import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-local-ranking-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const executavel = modulo
  .replace(
    /import \{ ehClassificacao18 \} from "\.\.\/\.\.\/\.\.\/lib\/historietasAdultContent";\r?\n/,
    'const ehClassificacao18 = (classificacao) => classificacao === "18+";\n',
  )
  .replace(
    /import type \{ ObraLocal, ObraRanking \} from "\.\/em-alta-models";\r?\n/,
    "",
  )
  .replace(
    /import \{ criarHrefLeituraCapitulo \} from "\.\/em-alta-route-utils";\r?\n/,
    'const criarHrefLeituraCapitulo = (obra, capitulo, numero) => `leitura:${obra.id}:${capitulo.id}:${numero}`;\n',
  )
  .replace(
    /import \{\r?\n  calcularCapitulosLidos,\r?\n  calcularProgressoLeitura,\r?\n  encontrarCapituloParaContinuar,\r?\n  obterAvaliacaoLocalRanking,\r?\n  obterVisualizacoesRegistradasObra,\r?\n\} from "\.\/em-alta-ranking-data-utils";\r?\n/,
    `const calcularCapitulosLidos = (capitulos) => capitulos.filter((capitulo) => capitulo.lido).length;
const calcularProgressoLeitura = (capitulos) => capitulos.length ? Math.round((calcularCapitulosLidos(capitulos) / capitulos.length) * 100) : 0;
const encontrarCapituloParaContinuar = (obra) => {
  if (!obra.capitulos.some((capitulo) => capitulo.lido)) return null;
  const indice = obra.ultimoCapituloLidoId ? obra.capitulos.findIndex((capitulo) => capitulo.id === obra.ultimoCapituloLidoId) : -1;
  return (indice >= 0 ? obra.capitulos.slice(indice + 1).find((capitulo) => !capitulo.lido) : null) || obra.capitulos.find((capitulo) => !capitulo.lido) || null;
};
const obterAvaliacaoLocalRanking = (obra, avaliacoes) => Math.max(avaliacoes[obra.id] || 0, avaliacoes[obra.slug] || 0);
const obterVisualizacoesRegistradasObra = (obra, visualizacoes) => Math.max(visualizacoes[obra.id] || 0, visualizacoes[obra.slug] || 0);
`,
  );
const javascriptModulo = typescript.transpileModule(executavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { calcularRankingObrasLocais } = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function criarObra(overrides = {}) {
  return {
    id: "obra-1",
    titulo: "Obra publicada",
    autor: "Autora",
    autorId: "autor-1",
    autorAvatarRanking: "avatar.png",
    genero: "Fantasia",
    formato: "HQ",
    classificacaoIndicativa: "Livre",
    sinopse: "",
    tags: [],
    capa: "capa.png",
    capaNome: "capa.png",
    publicado: true,
    capitulos: [
      { id: "capitulo-1", titulo: "Capítulo lido", lido: true, lidoEm: "2025-01-02T00:00:00.000Z" },
      { id: "capitulo-2", titulo: "Próximo capítulo", lido: false, lidoEm: "" },
    ],
    criadaEm: "2025-01-01T00:00:00.000Z",
    ultimoCapituloLidoId: "capitulo-1",
    ultimaLeituraEm: "",
    progressoLeitura: 0,
    slug: "obra-publicada",
    link: "/obra/obra-publicada",
    arquivoObra: null,
    totalCurtidasRanking: 2,
    totalComentariosRanking: 3,
    totalSalvosRanking: 4,
    totalViewsRanking: 5,
    totalSeguidoresAutorRanking: 6,
    totalAvaliacoesRanking: 0,
    mediaAvaliacoesRanking: 0,
    ...overrides,
  };
}

test("filtra obras não publicadas e classificação 18+", () => {
  const ranking = calcularRankingObrasLocais(
    [criarObra(), criarObra({ id: "rascunho", publicado: false }), criarObra({ id: "adulta", classificacaoIndicativa: "18+" })],
    {},
    {},
  );

  assert.deepEqual(ranking.map((obra) => obra.storageId), ["obra-1"]);
});

test("preserva métricas, progresso, continuação, campos e pontuação literal", () => {
  const [ranking] = calcularRankingObrasLocais(
    [criarObra()],
    { "obra-1": 4.5 },
    { "obra-1": 9 },
  );

  assert.deepEqual(
    {
      id: ranking.id,
      storageId: ranking.storageId,
      tipo: ranking.tipo,
      status: ranking.status,
      disponivel: ranking.disponivel,
      autorId: ranking.autorId,
      autorAvatar: ranking.autorAvatar,
      seguidoresAutor: ranking.seguidoresAutor,
      capitulos: ranking.capitulos,
      capitulosLidos: ranking.capitulosLidos,
      progressoLeitura: ranking.progressoLeitura,
      ultimoCapituloLidoTitulo: ranking.ultimoCapituloLidoTitulo,
      ultimoCapituloLidoHref: ranking.ultimoCapituloLidoHref,
      ultimaLeituraEm: ranking.ultimaLeituraEm,
      curtidas: ranking.curtidas,
      comentarios: ranking.comentarios,
      salvos: ranking.salvos,
      views: ranking.views,
      avaliacoes: ranking.avaliacoes,
      mediaAvaliacao: ranking.mediaAvaliacao,
      pontuacao: ranking.pontuacao,
    },
    {
      id: "local-obra-1",
      storageId: "obra-1",
      tipo: "local",
      status: "Publicado",
      disponivel: true,
      autorId: "autor-1",
      autorAvatar: "avatar.png",
      seguidoresAutor: 6,
      capitulos: 2,
      capitulosLidos: 1,
      progressoLeitura: 50,
      ultimoCapituloLidoTitulo: "Próximo capítulo",
      ultimoCapituloLidoHref: "leitura:obra-1:capitulo-2:2",
      ultimaLeituraEm: "",
      curtidas: 2,
      comentarios: 3,
      salvos: 4,
      views: 9,
      avaliacoes: 1,
      mediaAvaliacao: 4.5,
      pontuacao: 60,
    },
  );
  assert.deepEqual(Object.keys(ranking).sort(), [
    "autor", "autorAvatar", "autorId", "avaliacoes", "capa", "capaNome", "capitulos", "capitulosLidos", "classificacaoIndicativa", "comentarios", "criadaEmTimestamp", "curtidas", "disponivel", "formato", "genero", "href", "id", "mediaAvaliacao", "pontuacao", "progressoLeitura", "salvos", "seguidoresAutor", "status", "storageId", "tipo", "titulo", "ultimaLeituraEm", "ultimoCapituloLidoHref", "ultimoCapituloLidoTitulo", "views",
  ]);
});

test("preserva máximo remoto/local, limites de avaliação e fallbacks", () => {
  const [ranking] = calcularRankingObrasLocais(
    [criarObra({ totalViewsRanking: 15, mediaAvaliacoesRanking: 7, criadaEm: "inválida", link: "", slug: "fallback", capitulos: [], ultimaLeituraEm: "" })],
    { "obra-1": 6 },
    { "obra-1": 9 },
  );

  assert.equal(ranking.views, 15);
  assert.equal(ranking.mediaAvaliacao, 5);
  assert.equal(ranking.avaliacoes, 1);
  assert.equal(ranking.capitulosLidos, 0);
  assert.equal(ranking.progressoLeitura, 0);
  assert.equal(ranking.ultimoCapituloLidoTitulo, "");
  assert.equal(ranking.ultimoCapituloLidoHref, "");
  assert.equal(ranking.href, "/obra/fallback");
  assert.equal(ranking.criadaEmTimestamp, 0);
});

test("fronteira preserva o useMemo, dependências e pureza", () => {
  assert.match(modulo, /export function calcularRankingObrasLocais\(/);
  assert.match(modulo, /import \{ ehClassificacao18 \} from "\.\.\/\.\.\/\.\.\/lib\/historietasAdultContent";/);
  assert.match(modulo, /import type \{ ObraLocal, ObraRanking \} from "\.\/em-alta-models";/);
  assert.match(modulo, /obra\.publicado && !ehClassificacao18\(obra\.classificacaoIndicativa\)/);
  assert.match(modulo, /\} satisfies ObraRanking;/);
  assert.doesNotMatch(modulo, /\b(React|useMemo|supabase|localStorage|window|document)\b/);
  assert.doesNotMatch(modulo, /<[A-Z][A-Za-z]/);
  assert.match(pagina, /import \{ calcularRankingObrasLocais \} from "\.\/lib\/em-alta-local-ranking-utils";/);
  assert.match(pagina, /const ranking = useMemo<ObraRanking\[\]>\([\s\S]*?calcularRankingObrasLocais\([\s\S]*?obrasLocais,[\s\S]*?avaliacoesLocaisRegistradas,[\s\S]*?visualizacoesRegistradas,[\s\S]*?\)[\s\S]*?\[avaliacoesLocaisRegistradas, obrasLocais, visualizacoesRegistradas\],[\s\S]*?\);/);
  assert.doesNotMatch(pagina, /const totalCurtidas = Math\.max\(0, obra\.totalCurtidasRanking \|\| 0\);/);
});
