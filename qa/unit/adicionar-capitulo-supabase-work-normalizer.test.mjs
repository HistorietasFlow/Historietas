import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/lib/adicionar-capitulo-supabase-work-normalizer.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);

const transpile = (value) =>
  typescript.transpileModule(value, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
const dependencyUrl = (code) =>
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;

const utilsUrl = dependencyUrl(
  `export const criarSlugBase=(texto)=>texto.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");`,
);
const metricsUrl = dependencyUrl(
  `export const calcularProgressoLeitura=(capitulos)=>capitulos.length?Math.round((capitulos.filter((capitulo)=>capitulo.lido).length/capitulos.length)*100):0;`,
);
const numberUrl = dependencyUrl(
  `export const normalizarNumeroAdicionarCapitulo=(valor,fallback=0)=>typeof valor==="number"&&Number.isFinite(valor)?Math.max(0,Math.round(valor)):Math.max(0,Math.round(fallback));`,
);
const normalizationUrl = dependencyUrl(`
  export const normalizarCategoriaSupabase=(categoria)=>["texto","documento","imagem","outro"].includes(categoria)?categoria:"outro";
  export const normalizarCapituloSupabase=(capitulo,index,local)=>({
    id:capitulo.id,
    titulo:capitulo.titulo||"Capítulo "+(index+1),
    texto:capitulo.texto||"",
    curtiu:Boolean(local?.curtiu),
    salvo:Boolean(local?.salvo),
    comentario:local?.comentario||"",
    criadoEm:capitulo.criado_em||"",
    lido:Boolean(local?.lido),
    lidoEm:local?.lidoEm||"",
    publicado:Boolean(capitulo.publicado),
    ordem:capitulo.ordem,
  });
`);

const javascript = transpile(
  source
    .replace('"../../../lib/utils"', JSON.stringify(utilsUrl))
    .replace('"./adicionar-capitulo-metrics-utils"', JSON.stringify(metricsUrl))
    .replace('"./adicionar-capitulo-number-utils"', JSON.stringify(numberUrl))
    .replace(
      '"./adicionar-capitulo-supabase-normalization"',
      JSON.stringify(normalizationUrl),
    ),
);
const { normalizarObraSupabase } = await import(dependencyUrl(javascript));

const criarObraRemota = (sobrescritas = {}) => ({
  id: "obra-1",
  user_id: "autor-remoto",
  titulo: " Título remoto ",
  autor: " Autor remoto ",
  genero: " Fantasia ",
  formato: " Livro ",
  classificacao_indicativa: " 12+ ",
  sinopse: " Sinopse ",
  tags: [" tag sem trim ", "", 1],
  capa_url: "capa-remota",
  capa_nome: "capa.png",
  arquivo_url: "arquivo-remoto",
  arquivo_nome: " arquivo.pdf ",
  arquivo_tipo: "application/pdf",
  arquivo_tamanho: 12.5,
  arquivo_categoria: "documento",
  publicado: 1,
  visualizacoes: 10,
  total_curtidas: 1,
  total_comentarios: 1,
  total_salvos: 1,
  total_lidos: 1,
  slug: " slug-remoto ",
  link: " /obra-existente ",
  criada_em: "2025-01-01",
  atualizado_em: "2025-01-02",
  capitulos: [],
  ...sobrescritas,
});

test("normalizarObraSupabase ordena uma cópia, preserva tags remotas e complementa capítulos locais", () => {
  const obra = criarObraRemota({
    total_curtidas: null,
    total_comentarios: null,
    total_salvos: null,
    total_lidos: null,
    capitulos: [
      { id: "segundo", ordem: 2, titulo: "Segundo", texto: "", publicado: true, criado_em: "" },
      { id: "primeiro", ordem: 1, titulo: "Primeiro", texto: "", publicado: true, criado_em: "" },
      { id: "sem-ordem", ordem: null, titulo: "Terceiro", texto: "", publicado: true, criado_em: "" },
    ],
  });
  const original = obra.capitulos.map((capitulo) => capitulo.id);
  const resultado = normalizarObraSupabase(obra, 0, {
    capitulos: [
      { id: "primeiro", curtiu: true, salvo: true, comentario: " comentário ", lido: true, lidoEm: "ontem" },
      { id: "segundo", curtiu: true, salvo: false, comentario: "   ", lido: false, lidoEm: "" },
    ],
  });

  assert.deepEqual(obra.capitulos.map((capitulo) => capitulo.id), original);
  assert.deepEqual(resultado.capitulos.map((capitulo) => capitulo.id), ["primeiro", "segundo", "sem-ordem"]);
  assert.deepEqual(resultado.tags, [" tag sem trim "]);
  assert.equal(resultado.totalCurtidas, 2);
  assert.equal(resultado.totalComentarios, 1);
  assert.equal(resultado.totalSalvos, 1);
  assert.equal(resultado.totalLidos, 1);
});

test("normalizarObraSupabase preserva prioridades e fallbacks remotos", () => {
  const resultado = normalizarObraSupabase(
    criarObraRemota({
      titulo: null,
      autor: null,
      genero: null,
      formato: null,
      classificacao_indicativa: null,
      sinopse: null,
      tags: ["", "   "],
      capa_url: "",
      capa_nome: "",
      arquivo_url: "",
      slug: null,
      link: null,
      visualizacoes: null,
      views: 7,
      total_visualizacoes: 9,
      total_curtidas: null,
      total_comentarios: null,
      total_salvos: null,
      total_lidos: null,
      publicado: 0,
    }),
    3,
    {
      autor: "Autor local",
      autorId: "autor-local",
      capa: "capa-local",
      capaNome: "capa-local.png",
      arquivoObra: { nome: "local", tipo: "", tamanho: 0, conteudo: "arquivo-local", categoria: "outro", criadoEm: "" },
      visualizacoes: 2,
      totalCurtidas: 4,
      totalComentarios: 5,
      totalSalvos: 6,
      totalLidos: 7,
    },
    " Profile ",
  );

  assert.equal(resultado.titulo, "Obra sem título");
  assert.equal(resultado.autor, "Profile");
  assert.equal(resultado.autorId, "autor-remoto");
  assert.equal(resultado.genero, "Não informado");
  assert.equal(resultado.formato, "Não informado");
  assert.equal(resultado.classificacaoIndicativa, "Não informada");
  assert.equal(resultado.sinopse, "Nenhuma sinopse informada.");
  assert.deepEqual(resultado.tags, []);
  assert.equal(resultado.capa, "capa-local");
  assert.equal(resultado.capaNome, "capa-local.png");
  assert.equal(resultado.arquivoObra?.conteudo, "arquivo-local");
  assert.equal(resultado.publicado, false);
  assert.equal(resultado.visualizacoes, 7);
  assert.deepEqual([resultado.totalCurtidas, resultado.totalComentarios, resultado.totalSalvos, resultado.totalLidos], [4, 5, 6, 7]);
  assert.equal(resultado.slug, "obra-sem-titulo");
  assert.equal(resultado.link, "/obra/obra-sem-titulo");
});

test("normalizarObraSupabase mantém arquivo, autor remoto, métricas e página delegados", () => {
  const resultado = normalizarObraSupabase(criarObraRemota(), 0);

  assert.equal(resultado.autor, "Autor remoto");
  assert.equal(resultado.arquivoObra?.nome, "arquivo.pdf");
  assert.equal(resultado.arquivoObra?.tamanho, 12.5);
  assert.equal(resultado.arquivoObra?.categoria, "documento");
  assert.equal(resultado.slug, "slug-remoto");
  assert.equal(resultado.link, "/obra-existente");
  assert.doesNotMatch(pageSource, /function normalizarObraSupabase\(/);
  assert.match(pageSource, /import \{ normalizarObraSupabase \} from "\.\/lib\/adicionar-capitulo-supabase-work-normalizer";/);
  assert.match(pageSource, /normalizarObraSupabase\(/);
  assert.match(pageSource, /function mesclarObrasComSupabase\(/);
  assert.doesNotMatch(source, /useState|useEffect|localStorage|\.from\(|router|<[A-Z]/);
});
