import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const filtroUtils = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-filter-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);
const filtroUtilsExecutavel = filtroUtils
  .replace(
    'import { ehClassificacao18 } from "../../../lib/historietasAdultContent";',
    'const ehClassificacao18 = (classificacao) => classificacao.trim().startsWith("18");',
  )
  .replace(
    'import { formatarData, normalizarTexto } from "../../../lib/utils";',
    [
      "const formatarData = (data) => data;",
      'const normalizarTexto = (texto) => String(texto ?? "")',
      '  .normalize("NFD")',
      '  .replace(/[\\u0300-\\u036f]/g, "")',
      "  .toLowerCase();",
    ].join("\n"),
  );
const filtroUtilsJavascript = typescript.transpileModule(
  filtroUtilsExecutavel,
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const {
  filtrarEOrdenarNotificacoes,
  notificacaoEhCapitulo,
} = await import(
  `data:text/javascript;base64,${Buffer.from(filtroUtilsJavascript).toString("base64")}`,
);

function criarObra(id, overrides = {}) {
  return {
    id,
    titulo: `Obra ${id}`,
    autor: "Autora",
    genero: "Fantasia",
    formato: "Webtoon",
    classificacaoIndicativa: "12 anos",
    capitulos: [],
    ...overrides,
  };
}

function criarNotificacao(id, overrides = {}) {
  return {
    id,
    obraId: "obra-1",
    capituloId: "",
    link: `/notificacoes/${id}`,
    titulo: `Notificacao ${id}`,
    mensagem: `Mensagem ${id}`,
    tipo: "curtida-obra",
    lida: false,
    criadaEm: "2026-01-01T00:00:00.000Z",
    autorNome: "Leitora",
    ...overrides,
  };
}

function consultar({
  notificacoes,
  obras = [],
  termoBusca = "",
  filtro = "todas",
  ordenacao = "recentes",
  acessoConteudo18Liberado = false,
}) {
  return filtrarEOrdenarNotificacoes({
    notificacoes,
    obrasPorId: new Map(obras.map((obra) => [obra.id, obra])),
    termoBusca,
    filtro,
    ordenacao,
    acessoConteudo18Liberado,
  });
}

function ids(notificacoes) {
  return notificacoes.map((notificacao) => notificacao.id);
}

test("executa filtros todas, lidas, nao lidas, capitulos e comunidade", () => {
  const notificacoes = [
    criarNotificacao("nao-lida"),
    criarNotificacao("lida", { lida: true }),
    criarNotificacao("capitulo", { tipo: "novo-capitulo" }),
    criarNotificacao("comentario-capitulo", {
      tipo: "comentario-capitulo",
    }),
    criarNotificacao("comunidade", { tipo: "comentario-comunidade" }),
  ];
  const obras = [criarObra("obra-1")];

  assert.deepEqual(
    ids(
      consultar({
        notificacoes,
        obras,
        ordenacao: "antigas",
        acessoConteudo18Liberado: true,
      }),
    ).sort(),
    ids(notificacoes).sort(),
  );
  assert.deepEqual(
    ids(
      consultar({
        notificacoes,
        obras,
        filtro: "nao-lidas",
        ordenacao: "antigas",
        acessoConteudo18Liberado: true,
      }),
    ).sort(),
    ["capitulo", "comentario-capitulo", "comunidade", "nao-lida"],
  );
  assert.deepEqual(
    ids(
      consultar({
        notificacoes,
        obras,
        filtro: "lidas",
        acessoConteudo18Liberado: true,
      }),
    ),
    ["lida"],
  );
  assert.deepEqual(
    ids(
      consultar({
        notificacoes,
        obras,
        filtro: "capitulos",
        ordenacao: "antigas",
        acessoConteudo18Liberado: true,
      }),
    ).sort(),
    ["capitulo", "comentario-capitulo"],
  );
  assert.deepEqual(
    ids(
      consultar({
        notificacoes,
        obras,
        filtro: "comunidade",
        ordenacao: "antigas",
        acessoConteudo18Liberado: true,
      }),
    ).sort(),
    notificacoes
      .filter((notificacao) => !notificacaoEhCapitulo(notificacao))
      .map((notificacao) => notificacao.id)
      .sort(),
  );
});

test("executa a busca pela notificacao, pela obra e pelo capitulo", () => {
  const obra = criarObra("obra-busca", {
    titulo: "Aurora Distante",
    genero: "Fantasia lunar",
    capitulos: [{ id: "capitulo-eclipse", titulo: "Capitulo Eclipse" }],
  });
  const notificacao = criarNotificacao("busca", {
    obraId: obra.id,
    capituloId: "capitulo-eclipse",
    mensagem: "Mensagem propria buscavel",
  });

  for (const termoBusca of [
    "propria buscavel",
    "aurora distante",
    "fantasia lunar",
    "capitulo eclipse",
  ]) {
    assert.deepEqual(
      ids(
        consultar({
          notificacoes: [notificacao],
          obras: [obra],
          termoBusca,
        }),
      ),
      ["busca"],
      `busca deveria encontrar ${termoBusca}`,
    );
  }
});

test("executa ordenacao recente, antiga, por obra e por capitulo", () => {
  const obraAlfa = criarObra("obra-alfa", {
    titulo: "Alfa",
    capitulos: [{ id: "capitulo-zeta", titulo: "Zeta" }],
  });
  const obraBeta = criarObra("obra-beta", {
    titulo: "Beta",
    capitulos: [{ id: "capitulo-alfa", titulo: "Alfa" }],
  });
  const notificacoes = [
    criarNotificacao("antiga", {
      obraId: obraAlfa.id,
      capituloId: "capitulo-zeta",
      criadaEm: "2026-01-01T00:00:00.000Z",
    }),
    criarNotificacao("recente", {
      obraId: obraBeta.id,
      capituloId: "capitulo-alfa",
      criadaEm: "2026-01-03T00:00:00.000Z",
    }),
    criarNotificacao("sem-dados", {
      obraId: "obra-ausente",
      capituloId: "capitulo-ausente",
      criadaEm: "2026-01-02T00:00:00.000Z",
    }),
  ];
  const parametros = {
    notificacoes,
    obras: [obraAlfa, obraBeta],
    acessoConteudo18Liberado: true,
  };

  assert.deepEqual(ids(consultar(parametros)), ["recente", "sem-dados", "antiga"]);
  assert.deepEqual(ids(consultar({ ...parametros, ordenacao: "antigas" })), [
    "antiga",
    "sem-dados",
    "recente",
  ]);
  assert.deepEqual(ids(consultar({ ...parametros, ordenacao: "obra" })), [
    "antiga",
    "recente",
    "sem-dados",
  ]);
  assert.deepEqual(ids(consultar({ ...parametros, ordenacao: "capitulo" })), [
    "recente",
    "antiga",
    "sem-dados",
  ]);
});

test("executa a politica de acesso 18+ sem remover notificacoes sem obra", () => {
  const obras = [
    criarObra("obra-livre"),
    criarObra("obra-18", { classificacaoIndicativa: "18 anos" }),
    criarObra("obra-vazia", { classificacaoIndicativa: "" }),
    criarObra("obra-desconhecida", { classificacaoIndicativa: "Nao informado" }),
  ];
  const notificacoes = [
    criarNotificacao("livre", { obraId: "obra-livre" }),
    criarNotificacao("adulto", { obraId: "obra-18" }),
    criarNotificacao("obra-ausente", { obraId: "obra-inexistente" }),
    criarNotificacao("classificacao-vazia", { obraId: "obra-vazia" }),
    criarNotificacao("classificacao-desconhecida", {
      obraId: "obra-desconhecida",
    }),
    criarNotificacao("sem-obra", { obraId: "" }),
  ];

  assert.deepEqual(
    ids(consultar({ notificacoes, obras, ordenacao: "antigas" })),
    ["livre", "sem-obra"],
  );
  assert.deepEqual(
    ids(
      consultar({
        notificacoes,
        obras,
        ordenacao: "antigas",
        acessoConteudo18Liberado: true,
      }),
    ),
    [
      "livre",
      "adulto",
      "obra-ausente",
      "classificacao-vazia",
      "classificacao-desconhecida",
      "sem-obra",
    ],
  );
});

test("consulta preserva todos os filtros de notificacao", () => {
  assert.match(filtroUtils, /filtro === "todas"/);
  assert.match(filtroUtils, /filtro === "nao-lidas" && !notificacao\.lida/);
  assert.match(filtroUtils, /filtro === "lidas" && notificacao\.lida/);
  assert.match(
    filtroUtils,
    /filtro === "capitulos" && notificacaoEhCapitulo\(notificacao\)/,
  );
  assert.match(
    filtroUtils,
    /filtro === "comunidade" && notificacaoEhComunidade\(notificacao\)/,
  );
  assert.match(filtroUtils, /notificacao\.tipo === "novo-capitulo"/);
  assert.match(filtroUtils, /return !notificacaoEhCapitulo\(notificacao\);/);
});

test("consulta preserva campos da busca textual", () => {
  for (const campo of [
    "notificacao.titulo",
    "notificacao.mensagem",
    "notificacao.tipo",
    "notificacao.link",
    'notificacao.autorNome || ""',
    'obra?.titulo || ""',
    'obra?.autor || ""',
    'obra?.genero || ""',
    'obra?.formato || ""',
    'obra?.classificacaoIndicativa || ""',
    'capitulo?.titulo || ""',
    "formatarData(notificacao.criadaEm)",
  ]) {
    assert.ok(filtroUtils.includes(campo), `campo ausente: ${campo}`);
  }

  assert.match(filtroUtils, /const textoBusca = normalizarTexto\(/);
  assert.match(
    filtroUtils,
    /const passaBusca = termoBusca \? textoBusca\.includes\(termoBusca\) : true;/,
  );
});

test("consulta preserva ordenacao recente antiga obra e capitulo", () => {
  assert.match(
    filtroUtils,
    /ordenacao === "antigas"[\s\S]*?dataNotificacao\(notificacaoA\) - dataNotificacao\(notificacaoB\)/,
  );
  assert.match(
    filtroUtils,
    /ordenacao === "obra"[\s\S]*?obraA\?\.titulo \|\| "zzz"[\s\S]*?localeCompare\(obraB\?\.titulo \|\| "zzz"\)/,
  );
  assert.match(
    filtroUtils,
    /ordenacao === "capitulo"[\s\S]*?capituloA\?\.titulo \|\| "zzz"[\s\S]*?localeCompare\([\s\S]*?capituloB\?\.titulo \|\| "zzz"/,
  );
  assert.match(
    filtroUtils,
    /return dataNotificacao\(notificacaoB\) - dataNotificacao\(notificacaoA\);/,
  );
});

test("consulta preserva integralmente a politica de acesso 18+", () => {
  assert.match(filtroUtils, /if \(!acessoConteudo18Liberado && obraId\)/);
  assert.match(
    filtroUtils,
    /const obra = obrasPorId\.get\(obraId\) \|\| null;/,
  );
  assert.match(
    filtroUtils,
    /normalizarTexto\([\s\S]*?obra\?\.classificacaoIndicativa \|\| ""/,
  );
  assert.match(
    filtroUtils,
    /!obra \|\|[\s\S]*?!classificacaoNormalizada \|\|[\s\S]*?classificacaoNormalizada\.startsWith\("nao informad"\)/,
  );
  assert.match(
    filtroUtils,
    /classificacaoDesconhecida \|\|[\s\S]*?ehClassificacao18\(obra\?\.classificacaoIndicativa \|\| ""\)/,
  );
  assert.match(filtroUtils, /return false;/);
});

test("pagina mantem o memo e delega somente a consulta", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?filtrarEOrdenarNotificacoes,[\s\S]*?\} from "\.\/lib\/notificacoes-filter-utils";/,
  );
  assert.match(
    pagina,
    /const notificacoesFiltradas = useMemo\(\(\) => \{\s*return filtrarEOrdenarNotificacoes\(\{[\s\S]*?notificacoes,[\s\S]*?obrasPorId,[\s\S]*?termoBusca,[\s\S]*?filtro,[\s\S]*?ordenacao,[\s\S]*?acessoConteudo18Liberado,[\s\S]*?\}\);\s*\}, \[/,
  );
  assert.match(pagina, /const termoBusca = normalizarTexto\(busca\);/);
  assert.match(
    pagina,
    /const acessoConteudo18Liberado = acessoConteudo18Confirmado\(\);/,
  );
  assert.doesNotMatch(
    pagina.slice(
      pagina.indexOf("const notificacoesFiltradas = useMemo"),
      pagina.indexOf("const filtrosAtivos"),
    ),
    /notificacoes\.filter\(|ehClassificacao18\(|formatarData\(/,
  );
});
