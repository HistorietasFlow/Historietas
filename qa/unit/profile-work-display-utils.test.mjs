import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/perfil-autor/lib/profile-work-display-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

globalThis.__profileWorkDisplayDependencies = {
  ehClassificacao18(valor) {
    return valor === "18+";
  },
  criarSlugBase(valor) {
    return String(valor).trim().toLowerCase().replace(/\s+/g, "-");
  },
  normalizarTexto(valor) {
    return String(valor).trim().toLowerCase();
  },
  TOP_FIVE_MAXIMO: 5,
  mesclarObrasPorIdSlug(principais, extras) {
    const mapa = new Map();
    for (const obra of [...principais, ...extras]) {
      const chave = obra.id || obra.slug || obra.titulo;
      if (!mapa.has(chave)) mapa.set(chave, obra);
    }
    return [...mapa.values()];
  },
  obterTotalComentariosObraPerfilAutor(obra, totais) {
    return totais?.comentariosPorObra?.[obra.id] ?? obra.__comentarios ?? 0;
  },
  obterTotalConcluidasObraPerfilAutor(obra, totais) {
    return totais?.concluidasPorObra?.[obra.id] || 0;
  },
  obterTotalCurtidasObraPerfilAutor(obra, totais) {
    return totais?.curtidasPorObra?.[obra.id] ?? obra.__curtidas ?? 0;
  },
  obterTotalSalvosObraPerfilAutor(obra, totais) {
    return totais?.salvosPorObra?.[obra.id] ?? obra.__salvos ?? 0;
  },
  colecaoTemObraPerfilBiblioteca(colecao, obra) {
    return colecao.includes(obra.id) || colecao.includes(obra.slug);
  },
  encontrarObraPorIdentificadorTopFivePerfil(obras, identificador) {
    return (
      obras.find(
        (obra) =>
          obra.id === identificador ||
          obra.slug === identificador ||
          String(obra.titulo).trim().toLowerCase() ===
            String(identificador).trim().toLowerCase(),
      ) || null
    );
  },
  compactarNumeroPerfilAutor(valor) {
    return `fmt:${Math.max(0, Math.round(Number(valor) || 0))}`;
  },
  formatarFormatoPerfilAutor(valor) {
    const limpo = String(valor || "").trim();
    return limpo === "Não informado" ? "" : limpo;
  },
  formatarGeneroPerfilAutor(valor) {
    return String(valor || "").trim() || "Não informado";
  },
  obterTagPrincipalPerfilAutor(obra) {
    return Array.isArray(obra.tags) ? obra.tags[0] || "" : "";
  },
  obterTimestampData(valor) {
    const timestamp = Date.parse(valor);
    return Number.isNaN(timestamp) ? 0 : timestamp;
  },
  mostrarClassificacao(obra) {
    return obra.classificacaoIndicativa !== "Não informado";
  },
};

