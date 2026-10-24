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
    "../../app/editar-obra/lib/editar-obra-supabase-work-normalizer.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const utilsSource = readFileSync(new URL("../../lib/utils.ts", import.meta.url), "utf8");
const adultContentSource = readFileSync(
  new URL("../../lib/historietasAdultContent.ts", import.meta.url),
  "utf8",
);
const fileConverterSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-supabase-file-converter.ts",
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
const { criarArquivoObraDeSupabase } = await importarModulo(fileConverterSource);
const { calcularProgressoLeitura, normalizarContadorEdicaoObra } =
  await importarModulo(metricsSource);

globalThis.__editarObraCriarSlugBase = criarSlugBase;
globalThis.__editarObraNormalizarAvisosConteudo18 = normalizarAvisosConteudo18;
globalThis.__editarObraCriarArquivoObraDeSupabase = criarArquivoObraDeSupabase;
globalThis.__editarObraCalcularProgressoLeitura = calcularProgressoLeitura;
globalThis.__editarObraNormalizarContador = normalizarContadorEdicaoObra;

const sourceComDependencias = source
  .replace(
    'import { criarSlugBase } from "../../../lib/utils";',
    "const criarSlugBase = globalThis.__editarObraCriarSlugBase;",
  )
  .replace(
    /import \{\r?\n  normalizarAvisosConteudo18,\r?\n  type AvisoConteudo18,\r?\n\} from "\.\.\/\.\.\/\.\.\/lib\/historietasAdultContent";/,
    'type AvisoConteudo18 = "terror" | "outro_tema_adulto";\nconst normalizarAvisosConteudo18 = globalThis.__editarObraNormalizarAvisosConteudo18;',
  )
  .replace(
    'import { criarArquivoObraDeSupabase } from "./editar-obra-supabase-file-converter";',
    "const criarArquivoObraDeSupabase = globalThis.__editarObraCriarArquivoObraDeSupabase;",
  )
  .replace(
    /import \{\r?\n  calcularProgressoLeitura,\r?\n  normalizarContadorEdicaoObra,\r?\n\} from "\.\/editar-obra-metrics-utils";/,
    "const calcularProgressoLeitura = globalThis.__editarObraCalcularProgressoLeitura;\nconst normalizarContadorEdicaoObra = globalThis.__editarObraNormalizarContador;",
  );
const { normalizarObraSupabase } = await importarModulo(sourceComDependencias);

function obraSupabase(campos = {}) {
  return {
    id: "obra-remota",
    user_id: "autor-remoto",
    titulo: "Obra remota",
    autor: "Autor remoto",
    genero: "Fantasia",
    formato: "HQ",
    classificacao_indicativa: "18+",
    avisos_conteudo: ["terror"],
    sinopse: "Sinopse remota",
    tags: ["remota"],
    capa_url: "https://cdn/capa.png",
    capa_nome: "capa.png",
    arquivo_url: "https://cdn/obra.pdf",
    arquivo_nome: "obra.pdf",
    arquivo_tipo: "application/pdf",
    arquivo_tamanho: 20,
    arquivo_categoria: "documento",
    publicado: true,
    visualizacoes: 8,
    slug: "slug-remoto",
    link: "/obra/remota",
    criada_em: "2026-01-01",
    ...campos,
  };
}

function obraLocal(campos = {}) {
  return {
    id: "obra-local",
    titulo: "Obra local",
    autor: "Autor local",
    autorId: "autor-local",
    genero: "Drama",
    formato: "Romance",
    classificacaoIndicativa: "18+",
    avisosConteudo: ["outro_tema_adulto"],
    sinopse: "Sinopse local",
    tags: ["local"],
    capa: "capa-local",
    capaNome: "capa-local.png",
    arquivoObra: {
      nome: "local.txt",
      tipo: "text/plain",
      tamanho: 10,
      conteudo: "arquivo-local",
      categoria: "texto",
      criadoEm: "2025-01-01",
    },
    publicado: false,
    capitulos: [],
    criadaEm: "2025-01-01",
    ultimoCapituloLidoId: "cap-local",
    ultimaLeituraEm: "2025-02-01",
    progressoLeitura: 0,
    visualizacoes: 3,
    totalCurtidas: 7,
    totalComentarios: 6,
    totalSalvos: 5,
    totalLidos: 4,
    slug: "slug-local",
    link: "/obra/local",
    ...campos,
  };
}

test("normaliza obra Supabase completa preservando os dados remotos", () => {
  const obra = normalizarObraSupabase(
    obraSupabase(),
    [
      {
        id: "cap-1",
        titulo: "Capítulo remoto",
        texto: "texto remoto",
        publicado: true,
        criado_em: "2026-01-02",
      },
    ],
    obraLocal(),
    0,
  );

  assert.equal(obra.titulo, "Obra remota");
  assert.equal(obra.arquivoObra?.conteudo, "https://cdn/obra.pdf");
  assert.equal(obra.publicado, true);
  assert.equal(obra.slug, "slug-remoto");
  assert.equal(obra.link, "/obra/remota");
  assert.deepEqual(obra.avisosConteudo, ["terror"]);
  assert.deepEqual(
    [obra.visualizacoes, obra.totalCurtidas, obra.totalComentarios, obra.totalSalvos, obra.totalLidos],
    [8, 7, 6, 5, 4],
  );
});

