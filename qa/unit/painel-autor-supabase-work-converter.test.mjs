import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const loaderSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-supabase-data-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const converterSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-supabase-work-converter.ts",
    import.meta.url,
  ),
  "utf8",
);
const converterJavascript = typescript
  .transpileModule(
    converterSource
      .replace(
        'import { criarSlugBase } from "../../../lib/utils";',
        'const criarSlugBase = (texto) => texto.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\\s-]/g, "").replace(/\\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "") || "obra";',
      )
      .replace(
        'import { normalizarCategoriaArquivoSupabase } from "./painel-autor-file-category-utils";',
        'const normalizarCategoriaArquivoSupabase = (categoria, tipo) => categoria || (tipo?.startsWith("image/") ? "imagem" : "outro");',
      )
      .replace(
        'import { obterTimestamp } from "./painel-autor-format-utils";',
        'const obterTimestamp = (valor) => Date.parse(valor) || 0;',
      )
      .replace(
        'import { criarChaveInteracao } from "./painel-autor-interaction-utils";',
        'const criarChaveInteracao = (obraId, capituloId) => `${obraId}::${capituloId}`;',
      )
      .replace(
        'import { calcularProgressoLeitura } from "./painel-autor-reading-progress-utils";',
        'const calcularProgressoLeitura = (capitulos) => { const publicados = capitulos.filter((capitulo) => capitulo.publicado !== false); return publicados.length ? Math.round((publicados.filter((capitulo) => capitulo.lido).length / publicados.length) * 100) : 0; };',
      ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  )
  .outputText;
const { converterObraSupabaseParaLocalPainel } = await import(
  `data:text/javascript;base64,${Buffer.from(converterJavascript).toString("base64")}`,
);

test("converterObraSupabaseParaLocalPainel preserva precedência, progresso e capítulos locais", () => {
  const obra = converterObraSupabaseParaLocalPainel({
    obraBanco: {
      id: "obra-remota",
      user_id: "autor-remoto",
      titulo: " Obra remota ",
      autor: " Autor remoto ",
      genero: " Fantasia ",
      formato: " Livro ",
      classificacao_indicativa: " 16+ ",
      sinopse: " Sinopse remota ",
      tags: [" aventura ", ""],
      capa_url: " capa-remota ",
      capa_nome: " Capa remota ",
      arquivo_url: " arquivo-remoto ",
      arquivo_nome: " Arquivo remoto ",
      arquivo_tipo: "image/png",
      arquivo_tamanho: 24,
      arquivo_categoria: null,
      visualizacoes: -2.2,
      publicado: true,
      slug: " obra-remota ",
      link: " /obra/remota ",
      criada_em: "2026-01-01T00:00:00.000Z",
    },
    capitulosBanco: [
      {
        id: "capitulo-remoto",
        titulo: null,
        texto: null,
        publicado: true,
        criado_em: "2026-01-02T00:00:00.000Z",
      },
      {
        id: "capitulo-novo",
        titulo: "",
        texto: "texto remoto",
        publicado: false,
        criado_em: null,
      },
    ],
    obraLocal: {
      id: "obra-local",
      autorId: "autor-local",
      titulo: "Obra local",
      autor: "Autor local",
      genero: "Gênero local",
      formato: "Formato local",
      classificacaoIndicativa: "Livre",
      sinopse: "Sinopse local",
      tags: ["local"],
      capa: "capa-local",
      capaNome: "Capa local",
      arquivoObra: null,
      publicado: false,
      capitulos: [
        {
          id: "capitulo-remoto",
          titulo: "Capítulo local",
          texto: "texto local",
          curtiu: false,
          salvo: false,
          comentario: "comentário local",
          criadoEm: "local",
          lido: false,
          lidoEm: "",
        },
        {
          id: "capitulo-local",
          titulo: "Só local",
          texto: "texto local adicional",
          curtiu: false,
          salvo: false,
          comentario: "",
          criadoEm: "",
          lido: true,
          lidoEm: "2026-01-05T00:00:00.000Z",
        },
      ],
      criadaEm: "local",
      ultimoCapituloLidoId: "capitulo-local",
      ultimaLeituraEm: "2026-01-05T00:00:00.000Z",
      progressoLeitura: 0,
      visualizacoes: 4,
      slug: "obra-local",
      link: "/obra/local",
    },
    capitulosSalvos: new Set(["obra-remota::capitulo-remoto"]),
    capitulosCurtidos: new Set(["capitulo-remoto"]),
    progressoPorCapitulo: new Map([
      ["obra-remota::capitulo-remoto", "2026-01-04T00:00:00.000Z"],
      ["capitulo-novo", "2026-01-06T00:00:00.000Z"],
    ]),
    progressoCarregado: true,
    capitulosComMetricas: new Set(["capitulo-remoto", "capitulo-novo"]),
    comentariosCapitulos: new Map([
      ["obra-remota::capitulo-remoto", "comentário remoto"],
    ]),
    index: 8,
  });

  assert.equal(obra.id, "obra-remota");
  assert.equal(obra.autorId, "autor-remoto");
  assert.equal(obra.titulo, "Obra remota");
  assert.deepEqual(obra.tags, [" aventura "]);
  assert.equal(obra.arquivoObra?.categoria, "imagem");
  assert.equal(obra.visualizacoes, 0);
  assert.equal(obra.slug, "obra-remota");
  assert.equal(obra.link, "/obra/remota");
  assert.equal(obra.capitulos.length, 3);
  assert.deepEqual(obra.capitulos[0], {
    id: "capitulo-remoto",
    titulo: "Capítulo local",
    texto: "texto local",
    curtiu: true,
    salvo: true,
    comentario: "comentário remoto",
    criadoEm: "2026-01-02T00:00:00.000Z",
    lido: true,
    lidoEm: "2026-01-04T00:00:00.000Z",
    publicado: true,
  });
  assert.equal(obra.capitulos[1].titulo, "Capítulo 2");
  assert.equal(obra.capitulos[1].lido, true);
  assert.equal(obra.capitulos[1].lidoEm, "2026-01-06T00:00:00.000Z");
  assert.equal(obra.capitulos[2].id, "capitulo-local");
  assert.equal(obra.ultimoCapituloLidoId, "capitulo-novo");
  assert.equal(obra.ultimaLeituraEm, "2026-01-06T00:00:00.000Z");
  assert.equal(obra.progressoLeitura, 100);
});

test("converterObraSupabaseParaLocalPainel preserva fallbacks locais quando não há progresso remoto", () => {
  const obra = converterObraSupabaseParaLocalPainel({
    obraBanco: {
      id: "",
      user_id: null,
      titulo: null,
      autor: null,
      genero: null,
      formato: null,
      classificacao_indicativa: null,
      sinopse: null,
      tags: null,
      capa_url: null,
      capa_nome: null,
      arquivo_url: null,
      arquivo_nome: null,
      arquivo_tipo: null,
      arquivo_tamanho: null,
      arquivo_categoria: null,
      visualizacoes: null,
      publicado: null,
      slug: null,
      link: null,
      criada_em: null,
    },
    capitulosBanco: [],
    capitulosSalvos: new Set(),
    capitulosCurtidos: new Set(),
    progressoPorCapitulo: new Map(),
    progressoCarregado: false,
    capitulosComMetricas: new Set(),
    comentariosCapitulos: new Map(),
    index: 1,
  });

  assert.equal(obra.id, "obra-2");
  assert.equal(obra.titulo, "Obra sem título");
  assert.equal(obra.autor, "Autor não informado");
  assert.equal(obra.genero, "Não informado");
  assert.equal(obra.classificacaoIndicativa, "Não informada");
  assert.equal(obra.sinopse, "Nenhuma sinopse informada.");
  assert.deepEqual(obra.tags, ["sem tags"]);
  assert.equal(obra.slug, "obra-sem-titulo");
  assert.equal(obra.link, "/obra/obra-sem-titulo");
});

test("Painel do Autor delega a conversão Supabase ao módulo puro extraído", () => {
  assert.match(
    loaderSource,
    /import \{ converterObraSupabaseParaLocalPainel \} from "\.\/painel-autor-supabase-work-converter";/,
  );
  assert.doesNotMatch(loaderSource, /function converterObraSupabaseParaLocalPainel\(/);
  assert.match(
    loaderSource,
    /const obraNormalizada = converterObraSupabaseParaLocalPainel\(\{/,
  );
  assert.match(pagina, /carregarPainelAutorSupabase\(/);
  assert.match(converterSource, /function aplicarProgressoCapitulo\(/);
  assert.match(converterSource, /progressoCarregado && capitulosComMetricas\.has\(capitulo\.id\)/);
  assert.match(converterSource, /progressoPorCapitulo\.has\(chaveInteracao\)[\s\S]*?progressoPorCapitulo\.has\(capitulo\.id\)/);
  assert.match(converterSource, /normalizarCategoriaArquivoSupabase\(/);
  assert.match(converterSource, /calcularProgressoLeitura\(capitulosMesclados\)/);
  assert.doesNotMatch(
    converterSource,
    /\.from\(|\.select\(|localStorage|useState|useEffect|window\.|document\./,
  );
});
