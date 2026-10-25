import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const workNormalizerSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-work-normalizer.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const localWorkStorageSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-local-work-storage.ts",
    import.meta.url,
  ),
  "utf8",
);

const capitulosNormalizados = [];
globalThis.__editarCapituloCriarSlugBase = (texto) =>
  texto.trim().toLowerCase().replace(/\s+/g, "-");
globalThis.__editarCapituloNormalizarCapitulo = (capitulo, index) => {
  capitulosNormalizados.push([capitulo, index]);

  return {
    id: typeof capitulo.id === "string" && capitulo.id.trim() ? capitulo.id : `capitulo-${index + 1}`,
    titulo:
      typeof capitulo.titulo === "string" && capitulo.titulo.trim()
        ? capitulo.titulo
        : `Capítulo ${index + 1}`,
    texto: typeof capitulo.texto === "string" ? capitulo.texto : "",
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario: typeof capitulo.comentario === "string" ? capitulo.comentario : "",
    criadoEm: typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
    publicado: typeof capitulo.publicado === "boolean" ? capitulo.publicado : undefined,
    ordem:
      typeof capitulo.ordem === "number" &&
      Number.isInteger(capitulo.ordem) &&
      capitulo.ordem > 0
        ? capitulo.ordem
        : index + 1,
  };
};
globalThis.__editarCapituloNormalizarArquivoObra = (arquivo) =>
  arquivo?.nome ? { ...arquivo } : null;
globalThis.__editarCapituloCalcularProgressoLeitura = (capitulos) =>
  capitulos.length === 0
    ? 0
    : Math.round((capitulos.filter((capitulo) => capitulo.lido).length / capitulos.length) * 100);
globalThis.__editarCapituloNormalizarNumero = (valor, fallback = 0) => {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return Math.max(0, Math.round(valor));
  }

  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));

    if (Number.isFinite(numero)) {
      return Math.max(0, Math.round(numero));
    }
  }

  return Math.max(0, Math.round(fallback));
};

