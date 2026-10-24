import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

function transpilarModulo(source) {
  return typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
}

async function importarModulo(source) {
  return import(
    `data:text/javascript;base64,${Buffer.from(transpilarModulo(source)).toString("base64")}`,
  );
}

const source = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-work-normalizer.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const loadedWorkMergeSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-loaded-work-merge.ts",
    import.meta.url,
  ),
  "utf8",
);
const localWorkStorageSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-local-work-storage.ts",
    import.meta.url,
  ),
  "utf8",
);
const utilsSource = readFileSync(new URL("../../lib/utils.ts", import.meta.url), "utf8");
const adultContentSource = readFileSync(
  new URL("../../lib/historietasAdultContent.ts", import.meta.url),
  "utf8",
);
const chapterNormalizerSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-chapter-normalizer.ts",
    import.meta.url,
  ),
  "utf8",
);
const fileNormalizerSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-file-normalization.ts",
    import.meta.url,
  ),
  "utf8",
);
const metricsSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-metrics-utils.ts",
    import.meta.url,
  ),
  "utf8",
);

const { criarSlugBase } = await importarModulo(utilsSource);
const { normalizarAvisosConteudo18 } = await importarModulo(adultContentSource);
const { normalizarCapitulo } = await importarModulo(chapterNormalizerSource);
const { normalizarArquivoObra } = await importarModulo(fileNormalizerSource);
const { calcularProgressoLeitura, normalizarContadorEdicaoObra } = await importarModulo(metricsSource);

globalThis.__editarObraCriarSlugBase = criarSlugBase;
globalThis.__editarObraNormalizarAvisosConteudo18 = normalizarAvisosConteudo18;
globalThis.__editarObraNormalizarCapitulo = normalizarCapitulo;
globalThis.__editarObraNormalizarArquivoObra = normalizarArquivoObra;
globalThis.__editarObraCalcularProgressoLeitura = calcularProgressoLeitura;
globalThis.__editarObraNormalizarContador = normalizarContadorEdicaoObra;

const sourceComDependencias = source
  .replace(
    'import { criarSlugBase } from "../../../lib/utils";',
    "const criarSlugBase = globalThis.__editarObraCriarSlugBase;",
  )
  .replace(
    'import { normalizarAvisosConteudo18, type AvisoConteudo18 } from "../../../lib/historietasAdultContent";',
    'type AvisoConteudo18 = "terror" | "outro_tema_adulto";\nconst normalizarAvisosConteudo18 = globalThis.__editarObraNormalizarAvisosConteudo18;',
  )
  .replace(
    'import { normalizarCapitulo } from "./editar-obra-chapter-normalizer";',
    "const normalizarCapitulo = globalThis.__editarObraNormalizarCapitulo;",
  )
  .replace(
    'import { normalizarArquivoObra } from "./editar-obra-file-normalization";',
    "const normalizarArquivoObra = globalThis.__editarObraNormalizarArquivoObra;",
  )
  .replace(
    /import \{\r?\n  calcularProgressoLeitura,\r?\n  normalizarContadorEdicaoObra,\r?\n\} from "\.\/editar-obra-metrics-utils";/,
    "const calcularProgressoLeitura = globalThis.__editarObraCalcularProgressoLeitura;\nconst normalizarContadorEdicaoObra = globalThis.__editarObraNormalizarContador;",
  );
const { normalizarObra } = await importarModulo(sourceComDependencias);

test("normaliza obra completa preservando valores existentes e métricas", () => {
  const obra = normalizarObra(
    {
      id: " obra-1 ",
      titulo: " Título original ",
      autor: " Autor original ",
      autorId: " autor-1 ",
      genero: " Fantasia ",
      formato: " HQ ",
      classificacaoIndicativa: " 18+ ",
      avisosConteudo: [" terror ", "terror", "invalido"],
      sinopse: " Sinopse original ",
      tags: [" ação ", " ", 3, "fantasia"],
      capa: " capa ",
      capaNome: " capa.png ",
      arquivoObra: {
        nome: " obra.txt ",
        tipo: "text/plain",
        tamanho: 12,
        conteudo: " texto ",
        categoria: "texto",
        criadoEm: " data ",
      },
      publicado: 1,
      capitulos: [
        {
          id: " capítulo-1 ",
          titulo: " Capítulo 1 ",
          texto: " texto ",
          curtiu: true,
          salvo: true,
          comentario: " nota ",
          criadoEm: " data ",
          lido: true,
          lidoEm: " leitura ",
          publicado: false,
        },
      ],
      criadaEm: " criada ",
      ultimoCapituloLidoId: " capítulo-1 ",
      ultimaLeituraEm: " leitura ",
      visualizacoes: 1.6,
      totalCurtidas: 4,
      totalComentarios: 5,
      totalSalvos: 6,
      totalLidos: 7,
      slug: " slug-existente ",
      link: " /obra/existente ",
    },
    0,
  );

  assert.equal(obra.id, " obra-1 ");
  assert.equal(obra.titulo, " Título original ");
  assert.equal(obra.autor, " Autor original ");
  assert.equal(obra.autorId, "autor-1");
  assert.equal(obra.genero, " Fantasia ");
  assert.equal(obra.formato, " HQ ");
  assert.equal(obra.classificacaoIndicativa, "18+");
  assert.deepEqual(obra.avisosConteudo, ["terror"]);
  assert.deepEqual(obra.tags, ["ação", "fantasia"]);
  assert.equal(obra.capitulos[0].id, " capítulo-1 ");
  assert.equal(obra.arquivoObra?.conteudo, " texto ");
  assert.equal(obra.progressoLeitura, 100);
  assert.deepEqual(
    [obra.visualizacoes, obra.totalCurtidas, obra.totalComentarios, obra.totalSalvos, obra.totalLidos],
    [2, 4, 5, 6, 7],
  );
  assert.equal(obra.slug, " slug-existente ");
  assert.equal(obra.link, " /obra/existente ");
});

