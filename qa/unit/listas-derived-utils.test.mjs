import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const pagina = readFileSync(
  new URL("../../app/listas/page.tsx", import.meta.url),
  "utf8",
);
const resultsViewState = readFileSync(
  new URL(
    "../../app/listas/hooks/use-listas-results-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const filtroOrdenacao = readFileSync(
  new URL("../../app/listas/lib/listas-filter-sort-utils.ts", import.meta.url),
  "utf8",
);
const apresentacao = readFileSync(
  new URL("../../app/listas/lib/listas-presentation-utils.ts", import.meta.url),
  "utf8",
);
const permissoes = readFileSync(
  new URL(
    "../../app/listas/lib/listas-diary-annotation-permissions-utils.ts",
    import.meta.url,
  ),
  "utf8",
);

async function importarModulo(codigo) {
  const javascript = typescript.transpileModule(codigo, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
  return import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${Math.random()}`
  );
}

const normalizarTexto = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const timestampData = (valor) => new Date(valor).getTime() || 0;
const textoCategorias = (categorias) => categorias.join(" • ");
const dataUltimoCapitulo = (obra) =>
  obra.capitulos.reduce(
    (maisRecente, capitulo) => Math.max(maisRecente, timestampData(capitulo.criadoEm)),
    timestampData(obra.publicadaEm),
  );
const pontuacaoPopularidadeObra = (obra) =>
  obra.visualizacoes +
  obra.totalCurtidas * 8 +
  obra.totalComentarios * 5 +
  obra.capitulos.length * 2;
const tituloSecaoPublica = (secao, genero) => genero || `Seção ${secao}`;
const formatarMesAno = (data) => data.slice(0, 7);

const filtros = await importarModulo(
  filtroOrdenacao
    .replace(
      'import { normalizarTexto } from "../../../lib/utils";',
      `const normalizarTexto = ${normalizarTexto.toString()};`,
    )
    .replace(
      'import { timestampData } from "./listas-format-utils";',
      `const timestampData = ${timestampData.toString()};`,
    )
    .replace(
      'import { textoCategorias } from "./listas-profile-text-utils";',
      `const textoCategorias = ${textoCategorias.toString()};`,
    )
    .replace(
      /import \{\n  dataUltimoCapitulo,\n  pontuacaoPopularidadeObra,\n\} from "\.\/listas-public-catalog-utils";/,
      `const dataUltimoCapitulo = ${dataUltimoCapitulo.toString()};\nconst pontuacaoPopularidadeObra = ${pontuacaoPopularidadeObra.toString()};`,
    ),
);
const derivados = await importarModulo(
  apresentacao
    .replace(
      'import { formatarMesAno } from "./listas-format-utils";',
      `const formatarMesAno = ${formatarMesAno.toString()};`,
    )
    .replace(
      'import { tituloSecaoPublica } from "./listas-profile-text-utils";',
      `const tituloSecaoPublica = ${tituloSecaoPublica.toString()};`,
    ),
);
const anotacoes = await importarModulo(permissoes);

function criarObra(id, extras = {}) {
  return {
    id,
    titulo: id,
    autor: "Autor",
    genero: "Fantasia",
    formato: "Romance",
    notaMedia: 0,
    totalAvaliacoes: 0,
    totalCurtidas: 0,
    totalComentarios: 0,
    visualizacoes: 0,
    publicadaEm: "2024-01-01",
    capitulos: [],
    ...extras,
  };
}

function criarItem(obra, extras = {}) {
  return {
    obra,
    categorias: ["favoritas"],
    nota: 0,
    data: "2024-01-01",
    ...extras,
  };
}

function criarAutor(nome, extras = {}) {
  return {
    nome,
    username: nome.toLowerCase(),
    bio: "Bio",
    generos: ["Fantasia"],
    notaMedia: 0,
    totalAvaliacoes: 0,
    totalObras: 0,
    totalCurtidas: 0,
    totalComentarios: 0,
    criadaEm: "2024-01-01",
    ...extras,
  };
}

test("Listas delega filtragem, apresentação e permissões puras sem Supabase", () => {
  assert.match(
    pagina,
    /import \{ useListasResultsViewState \} from "\.\/hooks\/use-listas-results-view-state";/,
  );
  assert.match(pagina, /useListasResultsViewState\(\{/);

  for (const helper of [
    "filtrarOrdenarItensPerfilListas",
    "filtrarOrdenarObrasPublicasListas",
    "filtrarOrdenarAutoresListas",
    "calcularTotalResultadosListas",
    "obterTituloPaginaListas",
    "deveAgruparPorMesListas",
    "agruparItensPerfilPorMesListas",
    "obterPermissoesAnotacaoListas",
  ]) {
    const origem = helper === "obterPermissoesAnotacaoListas" ? pagina : resultsViewState;
    assert.match(origem, new RegExp(`import[\\s\\S]*?\\b${helper}\\b`));
    assert.doesNotMatch(origem, new RegExp(`function ${helper}\\(`));
  }

  for (const source of [filtroOrdenacao, apresentacao, permissoes]) {
    assert.doesNotMatch(source, /\bsupabase\b|\.rpc\(|\.insert\(|\.update\(|\.delete\(/);
  }
  assert.doesNotMatch(resultsViewState, /\bsupabase\b|\.rpc\(|\.insert\(|\.update\(|\.delete\(/);
});

test("filtra e ordena itens do perfil por busca normalizada e todos os critérios", () => {
  const itens = [
    criarItem(criarObra("Árvore", { autor: "Áurea", notaMedia: 4, visualizacoes: 3 }), {
      categorias: ["histórico"],
      nota: 0,
      data: "2024-01-01",
    }),
    criarItem(criarObra("Brisa", { notaMedia: 4, visualizacoes: 9 }), {
      nota: 5,
      data: "2024-03-01",
    }),
    criarItem(criarObra("Céu", { notaMedia: 3, visualizacoes: 20 }), {
      nota: 1,
      data: "2024-02-01",
    }),
  ];

  assert.deepEqual(
    filtros.filtrarOrdenarItensPerfilListas(itens, "arvore", "recentes").map((item) => item.obra.titulo),
    ["Árvore"],
  );
  assert.deepEqual(
    filtros.filtrarOrdenarItensPerfilListas(itens, "aurea", "recentes").map((item) => item.obra.titulo),
    ["Árvore"],
  );
  assert.deepEqual(
    filtros.filtrarOrdenarItensPerfilListas(itens, "historico", "recentes").map((item) => item.obra.titulo),
    ["Árvore"],
  );
  assert.deepEqual(
    filtros.filtrarOrdenarItensPerfilListas(itens, "", "titulo").map((item) => item.obra.titulo),
    ["Árvore", "Brisa", "Céu"],
  );
  assert.deepEqual(
    filtros.filtrarOrdenarItensPerfilListas(itens, "", "avaliacao").map((item) => item.obra.titulo),
    ["Brisa", "Árvore", "Céu"],
  );
  assert.deepEqual(
    filtros.filtrarOrdenarItensPerfilListas(itens, "", "popularidade").map((item) => item.obra.titulo),
    ["Céu", "Brisa", "Árvore"],
  );
  assert.deepEqual(
    filtros.filtrarOrdenarItensPerfilListas(itens, "", "recentes").map((item) => item.obra.titulo),
    ["Brisa", "Céu", "Árvore"],
  );
});

test("filtra e ordena obras públicas nos critérios e seções atuais", () => {
  const obras = [
    criarObra("Árvore", {
      autor: "Áurea",
      notaMedia: 4,
      totalAvaliacoes: 1,
      totalCurtidas: 3,
      totalComentarios: 1,
      visualizacoes: 4,
      publicadaEm: "2024-01-01",
      capitulos: [{ criadoEm: "2024-02-01" }],
    }),
    criarObra("Brisa", {
      notaMedia: 5,
      totalAvaliacoes: 3,
      totalCurtidas: 8,
      totalComentarios: 2,
      visualizacoes: 1,
      publicadaEm: "2024-04-01",
      capitulos: [{ criadoEm: "2024-05-01" }, { criadoEm: "2024-05-02" }],
    }),
    criarObra("Céu", {
      totalCurtidas: 1,
      totalComentarios: 10,
      visualizacoes: 30,
      publicadaEm: "2024-03-01",
      capitulos: [{ criadoEm: "2024-03-03" }, { criadoEm: "2024-03-04" }, { criadoEm: "2024-03-05" }],
    }),
  ];

  assert.deepEqual(filtros.filtrarOrdenarObrasPublicasListas(obras, "arvore", "recentes", "recentes").map((obra) => obra.titulo), ["Árvore"]);
  assert.deepEqual(filtros.filtrarOrdenarObrasPublicasListas(obras, "aurea", "recentes", "recentes").map((obra) => obra.titulo), ["Árvore"]);
  assert.equal(filtros.filtrarOrdenarObrasPublicasListas(obras, "", "titulo", "recentes")[0].titulo, "Árvore");
  assert.equal(filtros.filtrarOrdenarObrasPublicasListas(obras, "", "avaliacao", "recentes")[0].titulo, "Brisa");
  assert.equal(filtros.filtrarOrdenarObrasPublicasListas(obras, "", "recentes", "novos-capitulos")[0].titulo, "Brisa");
  assert.equal(filtros.filtrarOrdenarObrasPublicasListas(obras, "", "recentes", "mais-curtidas")[0].titulo, "Brisa");
  assert.equal(filtros.filtrarOrdenarObrasPublicasListas(obras, "", "recentes", "mais-comentadas")[0].titulo, "Céu");
  assert.equal(filtros.filtrarOrdenarObrasPublicasListas(obras, "", "recentes", "para-ler-agora")[0].titulo, "Árvore");
  assert.equal(filtros.filtrarOrdenarObrasPublicasListas(obras, "", "popularidade", "recentes")[0].titulo, "Céu");
  assert.equal(filtros.filtrarOrdenarObrasPublicasListas(obras, "", "recentes", "recentes")[0].titulo, "Brisa");
});

test("filtra e ordena autores por todos os critérios e desempates", () => {
  const autores = [
    criarAutor("Álvaro", { username: "alvaro.arte", bio: "Crônicas", generos: ["Drama"], totalObras: 2, totalCurtidas: 1, totalComentarios: 1, criadaEm: "2024-01-01" }),
    criarAutor("Bruna", { notaMedia: 4, totalAvaliacoes: 1, totalObras: 4, totalCurtidas: 8, totalComentarios: 2, criadaEm: "2024-03-01" }),
    criarAutor("Caio", { notaMedia: 4, totalAvaliacoes: 3, totalObras: 1, totalCurtidas: 2, totalComentarios: 20, criadaEm: "2024-02-01" }),
  ];

  assert.deepEqual(filtros.filtrarOrdenarAutoresListas(autores, "drama", "recentes").map((autor) => autor.nome), ["Álvaro"]);
  assert.deepEqual(filtros.filtrarOrdenarAutoresListas(autores, "alvaro.arte", "recentes").map((autor) => autor.nome), ["Álvaro"]);
  assert.deepEqual(filtros.filtrarOrdenarAutoresListas(autores, "cronicas", "recentes").map((autor) => autor.nome), ["Álvaro"]);
  assert.equal(filtros.filtrarOrdenarAutoresListas(autores, "", "titulo")[0].nome, "Álvaro");
  assert.equal(filtros.filtrarOrdenarAutoresListas(autores, "", "avaliacao")[0].nome, "Caio");
  assert.equal(filtros.filtrarOrdenarAutoresListas(autores, "", "popularidade")[0].nome, "Bruna");
  assert.equal(filtros.filtrarOrdenarAutoresListas(autores, "", "recentes")[0].nome, "Bruna");
  assert.equal(filtros.filtrarOrdenarAutoresListas(autores, "", "outro")[0].nome, "Bruna");
});

test("deriva resultados, títulos e agrupamento mensal sem alterar textos", () => {
  assert.equal(derivados.calcularTotalResultadosListas({ modo: "perfil", itensPerfil: [1], autores: [1, 2], obras: [1, 2, 3] }), 1);
  assert.equal(derivados.calcularTotalResultadosListas({ modo: "autores", itensPerfil: [1], autores: [1, 2], obras: [1, 2, 3] }), 2);
  assert.equal(derivados.calcularTotalResultadosListas({ modo: "obras", itensPerfil: [1], autores: [1, 2], obras: [1, 2, 3] }), 3);
  assert.equal(derivados.obterTituloPaginaListas({ tituloPersonalizado: "", modo: "perfil", origemPerfil: "biblioteca", perfilNome: "Ana", secao: "recentes", genero: "" }), "Biblioteca de Ana");
  assert.equal(derivados.obterTituloPaginaListas({ tituloPersonalizado: "", modo: "perfil", origemPerfil: "diario", perfilNome: "", secao: "recentes", genero: "" }), "Diário de usuário");
  assert.equal(derivados.obterTituloPaginaListas({ tituloPersonalizado: "", modo: "autores", origemPerfil: "diario", perfilNome: "Ana", secao: "recentes", genero: "" }), "Autores para conhecer");
  assert.equal(derivados.obterTituloPaginaListas({ tituloPersonalizado: "Título", modo: "obras", origemPerfil: "diario", perfilNome: "Ana", secao: "recentes", genero: "" }), "Título");
  assert.equal(derivados.obterTituloPaginaListas({ tituloPersonalizado: "", modo: "obras", origemPerfil: "diario", perfilNome: "Ana", secao: "recentes", genero: "" }), "Seção recentes");
  assert.equal(derivados.deveAgruparPorMesListas("perfil", "avaliacoes"), true);
  assert.equal(derivados.deveAgruparPorMesListas("perfil", "historico"), true);
  assert.equal(derivados.deveAgruparPorMesListas("perfil", "favoritas"), false);
  assert.deepEqual(
    derivados.agruparItensPerfilPorMesListas([{ data: "2024-01-01", id: 1 }, { data: "2024-01-05", id: 2 }, { data: "2024-02-01", id: 3 }]),
    [["2024-01", [{ data: "2024-01-01", id: 1 }, { data: "2024-01-05", id: 2 }]], ["2024-02", [{ data: "2024-02-01", id: 3 }]]],
  );
});

test("preserva a matriz de permissões de comentários e curtidas da anotação", () => {
  const obter = (item, extras = {}) => anotacoes.obterPermissoesAnotacaoListas({
    item,
    perfilEhProprio: false,
    relacionamentoPerfil: "nenhum",
    quemPodeComentarDiario: "todos",
    ...extras,
  });

  assert.deepEqual(obter({}), { podeVerComentarios: true, podeComentar: true, podeCurtirAnotacao: true });
  assert.deepEqual(obter({ anotacaoVisibilidadeComentarios: "seguidores" }), { podeVerComentarios: false, podeComentar: false, podeCurtirAnotacao: true });
  assert.equal(obter({ anotacaoVisibilidadeComentarios: "seguidores" }, { relacionamentoPerfil: "seguindo" }).podeVerComentarios, true);
  assert.equal(obter({ anotacaoQuemPodeComentar: "seguidores" }, { relacionamentoPerfil: "seguindo" }).podeComentar, true);
  assert.equal(obter({ anotacaoQuemPodeComentar: "herdar" }, { quemPodeComentarDiario: "ninguem" }).podeComentar, false);
  assert.deepEqual(obter({ anotacaoPermitirCurtidas: false }, { perfilEhProprio: true, quemPodeComentarDiario: "ninguem" }), { podeVerComentarios: true, podeComentar: true, podeCurtirAnotacao: false });
});