test("preserva fallbacks locais, interações e a lista remota como fonte de verdade", () => {
  const local = obraLocal({
    capitulos: [
      {
        id: "cap-1",
        titulo: "Capítulo local",
        texto: "texto local",
        curtiu: true,
        salvo: true,
        comentario: "comentário local",
        criadoEm: "2025-01-02",
        lido: true,
        lidoEm: "2025-01-03",
      },
      {
        id: "cap-removido",
        titulo: "Não pode reaparecer",
        texto: "cache",
        curtiu: true,
        salvo: true,
        comentario: "cache",
        criadoEm: "2025-01-04",
        lido: true,
        lidoEm: "2025-01-05",
      },
    ],
    totalCurtidas: undefined,
    totalComentarios: undefined,
    totalSalvos: undefined,
    totalLidos: undefined,
  });
  const obra = normalizarObraSupabase(
    obraSupabase({
      titulo: null,
      tags: [],
      arquivo_url: "",
      arquivo_nome: "",
      publicado: null,
      visualizacoes: null,
      slug: null,
      link: null,
    }),
    [
      {
        id: "cap-1",
        titulo: null,
        texto: null,
        publicado: null,
        criado_em: null,
      },
    ],
    local,
    1,
  );

  assert.equal(obra.titulo, "Obra local");
  assert.deepEqual(obra.tags, ["local"]);
  assert.equal(obra.arquivoObra?.conteudo, "arquivo-local");
  assert.equal(obra.publicado, false);
  assert.equal(obra.slug, "slug-local");
  assert.equal(obra.link, "/obra/local");
  assert.equal(obra.capitulos.length, 1);
  assert.deepEqual(obra.capitulos[0], {
    id: "cap-1",
    titulo: "Capítulo local",
    texto: "texto local",
    curtiu: true,
    salvo: true,
    comentario: "comentário local",
    criadoEm: "2025-01-02",
    lido: true,
    lidoEm: "2025-01-03",
    publicado: true,
  });
  assert.deepEqual(
    [obra.visualizacoes, obra.totalCurtidas, obra.totalComentarios, obra.totalSalvos, obra.totalLidos],
    [3, 1, 1, 1, 1],
  );
});

test("preserva avisos com semântica de nullish coalescing e gera slug e link", () => {
  const local = obraLocal({ avisosConteudo: ["outro_tema_adulto"], slug: "", link: "" });
  const obraComAvisoNulo = normalizarObraSupabase(
    obraSupabase({
      titulo: "Título gerado",
      slug: "",
      link: "",
      avisos_conteudo: null,
      classificacao_indicativa: null,
    }),
    [],
    local,
    2,
  );
  const obraComAvisoVazio = normalizarObraSupabase(
    obraSupabase({
      avisos_conteudo: [],
      classificacao_indicativa: "18+",
    }),
    [],
    local,
    0,
  );

  assert.deepEqual(obraComAvisoNulo.avisosConteudo, ["outro_tema_adulto"]);
  assert.deepEqual(obraComAvisoVazio.avisosConteudo, ["outro_tema_adulto"]);
  assert.equal(obraComAvisoNulo.slug, "titulo-gerado");
  assert.equal(obraComAvisoNulo.link, "/obra/titulo-gerado");
});

test("mantém publicação false, arquivo local e fallbacks gerados sem obra local", () => {
  const obraComPublicacaoFalsa = normalizarObraSupabase(
    obraSupabase({ publicado: false, arquivo_url: "", arquivo_nome: "" }),
    [],
    obraLocal(),
    0,
  );
  const obraSemLocal = normalizarObraSupabase(
    obraSupabase({
      id: "",
      titulo: null,
      slug: null,
      link: null,
      arquivo_url: "",
      arquivo_nome: "",
    }),
    [],
    undefined,
    2,
  );

  assert.equal(obraComPublicacaoFalsa.publicado, false);
  assert.equal(obraComPublicacaoFalsa.arquivoObra?.nome, "local.txt");
  assert.equal(obraSemLocal.id, "obra-3");
  assert.equal(obraSemLocal.slug, "obra-sem-titulo");
  assert.equal(obraSemLocal.link, "/obra/obra-sem-titulo");
});

test("Editar Obra delega somente a normalização da obra Supabase", () => {
  assert.match(
    pageSource,
    /import \{ normalizarObraSupabase \} from "\.\/lib\/editar-obra-supabase-work-normalizer";/,
  );
  assert.doesNotMatch(pageSource, /function normalizarObraSupabase\(/);
  assert.match(pageSource, /normalizarObraSupabase\(\r?\n\s*obraSupabase,/);
  for (const contrato of [
    'import { criarSlugBase } from "../../../lib/utils";',
    'import { criarArquivoObraDeSupabase } from "./editar-obra-supabase-file-converter";',
    "normalizarAvisosConteudo18(",
    "obraSupabase.avisos_conteudo ?? obraLocal?.avisosConteudo",
    "calcularProgressoLeitura(capitulosMesclados)",
    "normalizarContadorEdicaoObra(",
  ]) {
    assert.ok(source.includes(contrato), `contrato ausente: ${contrato}`);
  }
  assert.doesNotMatch(source, /supabase\.from|localStorage|useState|useEffect|window\./);
});
