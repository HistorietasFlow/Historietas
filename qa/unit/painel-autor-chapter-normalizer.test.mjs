import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const normalizerSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-chapter-normalizer.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const workNormalizerSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-work-normalizer.ts",
    import.meta.url,
  ),
  "utf8",
);
const normalizerJavascript = typescript.transpileModule(normalizerSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { normalizarCapitulo } = await import(
  `data:text/javascript;base64,${Buffer.from(normalizerJavascript).toString("base64")}`,
);

const capitulosNormalizados = [];
globalThis.__painelAutorCriarSlugBase = (texto) =>
  texto.trim().toLowerCase().replace(/\s+/g, "-");
globalThis.__painelAutorNormalizarCapitulo = (capitulo, capituloIndex, obraIndex) => {
  const normalizado = {
    id: capitulo.id || `capitulo-${obraIndex + 1}-${capituloIndex + 1}`,
    publicado: capitulo.publicado,
    lido: Boolean(capitulo.lido),
  };
  capitulosNormalizados.push([capitulo, capituloIndex, obraIndex]);
  return normalizado;
};
globalThis.__painelAutorNormalizarArquivo = (arquivo) =>
  arquivo?.valido ? { nome: "arquivo.txt", conteudo: "conteúdo" } : null;
globalThis.__painelAutorCalcularProgresso = (capitulos) => capitulos.length * 25;

const workNormalizerJavascript = typescript.transpileModule(
  workNormalizerSource
    .replace(
      'import { criarSlugBase } from "../../../lib/utils";',
      "const criarSlugBase = globalThis.__painelAutorCriarSlugBase;",
    )
    .replace(
      'import { normalizarCapitulo } from "./painel-autor-chapter-normalizer";',
      "const normalizarCapitulo = globalThis.__painelAutorNormalizarCapitulo;",
    )
    .replace(
      'import { normalizarArquivoObra } from "./painel-autor-file-normalizer";',
      "const normalizarArquivoObra = globalThis.__painelAutorNormalizarArquivo;",
    )
    .replace(
      'import { calcularProgressoLeitura } from "./painel-autor-reading-progress-utils";',
      "const calcularProgressoLeitura = globalThis.__painelAutorCalcularProgresso;",
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { normalizarObraPainel } = await import(
  `data:text/javascript;base64,${Buffer.from(workNormalizerJavascript).toString("base64")}`,
);

test("normalizarCapitulo preserva IDs e títulos padrão com numeração", () => {
  assert.deepEqual(normalizarCapitulo({}, 2, 4), {
    id: "capitulo-5-3",
    titulo: "Capítulo 3",
    texto: "",
    curtiu: false,
    salvo: false,
    comentario: "",
    criadoEm: "",
    lido: false,
    lidoEm: "",
    publicado: undefined,
  });

  assert.equal(
    normalizarCapitulo({ id: "  ", titulo: "\t" }, 0, 0).titulo,
    "Capítulo 1",
  );
});

test("normalizarCapitulo preserva valores textuais sem trim e booleanos", () => {
  const capitulo = normalizarCapitulo(
    {
      id: " capítulo-1 ",
      titulo: " Título original ",
      texto: " conteúdo ",
      curtiu: 1,
      salvo: "sim",
      comentario: " comentário ",
      criadoEm: " 2026-10-10 ",
      lido: true,
      lidoEm: " 2026-10-11 ",
      publicado: false,
    },
    0,
    0,
  );

  assert.deepEqual(capitulo, {
    id: " capítulo-1 ",
    titulo: " Título original ",
    texto: " conteúdo ",
    curtiu: true,
    salvo: true,
    comentario: " comentário ",
    criadoEm: " 2026-10-10 ",
    lido: true,
    lidoEm: " 2026-10-11 ",
    publicado: false,
  });
});

test("normalizarCapitulo usa undefined quando publicado não é booleano", () => {
  assert.equal(normalizarCapitulo({ publicado: "true" }, 0, 0).publicado, undefined);
  assert.equal(normalizarCapitulo({ publicado: true }, 0, 0).publicado, true);
});

test("normalizarObraPainel preserva capítulos, fallbacks, tags, arquivo e progresso", () => {
  capitulosNormalizados.length = 0;

  const obra = normalizarObraPainel(
    {
      id: "  ",
      user_id: " usuario-1 ",
      titulo: " Título da Obra ",
      tags: [" ação ", " ", 4],
      arquivoObra: { valido: true },
      publicado: "sim",
      capitulos: [{ id: "capitulo-1", lido: true }, { publicado: false }],
      visualizacoes: 3.6,
      totalCurtidasPainel: -1.6,
      totalComentariosPainel: 2.5,
      totalSalvosPainel: Number.POSITIVE_INFINITY,
      totalLidosPainel: 1.4,
    },
    1,
  );

  assert.deepEqual(capitulosNormalizados, [
    [{ id: "capitulo-1", lido: true }, 0, 1],
    [{ publicado: false }, 1, 1],
  ]);
  assert.equal(obra.id, "obra-2");
  assert.equal(obra.autorId, "usuario-1");
  assert.equal(obra.titulo, " Título da Obra ");
  assert.equal(obra.autor, "Autor não informado");
  assert.equal(obra.genero, "Não informado");
  assert.equal(obra.formato, "Não informado");
  assert.equal(obra.classificacaoIndicativa, "Não informada");
  assert.equal(obra.sinopse, "Nenhuma sinopse informada.");
  assert.deepEqual(obra.tags, ["ação"]);
  assert.deepEqual(obra.arquivoObra, { nome: "arquivo.txt", conteudo: "conteúdo" });
  assert.equal(obra.publicado, true);
  assert.equal(obra.progressoLeitura, 50);
  assert.equal(obra.visualizacoes, 4);
  assert.equal(obra.slug, "título-da-obra");
  assert.equal(obra.link, "/obra/título-da-obra");
  assert.equal(obra.totalCurtidasPainel, 0);
  assert.equal(obra.totalComentariosPainel, 3);
  assert.equal(obra.totalSalvosPainel, undefined);
  assert.equal(obra.totalLidosPainel, 1);
});

test("normalizarObraPainel preserva a prioridade de visualizações, slug, link e autor", () => {
  const porViews = normalizarObraPainel(
    {
      autorId: " ",
      user_id: " ",
      userId: " usuario-2 ",
      tags: ["", 3],
      visualizacoes: Number.NaN,
      views: -1.4,
      total_visualizacoes: 8.8,
      slug: " slug existente ",
      link: " /obra/existente ",
    },
    0,
  );
  const porTotal = normalizarObraPainel(
    { visualizacoes: Number.NaN, views: Number.POSITIVE_INFINITY, total_visualizacoes: 3.6 },
    0,
  );
  const semVisualizacoes = normalizarObraPainel({}, 0);

  assert.equal(porViews.autorId, "usuario-2");
  assert.deepEqual(porViews.tags, ["sem tags"]);
  assert.equal(porViews.visualizacoes, 0);
  assert.equal(porViews.slug, " slug existente ");
  assert.equal(porViews.link, " /obra/existente ");
  assert.equal(porTotal.visualizacoes, 4);
  assert.equal(semVisualizacoes.visualizacoes, 0);
  assert.equal(semVisualizacoes.slug, "obra-1");
  assert.equal(semVisualizacoes.link, "/obra/obra-1");
});

test("Painel do Autor delega somente normalizarCapitulo ao módulo extraído", () => {
  assert.match(
    workNormalizerSource,
    /import \{ normalizarCapitulo \} from "\.\/painel-autor-chapter-normalizer";/,
  );
  assert.doesNotMatch(pagina, /function normalizarCapitulo\(/);
  assert.doesNotMatch(pagina, /\bnormalizarCapitulo\b/);
  assert.match(
    readFileSync(new URL("../../app/painel-autor/hooks/use-painel-autor-initial-data.ts", import.meta.url), "utf8"),
    /import \{ normalizarObraPainel \} from "\.\.\/lib\/painel-autor-work-normalizer";/,
  );
  assert.match(
    workNormalizerSource,
    /normalizarCapitulo\(capitulo, capituloIndex, obraIndex\)/,
  );
  assert.match(
    normalizerSource,
    /`capitulo-\$\{obraIndex \+ 1\}-\$\{capituloIndex \+ 1\}`/,
  );
  assert.match(normalizerSource, /`Capítulo \$\{capituloIndex \+ 1\}`/);
  assert.doesNotMatch(pagina, /function normalizarObra\(/);
  assert.match(
    workNormalizerSource,
    /tagsNormalizadas\.length > 0 \? tagsNormalizadas : \["sem tags"\]/,
  );
  assert.match(workNormalizerSource, /obra\.visualizacoes/);
  assert.match(workNormalizerSource, /obra\.views/);
  assert.match(workNormalizerSource, /obra\.total_visualizacoes/);
  assert.match(workNormalizerSource, /Math\.max\(0, Math\.round\(/);
  assert.match(normalizerSource, /typeof capitulo\.publicado === "boolean"/);
  assert.match(normalizerSource, /: undefined/);
  assert.doesNotMatch(normalizerSource, /supabase|localStorage|useState|useEffect/);
  assert.doesNotMatch(
    workNormalizerSource,
    /supabase|localStorage|useState|useEffect|window|document/,
  );
});
