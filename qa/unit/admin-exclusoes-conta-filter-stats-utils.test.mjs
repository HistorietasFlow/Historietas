import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const filterSource = readFileSync(
  new URL(
    "../../app/admin/exclusoes-conta/lib/admin-exclusoes-conta-filter-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const statsSource = readFileSync(
  new URL(
    "../../app/admin/exclusoes-conta/lib/admin-exclusoes-conta-stats-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/admin/exclusoes-conta/page.tsx", import.meta.url),
  "utf8",
);

const filterExecutableSource = filterSource
  .replace(
    'import { normalizarTexto } from "../../../../lib/utils";',
    [
      'const normalizarTexto = (texto) => String(texto ?? "")',
      '  .normalize("NFD")',
      '  .replace(/[\\u0300-\\u036f]/g, "")',
      '  .toLowerCase();',
    ].join("\n"),
  )
  .replace(
    /import \{[\s\S]*?\} from "\.\/admin-exclusoes-conta-text-utils";/,
    `const STATUS_LABEL = {
  pendente: { pt: "Pendente", en: "Pending", es: "Pendiente" },
  verificando: { pt: "Verificando identidade", en: "Verifying identity", es: "Verificando identidad" },
  concluida: { pt: "Concluída", en: "Completed", es: "Completada" },
  recusada: { pt: "Recusada", en: "Rejected", es: "Rechazada" },
  cancelada: { pt: "Cancelada", en: "Canceled", es: "Cancelada" },
};
const traduzir = (texto, idioma) => {
  if (idioma === "en") return texto.en;
  if (idioma === "es") return texto.es;
  return texto.pt;
};
const origemTraduzida = (origem, idioma) => {
  const labels = {
    pagina_publica: { pt: "Página pública", en: "Public page", es: "Página pública" },
    suporte: { pt: "Suporte", en: "Support", es: "Soporte" },
    administracao: { pt: "Administração", en: "Administration", es: "Administración" },
  };
  return labels[origem] ? traduzir(labels[origem], idioma) : origem || "—";
};`,
  );

const carregarModulo = async (source) => {
  const javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;

  return import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
  );
};

const { filtrarSolicitacoesExclusao } = await carregarModulo(
  filterExecutableSource,
);
const { calcularTotaisSolicitacoesExclusao } = await carregarModulo(statsSource);

function criarSolicitacao(id, overrides = {}) {
  return {
    id,
    email: `${id}@historietas.local`,
    motivo: "Motivo padrão",
    origem: "pagina_publica",
    status: "pendente",
    userAgent: "Navegador padrão",
    criadaEm: "",
    atualizadaEm: "",
    processadaEm: "",
    observacaoInterna: "Observação padrão",
    ...overrides,
  };
}

function filtrar(parametros = {}) {
  return filtrarSolicitacoesExclusao({
    solicitacoes: [],
    busca: "",
    statusFiltro: "todos",
    language: "pt-BR",
    ...parametros,
  });
}

test('filtro "todos", cada status e busca vazia preservam os registros esperados', () => {
  const solicitacoes = [
    criarSolicitacao("pendente", { status: "pendente" }),
    criarSolicitacao("verificando", { status: "verificando" }),
    criarSolicitacao("concluida", { status: "concluida" }),
    criarSolicitacao("recusada", { status: "recusada" }),
    criarSolicitacao("cancelada", { status: "cancelada" }),
  ];

  assert.deepEqual(filtrar({ solicitacoes }), solicitacoes);
  for (const statusFiltro of [
    "pendente",
    "verificando",
    "concluida",
    "recusada",
    "cancelada",
  ]) {
    assert.deepEqual(
      filtrar({ solicitacoes, statusFiltro }).map((item) => item.id),
      [statusFiltro],
    );
  }
  assert.deepEqual(
    filtrar({ solicitacoes, statusFiltro: "verificando", busca: "" }),
    [solicitacoes[1]],
  );
});

test("filtro busca todos os campos e preserva normalização", () => {
  const solicitacao = criarSolicitacao("buscavel", {
    email: "leitora@example.com",
    motivo: "Pedido por privacidade",
    origem: "origem personalizada",
    status: "verificando",
    userAgent: "Navegador Móvel",
    observacaoInterna: "Revisão necessária",
  });
  const buscas = [
    "leitora@example.com",
    "privacidade",
    "origem personalizada",
    "verificando",
    "navegador movel",
    "revisao necessaria",
  ];

  for (const busca of buscas) {
    assert.deepEqual(filtrar({ solicitacoes: [solicitacao], busca }), [solicitacao]);
  }
  assert.deepEqual(
    filtrar({
      solicitacoes: [criarSolicitacao("origem", { origem: "pagina_publica" })],
      busca: "public page",
      language: "en",
    }).map((item) => item.id),
    ["origem"],
  );
  assert.deepEqual(
    filtrar({
      solicitacoes: [criarSolicitacao("status", { status: "pendente" })],
      busca: "pendiente",
      language: "es",
    }).map((item) => item.id),
    ["status"],
  );
  assert.deepEqual(
    filtrar({
      solicitacoes: [criarSolicitacao("pt", { origem: "pagina_publica" })],
      busca: "pagina publica",
      language: "pt-BR",
    }).map((item) => item.id),
    ["pt"],
  );
});

test("filtros e totais não mutam suas entradas", () => {
  const solicitacoes = [
    criarSolicitacao("pendente", { status: "pendente" }),
    criarSolicitacao("verificando", { status: "verificando" }),
    criarSolicitacao("concluida", { status: "concluida" }),
    criarSolicitacao("recusada", { status: "recusada" }),
    criarSolicitacao("cancelada", { status: "cancelada" }),
  ];
  const antes = structuredClone(solicitacoes);

  assert.deepEqual(calcularTotaisSolicitacoesExclusao(solicitacoes), {
    total: 5,
    pendentes: 1,
    verificando: 1,
    concluidas: 1,
    encerradas: 2,
  });
  assert.deepEqual(calcularTotaisSolicitacoesExclusao([]), {
    total: 0,
    pendentes: 0,
    verificando: 0,
    concluidas: 0,
    encerradas: 0,
  });
  filtrar({ solicitacoes, busca: "pendente" });
  assert.deepEqual(solicitacoes, antes);
});

test("Admin Exclusões de Conta delega filtro e totais aos helpers puros", () => {
  assert.match(
    pageSource,
    /from "\.\/lib\/admin-exclusoes-conta-filter-utils";/,
  );
  assert.match(
    pageSource,
    /from "\.\/lib\/admin-exclusoes-conta-stats-utils";/,
  );
  const memoSection = pageSource.slice(
    pageSource.indexOf("const solicitacoesFiltradas = useMemo"),
    pageSource.indexOf("async function salvarSolicitacao"),
  );
  assert.match(memoSection, /filtrarSolicitacoesExclusao\(\{/);
  assert.match(memoSection, /calcularTotaisSolicitacoesExclusao\(solicitacoes\)/);
  assert.doesNotMatch(memoSection, /normalizarTexto\(/);
  assert.doesNotMatch(memoSection, /solicitacoes\.filter\(/);
  assert.match(
    pageSource,
    /from "\.\/lib\/admin-exclusoes-conta-route-utils";/,
  );

  for (const source of [filterSource, statsSource]) {
    assert.doesNotMatch(
      source,
      /useState|useEffect|useMemo|useCallback|fetch\(|supabase|router|localStorage|sessionStorage|<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/i,
    );
  }
});