test("normaliza fallbacks, capítulos, métricas derivadas, slug e link", () => {
  const obra = normalizarObra(
    {
      id: " ",
      titulo: " ",
      autor: "\t",
      autorId: " ",
      genero: "",
      formato: null,
      classificacaoIndicativa: "Não informada",
      tags: [" ", null],
      capa: 3,
      capaNome: null,
      arquivoObra: { nome: " ", conteudo: "x" },
      capitulos: [
        { id: "", titulo: "", curtiu: true, salvo: true, comentario: " nota ", lido: true },
        { curtiu: false, salvo: false, comentario: " ", lido: false },
      ],
    },
    2,
  );

  assert.equal(obra.id, "obra-3");
  assert.equal(obra.titulo, "Obra sem título");
  assert.equal(obra.autor, "Autor não informado");
  assert.equal(obra.autorId, "");
  assert.equal(obra.genero, "Não informado");
  assert.equal(obra.formato, "Não informado");
  assert.equal(obra.classificacaoIndicativa, "Livre");
  assert.deepEqual(obra.avisosConteudo, []);
  assert.deepEqual(obra.tags, ["sem tags"]);
  assert.equal(obra.capa, "");
  assert.equal(obra.capaNome, "");
  assert.equal(obra.arquivoObra, null);
  assert.deepEqual(obra.capitulos.map((capitulo) => capitulo.id), ["capitulo-1", "capitulo-2"]);
  assert.deepEqual(
    [obra.totalCurtidas, obra.totalComentarios, obra.totalSalvos, obra.totalLidos],
    [1, 1, 1, 1],
  );
  assert.equal(obra.slug, "obra-3");
  assert.equal(obra.link, "/obra/obra-3");
});

test("normaliza classificações sem informação como Livre", () => {
  assert.equal(normalizarObra({ classificacaoIndicativa: "Não informada" }, 0).classificacaoIndicativa, "Livre");
  assert.equal(normalizarObra({ classificacaoIndicativa: "Não informado" }, 0).classificacaoIndicativa, "Livre");
  assert.equal(normalizarObra({ classificacaoIndicativa: " 14+ " }, 0).classificacaoIndicativa, "14+");
});

test("Editar Obra delega somente a normalização de obras", () => {
  assert.doesNotMatch(
    pageSource,
    /import \{ normalizarObra \} from "\.\/lib\/editar-obra-work-normalizer";/,
  );
  assert.doesNotMatch(pageSource, /function normalizarObra\(/);
  assert.match(
    loadedWorkMergeSource,
    /import \{ normalizarObra \} from "\.\/editar-obra-work-normalizer";/,
  );
  assert.match(loadedWorkMergeSource, /normalizarObra\(/);
  assert.match(
    localWorkStorageSource,
    /normalizarObra\(\s*obra as Parameters<typeof normalizarObra>\[0\],\s*index\s*\)/,
  );
  for (const contrato of [
    'import { criarSlugBase } from "../../../lib/utils";',
    'import { normalizarCapitulo } from "./editar-obra-chapter-normalizer";',
    'import { normalizarArquivoObra } from "./editar-obra-file-normalization";',
    "normalizarAvisosConteudo18(",
    "calcularProgressoLeitura(capitulosNormalizados)",
    "normalizarContadorEdicaoObra(",
  ]) {
    assert.ok(source.includes(contrato), `contrato ausente: ${contrato}`);
  }
  assert.doesNotMatch(source, /supabase|localStorage|useState|useEffect/);
});
