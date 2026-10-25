import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const mappersSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-supabase-mappers.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);

globalThis.__editarCapituloCriarSlugBase = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
globalThis.__editarCapituloSupabaseNormalization = {
  normalizarCategoriaArquivoSupabase: (categoria) =>
    ["texto", "documento", "imagem", "outro"].includes(categoria)
      ? categoria
      : "outro",
  normalizarTagsSupabase: (tags) => {
    if (!Array.isArray(tags)) return ["sem tags"];

    const tagsValidas = tags
      .filter((tag) => typeof tag === "string" && Boolean(tag.trim()))
      .map((tag) => tag.trim());

    return tagsValidas.length > 0 ? tagsValidas : ["sem tags"];
  },
};
globalThis.__editarCapituloMetrics = {
  calcularProgressoLeitura: (capitulos) =>
    capitulos.length === 0
      ? 0
      : Math.round(
          (capitulos.filter((capitulo) => capitulo.lido).length / capitulos.length) * 100,
        ),
  normalizarNumeroEditarCapitulo: (valor, fallback = 0) => {
    const numero = typeof valor === "number" && Number.isFinite(valor) ? valor : fallback;

    return Math.max(0, Math.round(numero));
  },
};

const mappersJavascript = typescript.transpileModule(
  mappersSource
    .replace(
      'import { criarSlugBase } from "../../../lib/utils";',
      "const criarSlugBase = globalThis.__editarCapituloCriarSlugBase;",
    )
    .replace(
      /import \{\r?\n  normalizarCategoriaArquivoSupabase,\r?\n  normalizarTagsSupabase,\r?\n\} from "\.\/editar-capitulo-supabase-normalization";/,
      "const { normalizarCategoriaArquivoSupabase, normalizarTagsSupabase } = globalThis.__editarCapituloSupabaseNormalization;",
    )
    .replace(
      /import \{\r?\n  calcularProgressoLeitura,\r?\n  normalizarNumeroEditarCapitulo,\r?\n\} from "\.\/editar-capitulo-metrics-utils";/,
      "const { calcularProgressoLeitura, normalizarNumeroEditarCapitulo } = globalThis.__editarCapituloMetrics;",
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { mapearCapituloSupabase, mapearObraSupabase } = await import(
  `data:text/javascript;base64,${Buffer.from(mappersJavascript).toString("base64")}`,
);

const criarCapituloLocal = (sobrescrever = {}) => ({
  id: "capitulo-local",
  titulo: "Título local",
  texto: "Texto local",
  curtiu: true,
  salvo: true,
  comentario: "Comentário local",
  criadoEm: "2026-01-01",
  lido: true,
  lidoEm: "2026-01-02",
  publicado: false,
  ordem: 9,
  ...sobrescrever,
});

const criarObraLocal = (sobrescrever = {}) => ({
  id: "obra-local",
  titulo: "Obra local",
  autor: "Autor local",
  autorId: "autor-local",
  genero: "Gênero local",
  formato: "Formato local",
  classificacaoIndicativa: "Livre",
  sinopse: "Sinopse local",
  tags: ["local"],
  capa: "capa-local",
  capaNome: "capa-local.png",
  arquivoObra: {
    nome: "arquivo-local.txt",
    tipo: "text/plain",
    tamanho: 4,
    conteudo: "local",
    categoria: "texto",
    criadoEm: "2026-01-01",
  },
  publicado: false,
  capitulos: [criarCapituloLocal({ id: "capitulo-remoto" }), criarCapituloLocal({ id: "obsoleto" })],
  criadaEm: "2026-01-01",
  ultimoCapituloLidoId: "capitulo-remoto",
  ultimaLeituraEm: "2026-01-02",
  visualizacoes: 9,
  totalFavoritos: 6,
  totalConcluidas: 7,
  slug: "slug-local",
  link: "/obra/local",
  ...sobrescrever,
});

const criarObraSupabase = (sobrescrever = {}) => ({
  id: "obra-remota",
  user_id: "autor-remoto",
  titulo: " Obra remota ",
  autor: " Autor remoto ",
  genero: " Gênero remoto ",
  formato: " Formato remoto ",
  classificacao_indicativa: " 14+ ",
  sinopse: " Sinopse remota ",
  tags: [" remota "],
  capa_url: "capa-remota",
  capa_nome: "capa-remota.png",
  arquivo_url: "arquivo-remoto",
  arquivo_nome: "arquivo-remoto.pdf",
  arquivo_tipo: "application/pdf",
  arquivo_tamanho: 12,
  arquivo_categoria: "documento",
  publicado: true,
  visualizacoes: 0,
  slug: " slug-remoto ",
  link: " /obra/remota ",
  criada_em: "2026-02-01",
  ...sobrescrever,
});

test("mapearCapituloSupabase preserva estados locais e fallbacks remotos", () => {
  const capitulo = mapearCapituloSupabase(
    {
      id: "capitulo-remoto",
      titulo: " Título remoto ",
      texto: " Texto remoto ",
      ordem: 4,
      publicado: null,
      criado_em: "2026-02-01",
    },
    2,
    criarCapituloLocal({ titulo: "Título local alternativo" }),
  );

  assert.deepEqual(capitulo, {
    id: "capitulo-remoto",
    titulo: "Título remoto",
    texto: " Texto remoto ",
    curtiu: true,
    salvo: true,
    comentario: "Comentário local",
    criadoEm: "2026-02-01",
    lido: true,
    lidoEm: "2026-01-02",
    publicado: true,
    ordem: 4,
  });
  assert.deepEqual(
    mapearCapituloSupabase(
      {
        id: "sem-dados",
        titulo: null,
        texto: null,
        ordem: 0,
        publicado: false,
        criado_em: null,
      },
      1,
    ),
    {
      id: "sem-dados",
      titulo: "Capítulo 2",
      texto: "",
      curtiu: false,
      salvo: false,
      comentario: "",
      criadoEm: "",
      lido: false,
      lidoEm: "",
      publicado: false,
      ordem: 2,
    },
  );
});

test("mapearObraSupabase preserva fonte remota dos capítulos, precedências e métricas", () => {
  const obraLocal = criarObraLocal();
  const obra = mapearObraSupabase(
    criarObraSupabase(),
    [
      {
        id: "capitulo-remoto",
        titulo: null,
        texto: null,
        ordem: 1,
        publicado: null,
        criado_em: null,
      },
      {
        id: "novo-remoto",
        titulo: "Novo",
        texto: "Texto",
        ordem: 2,
        publicado: true,
        criado_em: "2026-02-02",
      },
    ],
    obraLocal,
    " Perfil prioritário ",
  );

  assert.equal(obra.titulo, "Obra remota");
  assert.equal(obra.slug, "slug-remoto");
  assert.equal(obra.autor, "Perfil prioritário");
  assert.equal(obra.autorId, "autor-remoto");
  assert.equal(obra.link, "/obra/remota");
  assert.deepEqual(obra.tags, ["remota"]);
  assert.deepEqual(obra.arquivoObra, {
    nome: "arquivo-remoto.pdf",
    tipo: "application/pdf",
    tamanho: 12,
    conteudo: "arquivo-remoto",
    categoria: "documento",
    criadoEm: "2026-02-01",
  });
  assert.equal(obra.capitulos.length, 2);
  assert.equal(obra.capitulos.some((capitulo) => capitulo.id === "obsoleto"), false);
  assert.equal(obra.capitulos[0].curtiu, true);
  assert.equal(obra.capitulos[0].salvo, true);
  assert.equal(obra.capitulos[0].lido, true);
  assert.deepEqual(
    [
      obra.visualizacoes,
      obra.totalCurtidas,
      obra.totalComentarios,
      obra.totalSalvos,
      obra.totalLidos,
      obra.totalFavoritos,
      obra.totalConcluidas,
    ],
    [0, 1, 1, 1, 1, 6, 7],
  );
  assert.equal(obra.progressoLeitura, 50);

  const obraComArquivoLocal = mapearObraSupabase(
    criarObraSupabase({ arquivo_url: null, link: null, slug: null, titulo: null }),
    [],
    obraLocal,
  );
  assert.strictEqual(obraComArquivoLocal.arquivoObra, obraLocal.arquivoObra);
  assert.equal(obraComArquivoLocal.link, "/obra/local");

  const obraComFallbackLink = mapearObraSupabase(
    criarObraSupabase({ link: null, slug: null, titulo: "Título para slug" }),
    [],
    criarObraLocal({ link: "", slug: "" }),
  );
  assert.equal(obraComFallbackLink.slug, "titulo-para-slug");
  assert.equal(obraComFallbackLink.link, "/obra/titulo-para-slug");
});

test("Editar Capítulo delega somente os mapeadores Supabase ao módulo extraído", () => {
  assert.match(
    pageSource,
    /import \{ mapearObraSupabase \} from "\.\/lib\/editar-capitulo-supabase-mappers";/,
  );
  assert.doesNotMatch(pageSource, /function mapearCapituloSupabase\(/);
  assert.doesNotMatch(pageSource, /function mapearObraSupabase\(/);
  assert.match(
    pageSource,
    /const obraNormalizadaSupabase = mapearObraSupabase\(\s*obraSupabase,\s*capitulosSupabase,\s*obraLocal,\s*nomeProfileAutor\s*\);/,
  );
  assert.match(
    mappersSource,
    /import \{ criarSlugBase \} from "\.\.\/\.\.\/\.\.\/lib\/utils";/,
  );
  assert.match(
    mappersSource,
    /normalizarTagsSupabase\(obra\.tags \|\| obraLocal\?\.tags\)/,
  );
  assert.match(
    mappersSource,
    /obra\.visualizacoes \?\? obraLocal\?\.visualizacoes/,
  );
  assert.match(
    mappersSource,
    /Para obras do Supabase, a lista remota é a fonte de verdade\./,
  );
  assert.doesNotMatch(mappersSource, /\.from\(|useState|useEffect|localStorage|router/);
});
