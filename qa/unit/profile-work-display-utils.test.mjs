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
const actionSheetsViewStateSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-action-sheets-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const highlightRendererSource = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-highlight-renderer.tsx",
    import.meta.url,
  ),
  "utf8",
);
const workItemRendererSource = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-work-item-renderer.tsx",
    import.meta.url,
  ),
  "utf8",
);
const libraryItemRendererSource = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-library-item-renderer.tsx",
    import.meta.url,
  ),
  "utf8",
);
const heroActionsSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-hero-actions.tsx",
    import.meta.url,
  ),
  "utf8",
);
const heroSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-hero.tsx",
    import.meta.url,
  ),
  "utf8",
);
const highlightsContentStateSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-highlights-content-state.tsx",
    import.meta.url,
  ),
  "utf8",
);
const highlightsPanelSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-highlights-panel.tsx",
    import.meta.url,
  ),
  "utf8",
);
const worksContentStateSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-works-content-state.tsx",
    import.meta.url,
  ),
  "utf8",
);
const worksPanelSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-works-panel.tsx",
    import.meta.url,
  ),
  "utf8",
);
const workGridItemSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-work-grid-item.tsx",
    import.meta.url,
  ),
  "utf8",
);
const workActionSheetSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-work-action-sheet.tsx",
    import.meta.url,
  ),
  "utf8",
);
const libraryActionSheetSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-library-action-sheet.tsx",
    import.meta.url,
  ),
  "utf8",
);
const actionSheetsSource = readFileSync(
  new URL(
    "../../app/perfil-autor/components/profile-action-sheets.tsx",
    import.meta.url,
  ),
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
  criarHrefLeituraCapituloPerfilAutor(obra, capitulo, numeroCapitulo) {
    return `/ler/${obra.id}/${capitulo.id}/${numeroCapitulo}`;
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
  encontrarCapituloParaContinuar(obra) {
    return obra.capitulos.find((capitulo) => capitulo.continuar) || null;
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
      /import \{[\s\S]*?compactarNumeroPerfilAutor,[\s\S]*?formatarFormatoPerfilAutor,[\s\S]*?criarHrefLeituraCapituloPerfilAutor,[\s\S]*?formatarGeneroPerfilAutor,[\s\S]*?obterTagPrincipalPerfilAutor,[\s\S]*?obterTimestampData,[\s\S]*?\} from "\.\/profile-formatters";/,
      [
        "const {",
        "  compactarNumeroPerfilAutor,",
        "  formatarFormatoPerfilAutor,",
        "  criarHrefLeituraCapituloPerfilAutor,",
        "  formatarGeneroPerfilAutor,",
        "  obterTagPrincipalPerfilAutor,",
        "  obterTimestampData,",
        "} = globalThis.__profileWorkDisplayDependencies;",
      ].join("\n"),
    )
    .replace(
      /import \{[\s\S]*?encontrarCapituloParaContinuar,[\s\S]*?mostrarClassificacao,[\s\S]*?\} from "\.\/work-normalizers";/,
      "const { encontrarCapituloParaContinuar, mostrarClassificacao } = globalThis.__profileWorkDisplayDependencies;",
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
  obterDadosCardBibliotecaPerfilAutor,
  obterDadosCardObraPerfilAutor,
  obterDadosCurtidaTopFivePerfilAutor,
  obterMensagemObrasVaziasPerfilAutor,
  obterMensagemTopFiveVazioPerfilAutor,
  obterDadosSheetBibliotecaPerfilAutor,
  obterDadosSheetObraPerfilAutor,
  obterRotulosAcoesColecoesObraPerfilAutor,
  obterEstadoColecoesObraPerfilAutor,
  obterHrefLeituraItemBibliotecaPerfilAutor,
  obterHrefObraPerfilAutor,
  obterMetricasResumoObraPerfilAutor,
  obterMetricasSheetObraPerfilAutor,
  obterAlvoLeituraMenuObraPerfilAutor,
  obterObraMenuAbertaPerfilAutor,
  obterObrasVisiveisPerfilAutor,
  obrasSemResultadosPerfilAutor,
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

test("estado vazio de Obras depende apenas da ausência de resultados", () => {
  assert.equal(obrasSemResultadosPerfilAutor([]), true);
  assert.equal(obrasSemResultadosPerfilAutor([obra("a")]), false);
});


test("página delega o estado vazio de Obras ao helper", () => {
  assert.match(
    pagina,
    /obrasSemResultadosPerfilAutor,[\s\S]*?from "\.\/lib\/profile-work-display-utils";/,
  );
  assert.equal(
    (pagina.match(/obrasSemResultadosPerfilAutor\(/g) || []).length,
    1,
  );
  assert.match(
    pagina,
    /import \{ ProfileWorksPanel \} from "\.\/components\/profile-works-panel";/,
  );
  assert.match(
    pagina,
    /<ProfileWorksPanel[\s\S]*?empty=\{obrasSemResultadosPerfilAutor\(obrasDoPerfilFiltradas\)\}[\s\S]*?emptyMessage=\{mensagemObrasVazias\}[\s\S]*?obras=\{obrasDoPerfilFiltradas\}[\s\S]*?renderObra=\{renderizarObraPerfilAutor\}/,
  );
  assert.match(
    worksPanelSource,
    /<ProfileWorksSection>[\s\S]*?<ProfileWorksContentState[\s\S]*?empty=\{empty\}[\s\S]*?emptyMessage=\{emptyMessage\}[\s\S]*?isDesktop=\{isDesktop\}[\s\S]*?obras=\{obras\}[\s\S]*?renderObra=\{renderObra\}/,
  );
  assert.doesNotMatch(
    pagina,
    /obrasDoPerfilFiltradas\.length === 0/,
  );
});


test("página deriva o total de obras uma única vez da coleção do perfil", () => {
  assert.match(
    pagina,
    /const totalObrasPerfil = obrasPerfil\.length;/,
  );
  assert.equal(
    (pagina.match(/\btotalObrasPerfil\b/g) || []).length,
    3,
  );
  assert.match(pagina, /totalObras: totalObrasPerfil/);
  assert.match(
    pagina,
    /import \{ ProfileAboutSection \} from "\.\/components\/profile-about-section";/,
  );
  assert.match(pagina, /<ProfileAboutSection[\s\S]*?totalObras=\{totalObrasPerfil\}/);
  assert.doesNotMatch(
    pagina,
    /perfilParaMostrar\.obras\.length/,
  );
});


test("mensagem de obras vazias preserva autor, visitante e filtro sem resultado", () => {
  assert.equal(
    obterMensagemObrasVaziasPerfilAutor({
      totalObras: 0,
      podeEditarPerfil: true,
    }),
    "Você ainda não publicou obras. Seu perfil continua ativo como leitor, com Diário e Comunidade.",
  );
  assert.equal(
    obterMensagemObrasVaziasPerfilAutor({
      totalObras: 0,
      podeEditarPerfil: false,
    }),
    "Este perfil ainda não publicou obras. O Diário e a Comunidade continuam disponíveis.",
  );
  assert.equal(
    obterMensagemObrasVaziasPerfilAutor({
      totalObras: 3,
      podeEditarPerfil: false,
    }),
    "Nenhuma obra encontrada.",
  );
});


test("página delega a mensagem de obras vazias ao helper", () => {
  assert.match(
    pagina,
    /obterMensagemObrasVaziasPerfilAutor,[\s\S]*?from "\.\/lib\/profile-work-display-utils";/,
  );
  assert.equal(
    (pagina.match(/obterMensagemObrasVaziasPerfilAutor\(\{/g) || []).length,
    1,
  );
  assert.match(
    worksContentStateSource,
    /if \(empty\) \{[\s\S]*?<ProfileSectionEmptyState message=\{emptyMessage\} \/>/,
  );
  assert.match(pagina, /emptyMessage=\{mensagemObrasVazias\}/);
  assert.doesNotMatch(
    pagina,
    /Você ainda não publicou obras\. Seu perfil continua ativo como leitor/,
  );
  assert.doesNotMatch(
    pagina,
    /Este perfil ainda não publicou obras\. O Diário e a Comunidade continuam disponíveis\./,
  );
});


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


test("página deriva o total e delega a existência de obras em destaque", () => {
  assert.match(
    pagina,
    /const totalObrasEmDestaque = obrasEmDestaque\.length;/,
  );
  assert.equal(
    (pagina.match(/obrasEmDestaque\.length/g) || []).length,
    1,
  );
  assert.match(
    pagina,
    /\{[\s\S]*?temObrasEmDestaque,[\s\S]*?exibirSecaoDestaques,[\s\S]*?\} = obterVisibilidadeDestaquesPerfilAutor\(\{/,
  );
  assert.doesNotMatch(
    pagina,
    /const temObrasEmDestaque = totalObrasEmDestaque > 0;/,
  );
  assert.equal(
    (pagina.match(/\btemObrasEmDestaque\b/g) || []).length,
    3,
  );
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
      temObrasEmDestaque: true,
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
      temObrasEmDestaque: false,
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
      temObrasEmDestaque: true,
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
      temObrasEmDestaque: false,
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
      temObrasEmDestaque: true,
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

test("página mantém as derivações e delega a composição dos destaques", () => {
  assert.match(
    pagina,
    /import \{ ProfileHighlightsPanel \} from "\.\/components\/profile-highlights-panel";/,
  );
  assert.match(
    highlightRendererSource,
    /function renderizarObraDestaquePerfilAutor\(obra: ObraLocal\) \{[\s\S]*?const obraHref = obterHrefObraPerfilAutor\(obra\);[\s\S]*?<ProfileHighlightItem[\s\S]*?key=\{`destaque-\$\{obra\.id\}`\}[\s\S]*?href=\{obraHref\}[\s\S]*?capaStyle=\{criarCapaDestaquePerfilAutor\(obra\.capa\)\}/,
  );
  assert.match(
    pagina,
    /import \{ usePerfilAutorHighlightRenderer \} from "\.\/hooks\/use-perfil-autor-highlight-renderer";/,
  );
  assert.match(
    pagina,
    /const \{ renderizarObraDestaquePerfilAutor \} =[\s\S]*?usePerfilAutorHighlightRenderer\(\);/,
  );
  assert.match(
    pagina,
    /\{exibirSecaoDestaques && \([\s\S]*?<ProfileHighlightsPanel[\s\S]*?headerActions=\{acoesCabecalhoTopFive\}[\s\S]*?message=\{mensagemTopFiveVazio\}[\s\S]*?obras=\{obrasEmDestaque\}[\s\S]*?renderObra=\{renderizarObraDestaquePerfilAutor\}[\s\S]*?temObras=\{temObrasEmDestaque\}[\s\S]*?titleActions=\{acoesTituloTopFive\}/,
  );
  assert.doesNotMatch(pagina, /obrasEmDestaque\.map/);
  assert.match(
    highlightsContentStateSource,
    /if \(!temObras\) \{[\s\S]*?<ProfileHighlightsEmptyState message=\{message\} \/>/,
  );
  assert.match(
    highlightsContentStateSource,
    /<ProfileHighlightsList isDesktop=\{isDesktop\}>[\s\S]*?\{obras\.map\(renderObra\)\}/,
  );
  assert.match(
    highlightsPanelSource,
    /<ProfileHighlightsSection isDesktop=\{isDesktop\}>[\s\S]*?<ProfileHighlightsHeader[\s\S]*?titleActions=\{titleActions\}[\s\S]*?headerActions=\{headerActions\}[\s\S]*?<ProfileHighlightsContentState[\s\S]*?renderObra=\{renderObra\}/,
  );
});


test("página deriva mostrar destaques do autor uma única vez", () => {
  assert.match(
    pagina,
    /const mostrarDestaquesAutor = perfilSalvoAutor\.mostrarDestaques;/,
  );
  assert.equal(
    (pagina.match(/perfilSalvoAutor\.mostrarDestaques/g) || []).length,
    1,
  );
  assert.match(
    pagina,
    /mostrarDestaquesAutor,/,
  );
  assert.match(
    pagina,
    /<ProfileHero[\s\S]*?mostrarDestaquesAutor=\{mostrarDestaquesAutor\}/,
  );
  assert.match(
    heroSource,
    /<ProfileHeroActions[\s\S]*?mostrarDestaquesAutor=\{mostrarDestaquesAutor\}/,
  );
  assert.match(
    heroActionsSource,
    /<ProfileOwnerActions[\s\S]*?mostrarDestaques=\{mostrarDestaquesAutor\}/,
  );
});


test("página deriva as ações do cabeçalho do TOP 5 antes do JSX", () => {
  assert.match(
    pagina,
    /const acoesTituloTopFive = podeEditarPerfil \? botaoCurtidaTopFive : null;/,
  );
  assert.match(
    pagina,
    /const acoesCabecalhoTopFive = podeEditarPerfil \? \([\s\S]*?<ProfileHighlightsEditLink href="\/perfil-autor\/top-5" \/>[\s\S]*?\) : \([\s\S]*?botaoCurtidaTopFive[\s\S]*?\);/,
  );
  assert.match(pagina, /titleActions=\{acoesTituloTopFive\}/);
  assert.match(pagina, /headerActions=\{acoesCabecalhoTopFive\}/);
  assert.doesNotMatch(
    pagina,
    /titleActions=\{[\s\S]{0,120}?podeEditarPerfil \? botaoCurtidaTopFive : null/,
  );
});


test("mensagem de TOP 5 vazio preserva textos de autor e visitante", () => {
  assert.equal(
    obterMensagemTopFiveVazioPerfilAutor({
      podeEditarPerfil: true,
      nomePerfil: "Ana",
    }),
    "Monte seu TOP 5 para destacar suas obras favoritas.",
  );
  assert.equal(
    obterMensagemTopFiveVazioPerfilAutor({
      podeEditarPerfil: false,
      nomePerfil: "Ana",
    }),
    "Ana nao montou top 5",
  );
});


test("página delega a mensagem de TOP 5 vazio ao helper", () => {
  assert.match(
    pagina,
    /obterMensagemTopFiveVazioPerfilAutor,[\s\S]*?from "\.\/lib\/profile-work-display-utils";/,
  );
  assert.equal(
    (pagina.match(/obterMensagemTopFiveVazioPerfilAutor\(\{/g) || []).length,
    1,
  );
  assert.match(pagina, /message=\{mensagemTopFiveVazio\}/);
  assert.doesNotMatch(
    pagina,
    /Monte seu TOP 5 para destacar suas obras favoritas\./,
  );
  assert.doesNotMatch(pagina, /nao montou top 5/);
});


test("dados de curtida do TOP 5 preservam ação, total e pluralização", () => {
  assert.deepEqual(
    obterDadosCurtidaTopFivePerfilAutor({
      curtido: false,
      totalCurtidas: 1,
    }),
    {
      totalFormatado: "fmt:1",
      ariaLabel: "Curtir TOP 5. fmt:1 curtida",
    },
  );

  assert.deepEqual(
    obterDadosCurtidaTopFivePerfilAutor({
      curtido: true,
      totalCurtidas: 12,
    }),
    {
      totalFormatado: "fmt:12",
      ariaLabel: "Remover curtida do TOP 5. fmt:12 curtidas",
    },
  );
});


test("página reutiliza os dados de curtida do TOP 5 no botão único", () => {
  assert.match(
    pagina,
    /obterDadosCurtidaTopFivePerfilAutor,[\s\S]*?from "\.\/lib\/profile-work-display-utils";/,
  );
  assert.equal(
    (pagina.match(/obterDadosCurtidaTopFivePerfilAutor\(\{/g) || []).length,
    1,
  );
  assert.equal(
    (pagina.match(/totalFormatado=\{dadosCurtidaTopFive\.totalFormatado\}/g) || [])
      .length,
    1,
  );
  assert.equal(
    (pagina.match(/ariaLabel=\{dadosCurtidaTopFive\.ariaLabel\}/g) || []).length,
    1,
  );
  assert.doesNotMatch(pagina, /Remover curtida do TOP 5/);
  assert.doesNotMatch(pagina, /topFiveCurtidasTotal === 1 \? "curtida" : "curtidas"/);
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

test("hrefs de obra ficam diretos no destaque e reutilizados pelos helpers", () => {
  assert.match(
    highlightRendererSource,
    /import \{ obterHrefObraPerfilAutor \} from "\.\.\/lib\/profile-work-display-utils";/,
  );
  assert.equal(
    (highlightRendererSource.match(/obterHrefObraPerfilAutor\(/g) || []).length,
    1,
  );
  assert.match(
    source,
    /const obraHref = obterHrefObraPerfilAutor\(item\.obra\);/,
  );
  assert.match(
    source,
    /obraHref: obterHrefObraPerfilAutor\(obra\),/,
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

test("métricas resumidas ficam encapsuladas nos helpers de exibição", () => {
  assert.doesNotMatch(
    pagina,
    /obterMetricasResumoObraPerfilAutor/,
  );
  assert.equal(
    (source.match(/obterMetricasResumoObraPerfilAutor\(obra, totaisInteracoesObras\)/g) || []).length,
    2,
  );
  assert.equal(
    (source.match(/obterMetricasResumoObraPerfilAutor\(\s*item\.obra,\s*totaisInteracoesObras,/g) || []).length,
    1,
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

test("formatação das métricas do sheet fica encapsulada no helper composto", () => {
  assert.doesNotMatch(pagina, /formatarMetricasSheetObraPerfilAutor/);
  assert.match(
    source,
    /export function obterDadosSheetObraPerfilAutor[\s\S]*?formatarMetricasSheetObraPerfilAutor\(\{/,
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

test("estado das coleções fica encapsulado nos sheets de obra e Biblioteca", () => {
  assert.doesNotMatch(
    pagina,
    /obterEstadoColecoesObraPerfilAutor/,
  );
  assert.match(
    source,
    /export function obterDadosSheetObraPerfilAutor[\s\S]*?obterEstadoColecoesObraPerfilAutor\(\{/,
  );
  assert.match(
    source,
    /export function obterDadosSheetBibliotecaPerfilAutor[\s\S]*?obterEstadoColecoesObraPerfilAutor\(\{/,
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

test("meta do sheet da obra fica encapsulada no helper composto", () => {
  assert.doesNotMatch(pagina, /formatarMetaSheetObraPerfilAutor/);
  assert.match(
    source,
    /export function obterDadosSheetObraPerfilAutor[\s\S]*?formatarMetaSheetObraPerfilAutor\(/,
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

test("dados métricos do sheet ficam encapsulados no helper composto", () => {
  assert.doesNotMatch(pagina, /obterMetricasSheetObraPerfilAutor/);
  assert.match(
    source,
    /export function obterDadosSheetObraPerfilAutor[\s\S]*?obterMetricasSheetObraPerfilAutor\(/,
  );
  assert.doesNotMatch(pagina, /obterTotalSalvosObraPerfilAutor/);
});


test("alvo de leitura do menu prioriza capítulo para continuar e preserva fallback final", () => {
  const comContinuacao = obterAlvoLeituraMenuObraPerfilAutor({
    id: "obra-leitura",
    capitulos: [
      { id: "c1" },
      { id: "c2", continuar: true },
      { id: "c3" },
    ],
  });

  assert.equal(comContinuacao.ultimoCapitulo.id, "c2");
  assert.equal(comContinuacao.temUltimoCapitulo, true);
  assert.equal(comContinuacao.numeroUltimoCapitulo, 2);
  assert.equal(comContinuacao.capituloHref, "/ler/obra-leitura/c2/2");

  const fallbackFinal = obterAlvoLeituraMenuObraPerfilAutor({
    id: "obra-fallback",
    capitulos: [{ id: "a" }, { id: "b" }],
  });

  assert.equal(fallbackFinal.ultimoCapitulo.id, "b");
  assert.equal(fallbackFinal.temUltimoCapitulo, true);
  assert.equal(fallbackFinal.numeroUltimoCapitulo, 2);
  assert.equal(fallbackFinal.capituloHref, "/ler/obra-fallback/b/2");

  assert.deepEqual(
    obterAlvoLeituraMenuObraPerfilAutor({
      id: "obra-vazia",
      capitulos: [],
    }),
    {
      ultimoCapitulo: null,
      numeroUltimoCapitulo: 0,
      temUltimoCapitulo: false,
      capituloHref: "",
    },
  );
});

test("alvo de leitura do menu fica encapsulado no helper composto", () => {
  assert.doesNotMatch(pagina, /obterAlvoLeituraMenuObraPerfilAutor/);
  assert.match(
    source,
    /export function obterDadosSheetObraPerfilAutor[\s\S]*?obterAlvoLeituraMenuObraPerfilAutor\(obra\)/,
  );
  assert.doesNotMatch(pagina, /encontrarCapituloParaContinuar/);
  assert.doesNotMatch(pagina, /numeroUltimoCapitulo/);
});


test("href de leitura da Biblioteca prioriza capítulo e faz fallback para a obra", () => {
  assert.equal(
    obterHrefLeituraItemBibliotecaPerfilAutor({
      obra: {
        id: "obra-biblioteca",
        link: "/obra/direta",
        slug: "obra-biblioteca",
        titulo: "Obra Biblioteca",
      },
      capitulo: { id: "cap-2" },
      numeroCapitulo: 2,
    }),
    "/ler/obra-biblioteca/cap-2/2",
  );

  assert.equal(
    obterHrefLeituraItemBibliotecaPerfilAutor({
      obra: {
        id: "obra-fallback",
        link: "",
        slug: "obra-fallback",
        titulo: "Obra Fallback",
      },
      capitulo: null,
      numeroCapitulo: 0,
    }),
    "/obra/obra-fallback",
  );
});

test("href de leitura da Biblioteca fica encapsulado no card e no sheet", () => {
  assert.doesNotMatch(
    pagina,
    /obterHrefLeituraItemBibliotecaPerfilAutor/,
  );
  assert.equal(
    (source.match(/obterHrefLeituraItemBibliotecaPerfilAutor\(item\)/g) || []).length,
    2,
  );
  assert.doesNotMatch(pagina, /criarHrefLeituraCapituloPerfilAutor/);
});


test("rótulos de acessibilidade das ações de obra ficam nos dados derivados", () => {
  assert.match(workItemRendererSource, /ariaLabelOpcoes=\{ariaLabelOpcoes\}/);
  assert.match(workGridItemSource, /ariaLabel=\{ariaLabelOpcoes\}/);
  assert.match(
    actionSheetsSource,
    /ariaLabel=\{dadosSheetObraPerfil\.ariaLabelSheetObra\}/,
  );
  assert.match(
    actionSheetsSource,
    /ariaLabel=\{dadosSheetBibliotecaPerfil\.ariaLabelSheetBiblioteca\}/,
  );
  assert.match(workActionSheetSource, /ariaLabel=\{ariaLabel\}/);
  assert.match(libraryActionSheetSource, /ariaLabel=\{ariaLabel\}/);
  assert.doesNotMatch(
    pagina,
    /ariaLabel=\{`Abrir opções de \$\{obra\.titulo\}`\}/,
  );
  assert.doesNotMatch(
    pagina,
    /ariaLabel=\{`Ações da obra \$\{obra\.titulo\}`\}/,
  );
  assert.doesNotMatch(
    pagina,
    /ariaLabel=\{`Ações da Biblioteca \$\{obra\.titulo\}`\}/,
  );
});


test("dados do card de obra centralizam href, métricas e estado do menu", () => {
  assert.deepEqual(
    obterDadosCardObraPerfilAutor(
      {
        id: "obra-card",
        link: "",
        slug: "obra-card",
        titulo: "Obra Card",
        visualizacoes: 125.4,
        __curtidas: 2,
        __comentarios: 3,
      },
      {
        curtidasPorObra: { "obra-card": 8 },
        comentariosPorObra: { "obra-card": 6 },
      },
      "obra-card",
    ),
    {
      obraHref: "/obra/obra-card",
      totalCurtidas: 8,
      totalComentarios: 6,
      visualizacoesFormatadas: "fmt:125",
      menuObraAberto: true,
      ariaLabelOpcoes: "Abrir opções de Obra Card",
    },
  );
});

test("página delega os dados derivados do card de obra", () => {
  assert.match(
    workItemRendererSource,
    /import \{ obterDadosCardObraPerfilAutor \} from "\.\.\/lib\/profile-work-display-utils";/,
  );
  assert.equal(
    (workItemRendererSource.match(/obterDadosCardObraPerfilAutor\(/g) || []).length,
    1,
  );
  assert.doesNotMatch(
    pagina,
    /const menuObraAberto = obraMenuAbertoId === obra\.id/,
  );
});


test("dados do card da Biblioteca centralizam href, métricas e estado do menu", () => {
  assert.deepEqual(
    obterDadosCardBibliotecaPerfilAutor(
      {
        chave: "biblioteca-obra",
        obra: {
          id: "obra-biblioteca-card",
          link: "",
          slug: "obra-biblioteca-card",
          titulo: "Obra Biblioteca Card",
          visualizacoes: 99.6,
          __curtidas: 2,
          __comentarios: 3,
        },
        capitulo: { id: "cap-3" },
        numeroCapitulo: 3,
      },
      {
        curtidasPorObra: { "obra-biblioteca-card": 4 },
        comentariosPorObra: { "obra-biblioteca-card": 5 },
      },
      "biblioteca-obra",
    ),
    {
      capituloHref: "/ler/obra-biblioteca-card/cap-3/3",
      totalCurtidas: 4,
      totalComentarios: 5,
      visualizacoesFormatadas: "fmt:100",
      menuAberto: true,
    },
  );
});

test("página delega os dados derivados do card da Biblioteca", () => {
  assert.match(
    libraryItemRendererSource,
    /import \{ obterDadosCardBibliotecaPerfilAutor \} from "\.\.\/lib\/profile-work-display-utils";/,
  );
  assert.equal(
    (libraryItemRendererSource.match(/obterDadosCardBibliotecaPerfilAutor\(/g) || [])
      .length,
    1,
  );
  assert.doesNotMatch(
    pagina,
    /bibliotecaMenuAbertoChave === item\.chave/,
  );
});


test("rótulos das coleções do sheet da obra preservam os estados", () => {
  assert.deepEqual(
    obterRotulosAcoesColecoesObraPerfilAutor({
      obraFavorita: false,
      obraConcluida: false,
    }),
    {
      rotuloFavorita: "Adicionar à lista",
      rotuloConcluida: "Concluir",
    },
  );

  assert.deepEqual(
    obterRotulosAcoesColecoesObraPerfilAutor({
      obraFavorita: true,
      obraConcluida: true,
    }),
    {
      rotuloFavorita: "Remover da lista",
      rotuloConcluida: "Marcar como não concluída",
    },
  );
});


test("dados do sheet da obra consolidam leitura, coleções, meta e métricas", () => {
  const resultado = obterDadosSheetObraPerfilAutor({
    obra: {
      id: "obra-sheet-completo",
      slug: "obra-sheet-completo",
      titulo: "Obra Sheet Completo",
      autor: "Ana",
      genero: "Fantasia",
      formato: "Mangá",
      tags: ["Aventura"],
      classificacaoIndicativa: "16",
      visualizacoes: 1500,
      capitulos: [
        { id: "c1" },
        { id: "c2", continuar: true },
      ],
    },
    totaisInteracoesObras: {
      curtidasPorObra: { "obra-sheet-completo": 12 },
      comentariosPorObra: { "obra-sheet-completo": 4 },
      salvosPorObra: { "obra-sheet-completo": 6 },
    },
    obrasFavoritas: ["obra-sheet-completo"],
    obrasConcluidas: [],
    obrasSeguidasBiblioteca: [],
    traduzirTexto: (texto) => `T:${texto}`,
  });

  assert.equal(resultado.ultimoCapitulo.id, "c2");
  assert.equal(resultado.temUltimoCapitulo, true);
  assert.equal(resultado.capituloHref, "/ler/obra-sheet-completo/c2/2");
  assert.equal(resultado.obraFavorita, true);
  assert.equal(resultado.obraConcluida, false);
  assert.equal(
    resultado.metaObraSheet,
    "T:Fantasia • T:Mangá • T:Aventura • T:16",
  );
  assert.equal(
    resultado.metricasObraSheet,
    "👁 fmt:1500 • ❤️ 12 • 💬 4 • 🔖 6 • 📚 2",
  );
  assert.equal(
    resultado.ariaLabelSheetObra,
    "Ações da obra Obra Sheet Completo",
  );
});

test("página reutiliza a visibilidade do alvo de leitura derivada pelo helper", () => {
  assert.match(
    actionSheetsSource,
    /exibirLeitura=\{dadosSheetObraPerfil\.temUltimoCapitulo\}/,
  );
  assert.match(
    workActionSheetSource,
    /\{exibirLeitura && \(/,
  );
  assert.doesNotMatch(
    pagina,
    /\{ultimoCapitulo && \(/,
  );
});


test("página delega a composição do sheet da obra ao helper único", () => {
  assert.match(
    pagina,
    /import \{ obterEstadoVisualActionSheetsPerfilAutor \} from "\.\/lib\/profile-action-sheets-view-state";/,
  );
  assert.equal(
    (actionSheetsViewStateSource.match(/obterDadosSheetObraPerfilAutor\(\{/g) || []).length,
    1,
  );
  for (const helper of [
    "formatarMetaSheetObraPerfilAutor",
    "formatarMetricasSheetObraPerfilAutor",
    "obterMetricasSheetObraPerfilAutor",
    "obterAlvoLeituraMenuObraPerfilAutor",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(helper));
  }
});

test("action sheets preservam composição, ordem e callbacks na fronteira da página", () => {
  assert.match(
    pagina,
    /import \{ ProfileActionSheets \} from "\.\/components\/profile-action-sheets";/,
  );
  assert.doesNotMatch(pagina, /<ProfileWorkActionSheet/);
  assert.doesNotMatch(pagina, /<ProfileLibraryActionSheet/);
  assert.doesNotMatch(pagina, /\{obraMenuAberta &&\s*\(\(\) =>/);
  assert.doesNotMatch(pagina, /\{bibliotecaMenuAberto &&\s*\(\(\) =>/);
  assert.match(actionSheetsViewStateSource, /obterDadosSheetObraPerfilAutor\(\{/);
  assert.match(actionSheetsViewStateSource, /obterDadosSheetBibliotecaPerfilAutor\(\{/);
  assert.match(actionSheetsViewStateSource, /obterRotulosAcoesColecoesObraPerfilAutor\(\{/);
  assert.match(actionSheetsViewStateSource, /obterRotulosAcoesColecoesBibliotecaPerfil\(\{/);
  assert.match(
    pagina,
    /<ProfileActionSheets[\s\S]*?bibliotecaMenuAberto=\{bibliotecaMenuAberto\}[\s\S]*?dadosSheetBibliotecaPerfil=\{dadosSheetBibliotecaPerfil\}[\s\S]*?dadosSheetObraPerfil=\{dadosSheetObraPerfil\}[\s\S]*?obraMenuAberta=\{obraMenuAberta\}/,
  );
  assert.match(
    pagina,
    /onReportObra=\{\(\) =>[\s\S]*?abrirDenunciaConteudoPerfil\(/,
  );
  assert.match(pagina, /compartilharObraPerfilAutor\(obraMenuAberta!\)/);
  assert.match(pagina, /removerItemBibliotecaPerfil\(bibliotecaMenuAberto!\)/);
  assert.match(
    actionSheetsSource,
    /import \{ ProfileWorkActionSheet \} from "\.\/profile-work-action-sheet";/,
  );
  assert.match(
    actionSheetsSource,
    /import \{ ProfileLibraryActionSheet \} from "\.\/profile-library-action-sheet";/,
  );
  assert.match(
    actionSheetsSource,
    /\{obraMenuAberta && dadosSheetObraPerfil && rotulosSheetObraPerfil && \(/,
  );
  assert.match(
    actionSheetsSource,
    /\{bibliotecaMenuAberto &&[\s\S]*?dadosSheetBibliotecaPerfil &&[\s\S]*?rotulosSheetBibliotecaPerfil && \(/,
  );

  for (const source of [workActionSheetSource, libraryActionSheetSource]) {
    assert.match(source, /onClick=\{\(event\) => event\.stopPropagation\(\)\}/);
    assert.match(source, /<ProfileWorkActionSheetHandle \/>/);
    assert.match(source, /workActionSheetItemActiveStyle/);
    assert.match(source, /workActionSheetItemStyle/);
    assert.match(source, /criarProfileSelectionDotStyle/);
  }

  assert.match(workActionSheetSource, /workActionSheetDangerItemStyle/);
  assert.match(workActionSheetSource, /\{exibirAcoesVisitante && \(/);
  assert.match(workActionSheetSource, />\s*Ler\s*</);
  assert.match(workActionSheetSource, />\s*Denunciar obra\s*</);
  assert.match(workActionSheetSource, />\s*Compartilhar\s*</);
  assert.match(libraryActionSheetSource, />\s*Ler capítulo\s*</);
  assert.match(libraryActionSheetSource, /\{rotuloQueroLer\}/);
  assert.match(libraryActionSheetSource, /\{rotuloRemover\}/);
  assert.match(libraryActionSheetSource, />\s*Compartilhar\s*</);

  assert.ok(
    workActionSheetSource.indexOf("Ler") <
      workActionSheetSource.indexOf("{rotuloFavorita}") &&
      workActionSheetSource.indexOf("{rotuloFavorita}") <
        workActionSheetSource.indexOf("{rotuloConcluida}") &&
      workActionSheetSource.indexOf("{rotuloConcluida}") <
        workActionSheetSource.indexOf("Denunciar obra") &&
      workActionSheetSource.indexOf("Denunciar obra") <
        workActionSheetSource.lastIndexOf("Compartilhar"),
  );
  assert.ok(
    libraryActionSheetSource.indexOf("Ler capítulo") <
      libraryActionSheetSource.indexOf("{rotuloQueroLer}") &&
      libraryActionSheetSource.indexOf("{rotuloQueroLer}") <
        libraryActionSheetSource.indexOf("{rotuloFavorita}") &&
      libraryActionSheetSource.indexOf("{rotuloFavorita}") <
        libraryActionSheetSource.indexOf("{rotuloConcluida}") &&
      libraryActionSheetSource.indexOf("{rotuloConcluida}") <
        libraryActionSheetSource.indexOf("{rotuloRemover}") &&
      libraryActionSheetSource.indexOf("{rotuloRemover}") <
        libraryActionSheetSource.lastIndexOf("Compartilhar"),
  );
});


test("dados do sheet da Biblioteca centralizam href e estado das coleções", () => {
  assert.deepEqual(
    obterDadosSheetBibliotecaPerfilAutor({
      item: {
        chave: "sheet-biblioteca",
        obra: {
          id: "obra-sheet-biblioteca",
          link: "",
          slug: "obra-sheet-biblioteca",
          titulo: "Obra Sheet Biblioteca",
        },
        capitulo: { id: "cap-4" },
        numeroCapitulo: 4,
      },
      obrasFavoritas: ["obra-sheet-biblioteca"],
      obrasConcluidas: [],
      obrasSeguidasBiblioteca: ["obra-sheet-biblioteca"],
    }),
    {
      capituloHref: "/ler/obra-sheet-biblioteca/cap-4/4",
      obraFavorita: true,
      obraConcluida: false,
      obraNoQueroLer: true,
      ariaLabelSheetBiblioteca: "Ações da Biblioteca Obra Sheet Biblioteca",
    },
  );
});

test("página delega os dados do sheet da Biblioteca ao helper único", () => {
  assert.match(
    actionSheetsViewStateSource,
    /obterDadosSheetBibliotecaPerfilAutor,[\s\S]*?from "\.\/profile-work-display-utils";/,
  );
  assert.equal(
    (actionSheetsViewStateSource.match(/obterDadosSheetBibliotecaPerfilAutor\(\{/g) || []).length,
    1,
  );
  assert.doesNotMatch(pagina, /obterHrefLeituraItemBibliotecaPerfilAutor/);
  assert.doesNotMatch(pagina, /obterEstadoColecoesObraPerfilAutor/);
});

test("página reutiliza um único botão de curtida do TOP 5", () => {
  assert.equal(
    (pagina.match(/<ProfileHighlightsLikeButton/g) || []).length,
    1,
  );
  assert.match(
    pagina,
    /const botaoCurtidaTopFive = temObrasEmDestaque \? \([\s\S]*?<ProfileHighlightsLikeButton[\s\S]*?\) : null;/,
  );
  assert.match(
    pagina,
    /const acoesTituloTopFive = podeEditarPerfil \? botaoCurtidaTopFive : null;/,
  );
  assert.match(
    pagina,
    /const acoesCabecalhoTopFive = podeEditarPerfil \? \([\s\S]*?<ProfileHighlightsEditLink[\s\S]*?: \([\s\S]*?botaoCurtidaTopFive/,
  );
  assert.match(pagina, /titleActions=\{acoesTituloTopFive\}/);
  assert.match(pagina, /headerActions=\{acoesCabecalhoTopFive\}/);
});

test("ProfileWorksContentState preserva o estado vazio e a grade de Obras", () => {
  assert.match(
    worksContentStateSource,
    /if \(empty\) \{[\s\S]*?<ProfileSectionEmptyState message=\{emptyMessage\} \/>/,
  );
  assert.match(
    worksContentStateSource,
    /<ProfileWorksGrid isDesktop=\{isDesktop\}>[\s\S]*?\{obras\.map\(renderObra\)\}/,
  );
});

test("página mantém os dados e o callback do card antes de delegar a composição", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorWorkItemRenderer \} from "\.\/hooks\/use-perfil-autor-work-item-renderer";/,
  );
  assert.match(
    workItemRendererSource,
    /function renderizarObraPerfilAutor\(obra: ObraLocal\) \{[\s\S]*?obterDadosCardObraPerfilAutor\([\s\S]*?obra,[\s\S]*?totaisInteracoesObras,[\s\S]*?obraMenuAbertoId,[\s\S]*?\);/,
  );
  assert.match(
    workItemRendererSource,
    /criarCapaGridPerfilAutor\(obra\.capa, isDesktop\)/,
  );
  assert.match(
    workItemRendererSource,
    /setObraMenuAbertoId\(\(idAtual\) =>[\s\S]*?alternarIdentificadorMenuPerfilAutor\(idAtual, obra\.id\)/,
  );
  assert.match(
    pagina,
    /const \{ renderizarObraPerfilAutor \} = usePerfilAutorWorkItemRenderer\(\{[\s\S]*?isDesktop,[\s\S]*?obraMenuAbertoId,[\s\S]*?setObraMenuAbertoId,[\s\S]*?totaisInteracoesObras,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /\{obrasDoPerfilFiltradas\.map\(/);
});

test("ProfileWorkGridItem preserva capa, métricas e menu de opções", () => {
  assert.match(workGridItemSource, /<ProfileWorkCard>/);
  assert.match(workGridItemSource, /<ProfileWorkCoverLink href=\{href\}>/);
  assert.match(workGridItemSource, /<div style=\{capaStyle\}>/);
  assert.match(workGridItemSource, /<ProfileWorkCoverTitle>\{titulo\}<\/ProfileWorkCoverTitle>/);
  assert.match(workGridItemSource, /👁 \{visualizacoes\}/);
  assert.match(workGridItemSource, /<ProfileWorkCoverLikeIcon \/>\{" "\}[\s\S]*?\{totalCurtidas\}/);
  assert.match(workGridItemSource, /<ProfileWorkCoverCommentIcon \/>\{" "\}[\s\S]*?\{totalComentarios\}/);
  assert.match(
    workGridItemSource,
    /<ProfileWorkOptionsButton[\s\S]*?onClick=\{onToggleMenu\}[\s\S]*?ariaLabel=\{ariaLabelOpcoes\}[\s\S]*?expanded=\{menuAberto\}/,
  );
});