const workNormalizerJavascript = typescript.transpileModule(
  workNormalizerSource
    .replace(
      'import { criarSlugBase } from "../../../lib/utils";',
      "const criarSlugBase = globalThis.__editarCapituloCriarSlugBase;",
    )
    .replace(
      'import { normalizarCapitulo } from "./editar-capitulo-chapter-normalizer";',
      "const normalizarCapitulo = globalThis.__editarCapituloNormalizarCapitulo;",
    )
    .replace(
      'import { normalizarArquivoObra } from "./editar-capitulo-file-normalization";',
      "const normalizarArquivoObra = globalThis.__editarCapituloNormalizarArquivoObra;",
    )
    .replace(
      /import \{\r?\n  calcularProgressoLeitura,\r?\n  normalizarNumeroEditarCapitulo,\r?\n\} from "\.\/editar-capitulo-metrics-utils";/,
      "const calcularProgressoLeitura = globalThis.__editarCapituloCalcularProgressoLeitura;\nconst normalizarNumeroEditarCapitulo = globalThis.__editarCapituloNormalizarNumero;",
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { normalizarObra } = await import(
  `data:text/javascript;base64,${Buffer.from(workNormalizerJavascript).toString("base64")}`,
);

test("normalizarObra preserva fallbacks, tags e capítulos normalizados", () => {
  capitulosNormalizados.length = 0;

  const obra = normalizarObra(
    {
      tags: [" ação ", " ", 3],
      arquivoObra: { nome: "arquivo.txt", conteudo: "conteúdo" },
      capitulos: [
        { id: "capitulo-1", curtiu: true, salvo: true, comentario: "nota", lido: true },
        { id: "capitulo-2", comentario: " " },
      ],
    },
    1,
  );

  assert.deepEqual(capitulosNormalizados, [
    [{ id: "capitulo-1", curtiu: true, salvo: true, comentario: "nota", lido: true }, 0],
    [{ id: "capitulo-2", comentario: " " }, 1],
  ]);
  assert.equal(obra.id, "obra-2");
  assert.equal(obra.titulo, "Obra sem título");
  assert.equal(obra.autor, "Autor não informado");
  assert.equal(obra.autorId, "");
  assert.equal(obra.genero, "Não informado");
  assert.equal(obra.formato, "Não informado");
  assert.equal(obra.classificacaoIndicativa, "Não informada");
  assert.equal(obra.sinopse, "Nenhuma sinopse informada.");
  assert.deepEqual(obra.tags, ["ação"]);
  assert.deepEqual(obra.arquivoObra, { nome: "arquivo.txt", conteudo: "conteúdo" });
  assert.equal(obra.publicado, false);
  assert.equal(obra.criadaEm, "");
  assert.equal(obra.ultimoCapituloLidoId, "");
  assert.equal(obra.ultimaLeituraEm, "");
  assert.equal(obra.progressoLeitura, 50);
  assert.equal(obra.totalCurtidas, 1);
  assert.equal(obra.totalComentarios, 1);
  assert.equal(obra.totalSalvos, 1);
  assert.equal(obra.totalLidos, 1);
  assert.equal(obra.slug, "obra-2");
  assert.equal(obra.link, "/obra/obra-2");
  assert.deepEqual(normalizarObra({}, 0).tags, ["sem tags"]);
});

test("normalizarObra preserva valores originais e a prioridade dos aliases de métricas", () => {
  const obra = normalizarObra(
    {
      id: " obra-1 ",
      titulo: " Título original ",
      autor: " Autor original ",
      autorId: " autor-1 ",
      genero: " Ação ",
      formato: " HQ ",
      classificacaoIndicativa: " 14+ ",
      sinopse: " Sinopse ",
      tags: [" tag "],
      capa: " capa ",
      capaNome: " capa.png ",
      publicado: true,
      criadaEm: " 2026-01-01 ",
      ultimoCapituloLidoId: " capitulo-1 ",
      ultimaLeituraEm: " 2026-01-02 ",
      slug: " slug existente ",
      link: " /obra/existente ",
      visualizacoes: 1,
      views: 2,
      visualizacoesTotal: 3,
      totalVisualizacoes: 4,
      total_visualizacoes: 5,
      totalCurtidas: 6,
      curtidas: 7,
      likes: 8,
      totalLikes: 9,
      total_curtidas: 10,
      totalComentarios: 11,
      comentarios: 12,
      totalComments: 13,
      total_comentarios: 14,
      totalSalvos: 15,
      salvos: 16,
      total_salvos: 17,
      totalLidos: 18,
      lidos: 19,
      leituras: 20,
      total_lidos: 21,
      totalFavoritos: 22,
      favoritos: 23,
      total_favoritos: 24,
      totalConcluidas: 25,
      concluidas: 26,
    },
    0,
  );

  assert.equal(obra.id, " obra-1 ");
  assert.equal(obra.titulo, " Título original ");
  assert.equal(obra.autor, " Autor original ");
  assert.equal(obra.autorId, "autor-1");
  assert.equal(obra.genero, " Ação ");
  assert.equal(obra.formato, " HQ ");
  assert.equal(obra.classificacaoIndicativa, " 14+ ");
  assert.equal(obra.sinopse, " Sinopse ");
  assert.equal(obra.capa, " capa ");
  assert.equal(obra.capaNome, " capa.png ");
  assert.equal(obra.slug, " slug existente ");
  assert.equal(obra.link, " /obra/existente ");
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
    [1, 6, 11, 15, 18, 22, 25],
  );

  const aliasesFinais = normalizarObra(
    {
      total_visualizacoes: 1,
      total_curtidas: 2,
      total_comentarios: 3,
      total_salvos: 4,
      total_lidos: 5,
      total_favoritos: 6,
      total_concluidas: 7,
    },
    0,
  );

  assert.deepEqual(
    [
      aliasesFinais.visualizacoes,
      aliasesFinais.totalCurtidas,
      aliasesFinais.totalComentarios,
      aliasesFinais.totalSalvos,
      aliasesFinais.totalLidos,
      aliasesFinais.totalFavoritos,
      aliasesFinais.totalConcluidas,
    ],
    [1, 2, 3, 4, 5, 6, 7],
  );
});

test("Editar Capítulo delega somente a normalização local de obra ao módulo extraído", () => {
  assert.match(
    pageSource,
    /import \{ normalizarObra \} from "\.\/lib\/editar-capitulo-work-normalizer";/,
  );
  assert.doesNotMatch(pageSource, /function normalizarObra\(/);
  assert.doesNotMatch(pageSource, /normalizarArquivoObra\(obra\.arquivoObra\)/);
  assert.doesNotMatch(pageSource, /normalizarCapitulo\(capitulo, capituloIndex\)/);
  assert.equal((pageSource.match(/normalizarObra\(/g) || []).length, 1);
  assert.match(
    localWorkStorageSource,
    /import \{ normalizarObra \} from "\.\/editar-capitulo-work-normalizer";/,
  );
  assert.equal((localWorkStorageSource.match(/normalizarObra\(/g) || []).length, 2);
  assert.match(
    workNormalizerSource,
    /import \{ criarSlugBase \} from "\.\.\/\.\.\/\.\.\/lib\/utils";/,
  );
  assert.match(
    workNormalizerSource,
    /import \{ normalizarCapitulo \} from "\.\/editar-capitulo-chapter-normalizer";/,
  );
  assert.match(
    workNormalizerSource,
    /import \{ normalizarArquivoObra \} from "\.\/editar-capitulo-file-normalization";/,
  );
  assert.match(
    workNormalizerSource,
    /normalizarNumeroEditarCapitulo\([\s\S]*?total_visualizacoes/,
  );
  assert.match(workNormalizerSource, /progressoLeitura: calcularProgressoLeitura\(capitulosNormalizados\)/);
  assert.match(
    workNormalizerSource,
    /obra\.capitulos\.map\(\(capitulo, capituloIndex\) =>\s*normalizarCapitulo\(capitulo, capituloIndex\)\s*\)/,
  );
  assert.doesNotMatch(workNormalizerSource, /supabase|localStorage|useState|useEffect|window|document/);
});
