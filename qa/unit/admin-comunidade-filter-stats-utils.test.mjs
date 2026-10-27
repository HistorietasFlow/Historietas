import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const filterSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/lib/admin-comunidade-filter-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const statsSource = readFileSync(
  new URL(
    "../../app/admin/comunidade/lib/admin-comunidade-stats-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);

function normalizarTexto(valor) {
  return String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function importarModuloTypescript(source) {
  const javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;

  return import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
  );
}

const filterUtils = await importarModuloTypescript(
  filterSource
    .replace(
      'import { normalizarTexto } from "../../../../lib/utils";',
      `const normalizarTexto = ${normalizarTexto.toString()};`,
    )
    .replace(
      /import \{\n  formatarMotivoDenunciaPerfil,\n\} from ".\/admin-comunidade-report-label-utils";/,
      `const formatarMotivoDenunciaPerfil = (motivo) =>
        ({ ofensivo: "Conteúdo ofensivo" })[motivo] ||
        motivo ||
        "Denúncia de perfil";`,
    ),
);
const statsUtils = await importarModuloTypescript(statsSource);

function criarDenuncia(overrides = {}) {
  return {
    id: "denuncia-base",
    arquivada: false,
    status: "pendente",
    motivo: "spam",
    detalhe: "detalhe comum",
    denuncianteNome: "Denunciante",
    alvoTipo: "post",
    alvoResumo: "Resumo comum",
    alvoAutor: "Autor",
    alvoAutorId: "autor-id",
    alvoPostId: "post-id",
    alvoCategoria: "",
    alvoTipoPublicacao: "",
    alvoTemSpoiler: false,
    alvoObra: "",
    alvoCapituloTitulo: "",
    alvoCapituloId: "",
    alvoObraId: "",
    alvoObraSlug: "",
    alvoPerfilUserId: "",
    alvoAnotacaoId: "",
    ...overrides,
  };
}

function criarDenunciaPerfil(overrides = {}) {
  return {
    id: "perfil-base",
    status: "pendente",
    motivo: "spam",
    descricao: "descrição comum",
    denuncianteNome: "Denunciante",
    denunciadoNome: "Denunciado",
    denunciadoId: "denunciado-id",
    perfilUrl: "/perfil-autor?userId=denunciado-id",
    ...overrides,
  };
}

test("filtros de denúncias preservam status, arquivamento e busca normalizada", () => {
  const denuncias = [
    criarDenuncia({ id: "pendente", status: "pendente", motivo: "Motivo Ácido" }),
    criarDenuncia({ id: "analise", status: "em_analise" }),
    criarDenuncia({ id: "resolvida", status: "resolvida" }),
    criarDenuncia({ id: "rejeitada", status: "rejeitada" }),
    criarDenuncia({ id: "arquivada", arquivada: true, detalhe: "ocultada" }),
  ];
  const antes = structuredClone(denuncias);

  assert.deepEqual(
    filterUtils.obterDenunciasAtivas(denuncias).map(({ id }) => id),
    ["pendente", "analise", "resolvida", "rejeitada"],
  );
  assert.deepEqual(
    filterUtils.filtrarDenunciasModeracao(denuncias, "todas", "").map(({ id }) => id),
    ["pendente", "analise", "resolvida", "rejeitada"],
  );

  for (const status of ["pendente", "em_analise", "resolvida", "rejeitada"]) {
    assert.deepEqual(
      filterUtils
        .filtrarDenunciasModeracao(denuncias, status, "")
        .map(({ status: resultado }) => resultado),
      [status],
    );
  }

  assert.deepEqual(
    filterUtils
      .filtrarDenunciasModeracao(denuncias, "arquivadas", "")
      .map(({ id }) => id),
    ["arquivada"],
  );
  assert.deepEqual(
    filterUtils
      .filtrarDenunciasModeracao(denuncias, "todas", "motivo acido")
      .map(({ id }) => id),
    ["pendente"],
  );
  assert.deepEqual(denuncias, antes);
});

test("busca de denúncias preserva todos os campos pesquisáveis", () => {
  const campos = {
    motivo: "motivo-unico",
    detalhe: "detalhe-unico",
    denuncianteNome: "denunciante-unico",
    alvoTipo: "tipo-unico",
    alvoResumo: "resumo-unico",
    alvoAutor: "autor-unico",
    alvoAutorId: "autor-id-unico",
    alvoPostId: "post-id-unico",
    alvoCategoria: "categoria-unica",
    alvoTipoPublicacao: "publicacao-unica",
    alvoObra: "obra-unica",
    alvoCapituloTitulo: "capítulo-unico",
    alvoCapituloId: "capitulo-id-unico",
    alvoObraId: "obra-id-unico",
    alvoObraSlug: "obra-slug-unico",
    alvoPerfilUserId: "perfil-id-unico",
    alvoAnotacaoId: "anotacao-id-unico",
  };
  const denuncia = criarDenuncia({
    ...campos,
    alvoTemSpoiler: true,
  });

  for (const busca of [
    ...Object.values(campos),
    "spoiler",
    "contem",
    "capitulo-unico",
  ]) {
    assert.equal(
      filterUtils.filtrarDenunciasModeracao([denuncia], "todas", busca).length,
      1,
      busca,
    );
  }

  assert.equal(
    filterUtils
      .filtrarDenunciasModeracao(
        [criarDenuncia({ arquivada: true })],
        "arquivadas",
        "ocultada painel",
      )
      .length,
    1,
  );
});

test("filtros de perfis preservam mapeamento de status, busca e imutabilidade", () => {
  const denunciasPerfis = [
    criarDenunciaPerfil({ id: "pendente", status: "pendente" }),
    criarDenunciaPerfil({ id: "analisada", status: "analisada" }),
    criarDenunciaPerfil({ id: "resolvida", status: "resolvida" }),
    criarDenunciaPerfil({
      id: "ignorada",
      status: "ignorada",
      motivo: "ofensivo",
    }),
  ];
  const antes = structuredClone(denunciasPerfis);
  const mapeamentos = {
    pendente: "pendente",
    em_analise: "analisada",
    resolvida: "resolvida",
    rejeitada: "ignorada",
  };

  for (const [filtro, status] of Object.entries(mapeamentos)) {
    assert.deepEqual(
      filterUtils
        .filtrarDenunciasPerfisModeracao(denunciasPerfis, filtro, "")
        .map(({ status: resultado }) => resultado),
      [status],
    );
  }

  assert.deepEqual(
    filterUtils.filtrarDenunciasPerfisModeracao(denunciasPerfis, "arquivadas", ""),
    [],
  );
  assert.equal(
    filterUtils
      .filtrarDenunciasPerfisModeracao(
        denunciasPerfis,
        "todas",
        "conteúdo ofensivo",
      )
      .length,
    1,
  );
  assert.equal(
    filterUtils
      .filtrarDenunciasPerfisModeracao(
        denunciasPerfis,
        "todas",
        "perfil usuario denuncia",
      )
      .length,
    4,
  );
  assert.deepEqual(denunciasPerfis, antes);
});

test("totais de moderação preservam os cinco contadores sem mutar entradas", () => {
  const denunciasAtivas = [
    criarDenuncia({ status: "pendente" }),
    criarDenuncia({ status: "pendente" }),
    criarDenuncia({ status: "em_analise" }),
    criarDenuncia({ status: "resolvida" }),
    criarDenuncia({ status: "rejeitada" }),
  ];
  const denunciasPerfis = [
    criarDenunciaPerfil({ status: "pendente" }),
    criarDenunciaPerfil({ status: "analisada" }),
    criarDenunciaPerfil({ status: "pendente" }),
  ];
  const antes = structuredClone({ denunciasAtivas, denunciasPerfis });

  assert.deepEqual(
    statsUtils.calcularTotaisModeracao(denunciasAtivas, denunciasPerfis),
    {
      totalPendentes: 2,
      totalEmAnalise: 1,
      totalResolvidas: 1,
      totalRejeitadas: 1,
      totalPerfisPendentes: 2,
    },
  );
  assert.deepEqual({ denunciasAtivas, denunciasPerfis }, antes);
});

test("Admin Comunidade preserva useMemo e delega filtros e totais", () => {
  assert.match(
    pageSource,
    /const denunciasAtivas = useMemo\(\s*\(\) => obterDenunciasAtivas\(denuncias\),\s*\[denuncias\]/,
  );
  assert.match(
    pageSource,
    /const denunciasFiltradas = useMemo\(\s*\(\) => filtrarDenunciasModeracao\(denuncias, statusFiltro, busca\),\s*\[busca, denuncias, statusFiltro\]/,
  );
  assert.match(
    pageSource,
    /const denunciasPerfisFiltradas = useMemo\([\s\S]*?filtrarDenunciasPerfisModeracao\([\s\S]*?\[busca, denunciasPerfis, statusFiltro\]/,
  );
  assert.match(
    pageSource,
    /calcularTotaisModeracao\(denunciasAtivas, denunciasPerfis\)/,
  );
  assert.doesNotMatch(pageSource, /normalizarTexto\(busca\)/);
  assert.doesNotMatch(
    pageSource,
    /denunciasAtivas\.filter\(\s*\(denuncia\) => denuncia\.status ===/,
  );
  assert.doesNotMatch(
    pageSource,
    /denunciasPerfis\.filter\(\s*\(denuncia\) => denuncia\.status ===/,
  );

  for (const source of [filterSource, statsSource]) {
    assert.doesNotMatch(
      source,
      /useState|useEffect|useMemo|supabase|localStorage|router|(?:^|\n)\s*<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
    );
  }
});