const javascript = typescript.transpileModule(
  source
    .replace(
      'import { ehClassificacao18 } from "../../../lib/historietasAdultContent";',
      "const { ehClassificacao18 } = globalThis.__profileWorkDisplayDependencies;",
    )
    .replace(
      'import { criarSlugBase, normalizarTexto } from "../../../lib/utils";',
      "const { criarSlugBase, normalizarTexto } = globalThis.__profileWorkDisplayDependencies;",
    )
    .replace(
      'import { TOP_FIVE_MAXIMO } from "../constants";',
      "const { TOP_FIVE_MAXIMO } = globalThis.__profileWorkDisplayDependencies;",
    )
    .replace(
      /import \{[\s\S]*?mesclarObrasPorIdSlug,[\s\S]*?obterTotalComentariosObraPerfilAutor,[\s\S]*?obterTotalConcluidasObraPerfilAutor,[\s\S]*?obterTotalCurtidasObraPerfilAutor,[\s\S]*?obterTotalSalvosObraPerfilAutor,[\s\S]*?\} from "\.\/data-normalizers";/,
      [
        "const {",
        "  mesclarObrasPorIdSlug,",
        "  obterTotalComentariosObraPerfilAutor,",
        "  obterTotalConcluidasObraPerfilAutor,",
        "  obterTotalCurtidasObraPerfilAutor,",
        "  obterTotalSalvosObraPerfilAutor,",
        "} = globalThis.__profileWorkDisplayDependencies;",
      ].join("\n"),
    )
    .replace(
      /import \{[\s\S]*?colecaoTemObraPerfilBiblioteca,[\s\S]*?encontrarObraPorIdentificadorTopFivePerfil,[\s\S]*?\} from "\.\/library-normalizers";/,
      "const { colecaoTemObraPerfilBiblioteca, encontrarObraPorIdentificadorTopFivePerfil } = globalThis.__profileWorkDisplayDependencies;",
    )
    .replace(
      /import \{[\s\S]*?compactarNumeroPerfilAutor,[\s\S]*?formatarFormatoPerfilAutor,[\s\S]*?formatarGeneroPerfilAutor,[\s\S]*?obterTagPrincipalPerfilAutor,[\s\S]*?obterTimestampData,[\s\S]*?\} from "\.\/profile-formatters";/,
      [
        "const {",
        "  compactarNumeroPerfilAutor,",
        "  formatarFormatoPerfilAutor,",
        "  formatarGeneroPerfilAutor,",
        "  obterTagPrincipalPerfilAutor,",
        "  obterTimestampData,",
        "} = globalThis.__profileWorkDisplayDependencies;",
      ].join("\n"),
    )
    .replace(
      'import { mostrarClassificacao } from "./work-normalizers";',
      "const { mostrarClassificacao } = globalThis.__profileWorkDisplayDependencies;",
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;

const {
  formatarMetaSheetObraPerfilAutor,
  formatarMetricasSheetObraPerfilAutor,
  obterEstadoColecoesObraPerfilAutor,
  obterHrefObraPerfilAutor,
  obterMetricasResumoObraPerfilAutor,
  obterMetricasSheetObraPerfilAutor,
  obterObraMenuAbertaPerfilAutor,
  obterObrasVisiveisPerfilAutor,
  obterObrasDestaquePerfilAutor,
  obterTotalObrasConcluidasPerfilAutor,
  obterVisibilidadeDestaquesPerfilAutor,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

function obra(id, {
  titulo = id,
  slug = id,
  classificacaoIndicativa = "Livre",
  criadaEm = "2026-01-01T00:00:00.000Z",
} = {}) {
  return {
    id,
    titulo,
    slug,
    classificacaoIndicativa,
    criadaEm,
  };
}

function perfil(obras) {
  return {
    autorId: "autor-1",
    nome: "Ana",
    obras,
    totalCapitulos: 0,
    totalCurtidas: 0,
    totalComentarios: 0,
    totalPublicadas: obras.length,
  };
}

test("visitante não vê 18+ e recebe obras da mais recente para a mais antiga", () => {
  const antiga = obra("antiga", { criadaEm: "2025-01-01T00:00:00.000Z" });
  const adulta = obra("adulta", {
    classificacaoIndicativa: "18+",
    criadaEm: "2027-01-01T00:00:00.000Z",
  });
  const nova = obra("nova", { criadaEm: "2026-06-01T00:00:00.000Z" });

  assert.deepEqual(
    obterObrasVisiveisPerfilAutor({
      perfilParaMostrar: perfil([antiga, adulta, nova]),
      perfilPertenceAoUsuario: false,
    }).map((item) => item.id),
    ["nova", "antiga"],
  );
});

test("perfil próprio preserva obras 18+ e ordenação", () => {
  const adulta = obra("adulta", {
    classificacaoIndicativa: "18+",
    criadaEm: "2027-01-01T00:00:00.000Z",
  });
  const comum = obra("comum", { criadaEm: "2026-01-01T00:00:00.000Z" });

  assert.deepEqual(
    obterObrasVisiveisPerfilAutor({
      perfilParaMostrar: perfil([comum, adulta]),
      perfilPertenceAoUsuario: true,
    }).map((item) => item.id),
    ["adulta", "comum"],
  );
});

test("sem perfil retorna lista vazia", () => {
  assert.deepEqual(
    obterObrasVisiveisPerfilAutor({
      perfilParaMostrar: null,
      perfilPertenceAoUsuario: false,
    }),
    [],
  );
});

test("TOP 5 preserva ordem selecionada, deduplica e filtra 18+ para visitante", () => {
  const a = obra("a");
  const b = obra("b");
  const adulta = obra("adulta", { classificacaoIndicativa: "18+" });

  const resultado = obterObrasDestaquePerfilAutor({
    topFiveObraIds: ["b", "adulta", "a", "b"],
    obras: [a, b, adulta],
    obrasPerfil: [],
    perfilPertenceAoUsuario: false,
  });

  assert.deepEqual(resultado.map((item) => item.id), ["b", "a"]);
});

test("TOP 5 limita a cinco obras e permite 18+ para o próprio perfil", () => {
  const obras = [
    obra("1", { classificacaoIndicativa: "18+" }),
    obra("2"),
    obra("3"),
    obra("4"),
    obra("5"),
    obra("6"),
  ];

  const resultado = obterObrasDestaquePerfilAutor({
    topFiveObraIds: ["1", "2", "3", "4", "5", "6"],
    obras,
    obrasPerfil: [],
    perfilPertenceAoUsuario: true,
  });

  assert.deepEqual(resultado.map((item) => item.id), ["1", "2", "3", "4", "5"]);
});

test("TOP 5 vazio retorna lista vazia sem depender das obras carregadas", () => {
  assert.deepEqual(
    obterObrasDestaquePerfilAutor({
      topFiveObraIds: [],
      obras: [obra("a")],
      obrasPerfil: [obra("b")],
      perfilPertenceAoUsuario: false,
    }),
    [],
  );
});


test("total de concluídas combina fonte remota e fallback local sem duplicar a mesma obra", () => {
  const obraA = obra("a");
  const obraB = obra("b");
  const obraC = obra("c");

  const total = obterTotalObrasConcluidasPerfilAutor({
    perfilParaMostrar: perfil([obraA, obraB, obraC]),
    totaisInteracoesObras: {
      concluidasPorObra: {
        a: 3,
        b: 0,
        c: 2,
      },
    },
    obrasConcluidas: ["b", "c"],
  });

  assert.equal(total, 6);
});

test("total de concluídas retorna zero sem perfil", () => {
  assert.equal(
    obterTotalObrasConcluidasPerfilAutor({
      perfilParaMostrar: null,
      totaisInteracoesObras: { concluidasPorObra: { a: 9 } },
      obrasConcluidas: ["a"],
    }),
    0,
  );
});


test("seleção da obra com menu aberto usa ID exato e retorna null sem seleção", () => {
  const obraA = obra("a");
  const obraB = obra("b");
  const obras = [obraA, obraB];

  assert.equal(obterObraMenuAbertaPerfilAutor(obras, ""), null);
  assert.equal(obterObraMenuAbertaPerfilAutor(obras, "b"), obraB);
  assert.equal(obterObraMenuAbertaPerfilAutor(obras, "inexistente"), null);
});


test("visibilidade dos destaques preserva regras de autor e visitante", () => {
  assert.deepEqual(
    obterVisibilidadeDestaquesPerfilAutor({
      obrasPerfilVisivel: true,
      podeEditarPerfil: true,
      mostrarDestaquesAutor: false,
      mostrarDestaquesVisitante: true,
      totalObrasEmDestaque: 3,
    }),
    {
      destaquesPerfilVisivel: false,
      exibirSecaoDestaques: false,
    },
  );

  assert.deepEqual(
    obterVisibilidadeDestaquesPerfilAutor({
      obrasPerfilVisivel: true,
      podeEditarPerfil: false,
      mostrarDestaquesAutor: false,
      mostrarDestaquesVisitante: true,
      totalObrasEmDestaque: 0,
    }),
    {
      destaquesPerfilVisivel: true,
      exibirSecaoDestaques: true,
    },
  );
});

test("seção de destaques depende da aba Obras e do conteúdo/configuração disponível", () => {
  assert.deepEqual(
    obterVisibilidadeDestaquesPerfilAutor({
      obrasPerfilVisivel: false,
      podeEditarPerfil: true,
      mostrarDestaquesAutor: true,
      mostrarDestaquesVisitante: false,
      totalObrasEmDestaque: 5,
    }),
    {
      destaquesPerfilVisivel: false,
      exibirSecaoDestaques: false,
    },
  );

  assert.deepEqual(
    obterVisibilidadeDestaquesPerfilAutor({
      obrasPerfilVisivel: true,
      podeEditarPerfil: true,
      mostrarDestaquesAutor: true,
      mostrarDestaquesVisitante: false,
      totalObrasEmDestaque: 0,
    }),
    {
      destaquesPerfilVisivel: true,
      exibirSecaoDestaques: true,
    },
  );

  assert.deepEqual(
    obterVisibilidadeDestaquesPerfilAutor({
      obrasPerfilVisivel: true,
      podeEditarPerfil: false,
      mostrarDestaquesAutor: true,
      mostrarDestaquesVisitante: false,
      totalObrasEmDestaque: 2,
    }),
    {
      destaquesPerfilVisivel: false,
      exibirSecaoDestaques: false,
    },
  );
});


test("página resolve obra com menu aberto sem useMemo", () => {
  assert.match(
    pagina,
    /const obraMenuAberta = obterObraMenuAbertaPerfilAutor\(/,
  );
  assert.doesNotMatch(
    pagina,
    /const obraMenuAberta = useMemo/,
  );
});


test("página resolve obras visíveis sem useMemo", () => {
  assert.match(
    pagina,
    /const obrasDoPerfilFiltradas = obterObrasVisiveisPerfilAutor\(\{/,
  );
  assert.doesNotMatch(
    pagina,
    /const obrasDoPerfilFiltradas = useMemo/,
  );
});


test("página resolve obras em destaque sem useMemo", () => {
  assert.match(
    pagina,
    /const obrasEmDestaque = obterObrasDestaquePerfilAutor\(\{/,
  );
  assert.doesNotMatch(
    pagina,
    /const obrasEmDestaque = useMemo/,
  );
});


test("href da obra prioriza link, depois slug e por fim título", () => {
  assert.equal(
    obterHrefObraPerfilAutor({
      link: "/obra/link-explicito",
      slug: "slug-ignorado",
      titulo: "Título Ignorado",
    }),
    "/obra/link-explicito",
  );
  assert.equal(
    obterHrefObraPerfilAutor({
      link: "",
      slug: "slug-da-obra",
      titulo: "Título Ignorado",
    }),
    "/obra/slug-da-obra",
  );
  assert.equal(
    obterHrefObraPerfilAutor({
      link: "",
      slug: "",
      titulo: "Minha Obra",
    }),
    "/obra/minha-obra",
  );
});

test("página reutiliza o helper de href das obras", () => {
  assert.match(
    pagina,
    /obterHrefObraPerfilAutor,[\s\S]*?from "\.\/lib\/profile-work-display-utils";/,
  );
  assert.equal(
    (pagina.match(/obterHrefObraPerfilAutor\(/g) || []).length,
    4,
  );
  assert.doesNotMatch(pagina, /criarSlugBase/);
});


test("métricas resumidas da obra centralizam curtidas, comentários e visualizações", () => {
  const resultado = obterMetricasResumoObraPerfilAutor(
    {
      id: "obra-metricas",
      visualizacoes: 1200.4,
      __curtidas: 3,
      __comentarios: 4,
    },
    {
      curtidasPorObra: { "obra-metricas": 7 },
      comentariosPorObra: { "obra-metricas": 9 },
    },
  );

  assert.deepEqual(resultado, {
    totalCurtidas: 7,
    totalComentarios: 9,
    visualizacoesFormatadas: "fmt:1200",
  });
});

test("métricas resumidas ficam diretas nos cards e são reutilizadas pelo helper do sheet", () => {
  assert.match(
    pagina,
    /obterMetricasResumoObraPerfilAutor,[\s\S]*?from "\.\/lib\/profile-work-display-utils";/,
  );
  assert.equal(
    (pagina.match(/obterMetricasResumoObraPerfilAutor\(/g) || []).length,
    2,
  );
  assert.match(
    source,
    /obterMetricasResumoObraPerfilAutor\(obra, totaisInteracoesObras\)/,
  );
  assert.doesNotMatch(pagina, /obterTotalCurtidasObraPerfilAutor/);
  assert.doesNotMatch(pagina, /obterTotalComentariosObraPerfilAutor/);
});


test("formata métricas do sheet da obra na ordem preservada", () => {
  assert.equal(
    formatarMetricasSheetObraPerfilAutor({
      visualizacoes: "1,2 mil",
      totalCurtidas: 7,
      totalComentarios: 4,
      totalSalvos: 3,
      totalCapitulos: 12,
    }),
    "👁 1,2 mil • ❤️ 7 • 💬 4 • 🔖 3 • 📚 12",
  );
});

test("página delega a formatação das métricas do sheet da obra", () => {
  assert.match(
    pagina,
    /formatarMetricasSheetObraPerfilAutor,[\s\S]*?from "\.\/lib\/profile-work-display-utils";/,
  );
  assert.equal(
    (pagina.match(/formatarMetricasSheetObraPerfilAutor\(/g) || []).length,
    1,
  );
  assert.doesNotMatch(
    pagina,
    /const metricasObraSheet = \[/,
  );
});


test("estado das coleções da obra preserva favoritos, concluídas e Quero ler", () => {
  const obraTeste = {
    id: "obra-estado",
    slug: "obra-estado",
    titulo: "Obra Estado",
  };

  assert.deepEqual(
    obterEstadoColecoesObraPerfilAutor({
      obra: obraTeste,
      obrasFavoritas: ["obra-estado"],
      obrasConcluidas: [],
      obrasSeguidasBiblioteca: ["outra", "obra-estado"],
    }),
    {
      obraFavorita: true,
      obraConcluida: false,
      obraNoQueroLer: true,
    },
  );
});

test("página reutiliza estado centralizado das coleções nos dois menus", () => {
  assert.match(
    pagina,
    /obterEstadoColecoesObraPerfilAutor,[\s\S]*?from "\.\/lib\/profile-work-display-utils";/,
  );
  assert.equal(
    (pagina.match(/obterEstadoColecoesObraPerfilAutor\(\{/g) || []).length,
    2,
  );
  assert.doesNotMatch(
    pagina,
    /colecaoTemObraPerfilBiblioteca/,
  );
});


test("formata meta do sheet da obra preservando ordem, filtros e tradução", () => {
  assert.equal(
    formatarMetaSheetObraPerfilAutor(
      {
        genero: "Fantasia",
        formato: "Mangá",
        tags: ["Aventura"],
        classificacaoIndicativa: "16",
      },
      (texto) => `T:${texto}`,
    ),
    "T:Fantasia • T:Mangá • T:Aventura • T:16",
  );

  assert.equal(
    formatarMetaSheetObraPerfilAutor(
      {
        genero: "Drama",
        formato: "Não informado",
        tags: [],
        classificacaoIndicativa: "Não informado",
      },
      (texto) => texto,
    ),
    "Drama",
  );
});

test("página delega a meta do sheet da obra", () => {
  assert.match(
    pagina,
    /formatarMetaSheetObraPerfilAutor,[\s\S]*?from "\.\/lib\/profile-work-display-utils";/,
  );
  assert.equal(
    (pagina.match(/formatarMetaSheetObraPerfilAutor\(/g) || []).length,
    1,
  );
  assert.doesNotMatch(pagina, /formatarFormatoPerfilAutor/);
  assert.doesNotMatch(pagina, /formatarGeneroPerfilAutor/);
  assert.doesNotMatch(pagina, /obterTagPrincipalPerfilAutor/);
  assert.doesNotMatch(pagina, /mostrarClassificacao/);
});


test("dados métricos do sheet incluem salvos e total de capítulos sem afetar cards", () => {
  const resultado = obterMetricasSheetObraPerfilAutor(
    {
      id: "obra-sheet",
      visualizacoes: 42,
      capitulos: [{ id: "c1" }, { id: "c2" }],
      __curtidas: 3,
      __comentarios: 4,
      __salvos: 5,
    },
    {
      curtidasPorObra: { "obra-sheet": 7 },
      comentariosPorObra: { "obra-sheet": 8 },
      salvosPorObra: { "obra-sheet": 9 },
    },
  );

  assert.deepEqual(resultado, {
    totalCurtidas: 7,
    totalComentarios: 8,
    totalSalvos: 9,
    visualizacoesFormatadas: "fmt:42",
    totalCapitulos: 2,
  });
});

test("página delega os dados métricos do sheet e não lê salvos diretamente", () => {
  assert.match(
    pagina,
    /obterMetricasSheetObraPerfilAutor,[\s\S]*?from "\.\/lib\/profile-work-display-utils";/,
  );
  assert.equal(
    (pagina.match(/obterMetricasSheetObraPerfilAutor\(/g) || []).length,
    1,
  );
  assert.doesNotMatch(pagina, /obterTotalSalvosObraPerfilAutor/);
});
