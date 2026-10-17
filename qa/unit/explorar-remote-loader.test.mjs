import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (arquivo) =>
  readFileSync(new URL(arquivo, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const pagina = ler("../../app/explorar/page.tsx");
const codigo = ler("../../app/explorar/lib/explorar-remote-loader.ts");

const deps = {};
const codigoExecutavel = codigo.replace(
  /^import[\s\S]*?from "[^"]+";\n/gm,
  "",
);
const injecao = `
const supabase = { from: (...args) => globalThis.__explorarRemoteLoaderTeste.supabase.from(...args) };
` + [
  "criarSlugBase", "carregarMetricasConteudos", "listarSelecaoCatalogo",
  "carregarTodasPaginasPorLotesSupabase", "carregarTodasPaginasSupabase",
  "normalizarContadorExplorar", "calcularProgressoLeitura",
  "obraTemConteudoPublicadoExplorar", "normalizarObraSupabase", "mesclarObrasSemDuplicar",
  "salvarJsonStorageUsuarioExplorar", "salvarBackupsArquivosObras",
  "carregarNomesProfilesExplorar", "aplicarNomesProfilesEmObrasExplorar",
].map((nome) => `const ${nome} = (...args) => globalThis.__explorarRemoteLoaderTeste.${nome}(...args);`).join("\n");
const javascript = typescript.transpileModule(injecao + "\n" + codigoExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
globalThis.__explorarRemoteLoaderTeste = deps;
const modulo = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

function obra(id, capitulos = []) {
  return {
    id, titulo: `Obra ${id}`, autor: "Autor local", autorId: "autor-local",
    slug: id, capitulos, ultimoCapituloLidoId: "", ultimaLeituraEm: "",
    progressoLeitura: 0, totalLidos: 7,
  };
}

function capitulo(id, extra = {}) {
  return { id, lido: false, lidoEm: "", totalLidos: 3, ...extra };
}

function preparar() {
  const chamadas = [];
  const gravacoes = [];
  const banco = { obras: [], capitulos: [], favoritos: [], concluidas: [] };
  const falhas = {};
  const configuracao = {
    chamadas, gravacoes, banco, falhas,
    selecao: { obraIds: [], paginas: [] },
    metricas: { carregado: false, obras: new Map(), capitulos: new Map() },
    nomes: new Map(),
  };
  Object.assign(deps, {
    criarSlugBase: (valor) => valor.toLowerCase().replaceAll(" ", "-"),
    normalizarContadorExplorar: (valor) => Math.max(0, Math.round(Number(valor) || 0)),
    calcularProgressoLeitura: (capitulos) =>
      capitulos.length ? Math.round(100 * capitulos.filter((item) => item.lido).length / capitulos.length) : 0,
    obraTemConteudoPublicadoExplorar: (item) => item.capitulos.length > 0 || Boolean(item.arquivoObra),
    supabase: {
      from(tabela) {
        const consulta = { tabela, operacoes: [] };
        chamadas.push(consulta);
        const builder = {};
        for (const metodo of ["select", "eq", "in", "order", "range"]) {
          builder[metodo] = (...args) => {
            consulta.operacoes.push([metodo, ...args]);
            return builder;
          };
        }
        builder.then = (resolve, reject) => {
          const erro = falhas[tabela];
          if (erro) return Promise.resolve({ data: null, error: erro }).then(resolve, reject);
          let resultado = banco[tabela];
          const intervalo = consulta.operacoes.find(([metodo]) => metodo === "range");
          if (intervalo) resultado = resultado.slice(intervalo[1], intervalo[2] + 1);
          return Promise.resolve({ data: resultado, error: null }).then(resolve, reject);
        };
        return builder;
      },
    },
    async listarSelecaoCatalogo(consultas) {
      configuracao.consultas = consultas;
      if (falhas.catalogo) throw falhas.catalogo;
      return configuracao.selecao;
    },
    async carregarTodasPaginasSupabase({ nomeColecao, buscarPagina }) {
      configuracao.nomeColecao = nomeColecao;
      const resposta = await buscarPagina(0, 999);
      if (resposta.error) throw resposta.error;
      return resposta.data;
    },
    async carregarTodasPaginasPorLotesSupabase({ nomeColecao, itens, buscarPaginaLote }) {
      configuracao.lotes = { nomeColecao, itens };
      const resultado = [];
      for (let inicio = 0; ; inicio += 2) {
        const resposta = await buscarPaginaLote(itens, inicio, inicio + 1);
        if (resposta.error) throw resposta.error;
        resultado.push(...resposta.data);
        if (resposta.data.length < 2) return resultado;
      }
    },
    async carregarMetricasConteudos(argumentos) {
      configuracao.argumentosMetricas = argumentos;
      if (falhas.metricas) throw falhas.metricas;
      return configuracao.metricas;
    },
    async carregarNomesProfilesExplorar(ids) {
      configuracao.idsAutores = ids;
      return configuracao.nomes;
    },
    aplicarNomesProfilesEmObrasExplorar(obras, nomes) {
      return obras.map((item) =>
        nomes.has(item.autorId) ? { ...item, autor: nomes.get(item.autorId) } : item,
      );
    },
    normalizarObraSupabase(registro, capitulos, local, index) {
      configuracao.normalizacoes ??= [];
      configuracao.normalizacoes.push({ registro, capitulos, local, index });
      return {
        ...obra(registro.id, capitulos.map((item) => capitulo(item.id))),
        ...local,
        id: registro.id,
        autorId: registro.user_id,
        capitulos: capitulos.map((item) => capitulo(item.id)),
        arquivoObra: registro.arquivoObra,
      };
    },
    mesclarObrasSemDuplicar(locais, remotas) {
      configuracao.merge = { locais, remotas };
      return [...locais.filter((item) => !remotas.some((remota) => remota.id === item.id)), ...remotas];
    },
    salvarBackupsArquivosObras(...args) { gravacoes.push(["backup", ...args]); },
    salvarJsonStorageUsuarioExplorar(...args) { gravacoes.push(["storage", ...args]); },
  });
  return configuracao;
}

test("os quatro corpos dos loaders permanecem literalmente idênticos à base", () => {
  const corpo = codigo
    .slice(codigo.indexOf("export async function carregarIdsColecaoUsuarioExplorar("))
    .trim()
    .replace(/^export async function /gm, "async function ");
  assert.equal(
    createHash("sha256").update(corpo).digest("hex"),
    "dc7b516daf4e3671e775ea8b9a0631afc0aa588cc788bd34a51e979c25fe628e",
  );
});

test("coleções preservam guardas, paginação, validação e userId original", async () => {
  const c = preparar();
  assert.deepEqual(await modulo.carregarIdsColecaoUsuarioExplorar("favoritos", "  "), []);
  assert.equal(c.chamadas.length, 0);
  c.banco.favoritos = [{ obra_id: " a " }, null, [], { obra_id: 42 }, { obra_id: "b" }];
  assert.deepEqual(await modulo.carregarIdsColecaoUsuarioExplorar("favoritos", " user "), ["a", "b"]);
  assert.equal(c.nomeColecao, "favoritos do Explorar");
  assert.deepEqual(c.chamadas[0].operacoes, [
    ["select", "obra_id"], ["eq", "user_id", " user "],
    ["order", "obra_id", { ascending: true }], ["range", 0, 999],
  ]);
  c.banco.concluidas = [{ obra_id: "c" }];
  assert.deepEqual(await modulo.carregarColecoesUsuarioExplorar("u"), {
    favoritas: ["a", "b"], concluidas: ["c"],
  });
  assert.deepEqual(c.chamadas.slice(1).map((item) => item.tabela), ["favoritos", "concluidas"]);
});

test("falha de coleção retorna lista vazia com aviso original", async () => {
  const c = preparar();
  c.falhas.favoritos = new Error("indisponível");
  const avisos = [];
  const anterior = console.warn;
  console.warn = (...args) => avisos.push(args);
  try {
    assert.deepEqual(await modulo.carregarIdsColecaoUsuarioExplorar("favoritos", "u"), []);
    assert.equal(avisos[0][0], "Não consegui acessar favoritos no Explorar:");
  } finally { console.warn = anterior; }
});

test("métricas preservam progresso privado sem divulgá-lo como total público", async () => {
  const c = preparar();
  const capitulos = [capitulo("c1", { totalLidos: 9 }), capitulo("c2")];
  const original = obra("o", capitulos);
  c.metricas = {
    carregado: true,
    obras: new Map([["o", {
      audiencia: { curtidoresUnicos: 11, comentaristasUnicos: 12, salvadoresUnicos: 13 },
      interacoesDiretas: { favoritos: 14, concluidas: 15 },
    }]]),
    capitulos: new Map([["c1", {
      usuario: { leu: true, lidoEm: "2025-04-01" },
      interacoes: { curtidas: 2, comentarios: 4, salvos: 6 },
    }]]),
  };
  const [atualizada] = await modulo.aplicarMetricasExplorar([original], "usuario");
  assert.deepEqual(c.argumentosMetricas, { obraIds: ["o"], capituloIds: ["c1", "c2"] });
  assert.equal(atualizada.capitulos[0].lido, true);
  assert.equal(atualizada.ultimoCapituloLidoId, "c1");
  assert.equal(atualizada.ultimaLeituraEm, "2025-04-01");
  assert.equal(atualizada.progressoLeitura, 50);
  assert.equal(atualizada.capitulos[0].totalLidos, 9);
  assert.equal(atualizada.totalLidos, 7);
  assert.equal(atualizada.totalCurtidas, 11);
  assert.equal(atualizada.totalFavoritos, 14);
  const [anonima] = await modulo.aplicarMetricasExplorar([original], "");
  assert.equal(anonima.capitulos[0].lido, false);
  assert.equal(anonima.totalLidos, 7);
  await modulo.aplicarMetricasExplorar([original, original], "usuario");
  assert.deepEqual(c.argumentosMetricas, { obraIds: ["o"], capituloIds: ["c1", "c2"] });
});

test("métricas indisponíveis ou sem IDs preservam a lista original", async () => {
  const c = preparar();
  const semIds = [obra("", [])];
  assert.equal(await modulo.aplicarMetricasExplorar(semIds, "u"), semIds);
  assert.equal(c.argumentosMetricas, undefined);
  const obras = [obra("id")];
  assert.equal(await modulo.aplicarMetricasExplorar(obras, "u"), obras);
});

test("catálogo vazio retorna locais com métricas e página original sem gravar", async () => {
  const c = preparar();
  const paginaCatalogo = { cursor: "proximo" };
  c.selecao = { obraIds: [], paginas: [paginaCatalogo] };
  const locais = [obra("local")];
  assert.deepEqual(await modulo.carregarObrasPublicadasSupabase(locais, "u"), {
    obras: locais, pagina: paginaCatalogo,
  });
  assert.equal(c.chamadas.length, 1);
  assert.deepEqual(c.gravacoes, []);
  assert.equal(c.consultas, modulo.CONSULTAS_INICIAIS_CATALOGO_EXPLORAR);
});

test("catálogo aplica perfis, pagina capítulos por lotes e persiste resultado", async () => {
  const c = preparar();
  c.selecao = { obraIds: ["o1", "o2"], paginas: [{ cursor: "c" }] };
  c.banco.obras = [
    { id: "o1", user_id: "a1", slug: "o1" },
    { id: "o2", user_id: "a2", slug: "o2" },
    { id: "", user_id: "ignorado" },
  ];
  c.banco.capitulos = [
    { id: "c1", obra_id: "o1" }, { id: "c2", obra_id: "o1" },
    { id: "c3", obra_id: "o2" },
  ];
  c.nomes = new Map([["autor-local", "Perfil local"], ["a1", "Perfil remoto"]]);
  const resultado = await modulo.carregarObrasPublicadasSupabase([obra("o1")], "usuario");
  assert.deepEqual(c.idsAutores, ["autor-local", "a1", "a2"]);
  assert.deepEqual(c.lotes, { nomeColecao: "capítulos publicados do Explorar", itens: ["o1", "o2"] });
  const consultaObras = c.chamadas.find((item) => item.tabela === "obras");
  assert.deepEqual(consultaObras.operacoes, [
    ["select", "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,link,criada_em,atualizado_em"],
    ["eq", "publicado", true],
    ["in", "id", ["o1", "o2"]],
  ]);
  assert.deepEqual(c.normalizacoes.map((item) => item.capitulos.length), [2, 1]);
  assert.equal(resultado.obras[0].autor, "Perfil remoto");
  assert.deepEqual(resultado.pagina, { cursor: "c" });
  const consultasCapitulos = c.chamadas.filter((item) => item.tabela === "capitulos");
  assert.equal(consultasCapitulos.length, 2);
  assert.deepEqual(consultasCapitulos[0].operacoes[0], [
    "select", "id,obra_id,user_id,titulo,ordem,publicado,criado_em,atualizado_em",
  ]);
  assert.deepEqual(consultasCapitulos[0].operacoes.slice(1), [
    ["in", "obra_id", ["o1", "o2"]], ["eq", "publicado", true],
    ["order", "obra_id", { ascending: true }], ["order", "ordem", { ascending: true }],
    ["order", "id", { ascending: true }], ["range", 0, 1],
  ]);
  assert.deepEqual(consultasCapitulos[1].operacoes.at(-1), ["range", 2, 3]);
  assert.deepEqual(c.gravacoes.map((item) => item[0]), ["backup", "storage"]);
  assert.deepEqual(c.gravacoes[1].slice(1), ["historietas-obras", "usuario", resultado.obras]);
});

test("fallback do catálogo usa amostra limitada e preserva avisos", async () => {
  const c = preparar();
  c.falhas.catalogo = new Error("catálogo indisponível");
  c.banco.obras = [{ id: "o1", user_id: "a1", slug: "o1", arquivoObra: { nome: "arquivo" } }];
  const avisos = [];
  const anterior = console.warn;
  console.warn = (...args) => avisos.push(args);
  try {
    const resultado = await modulo.carregarObrasPublicadasSupabase([], "u");
    assert.equal(resultado.obras.length, 1);
    const consulta = c.chamadas.find((item) => item.tabela === "obras");
    assert.deepEqual(consulta.operacoes.slice(-3), [
      ["order", "criada_em", { ascending: false }],
      ["order", "id", { ascending: false }], ["range", 0, 49],
    ]);
    assert.match(avisos[0][0], /amostra limitada/);
  } finally { console.warn = anterior; }
});

test("falha de obras retorna locais; falha de capítulos continua com arquivos", async () => {
  const c = preparar();
  c.selecao = { obraIds: ["o1"], paginas: [] };
  const locais = [obra("local")];
  const anterior = console.warn;
  const avisos = [];
  console.warn = (...args) => avisos.push(args);
  try {
    c.falhas.obras = new Error("obras");
    assert.deepEqual(await modulo.carregarObrasPublicadasSupabase(locais, "u"), { obras: locais, pagina: null });
    assert.equal(avisos[0][0], "Não consegui acessar o Supabase no Explorar:");
    delete c.falhas.obras;
    c.banco.obras = [{ id: "o1", user_id: "a", arquivoObra: { nome: "arquivo" } }];
    c.falhas.capitulos = new Error("capítulos");
    const resultado = await modulo.carregarObrasPublicadasSupabase([], "u");
    assert.equal(resultado.obras.length, 1);
    assert.equal(avisos[1][0], "Não consegui carregar capítulos do Supabase no Explorar:");
  } finally { console.warn = anterior; }
});

test("fronteira mantém queries, fallback e consumidores sem hooks ou autenticação", () => {
  for (const nome of [
    "carregarIdsColecaoUsuarioExplorar", "carregarColecoesUsuarioExplorar",
    "aplicarMetricasExplorar", "carregarObrasPublicadasSupabase",
  ]) {
    assert.match(codigo, new RegExp(`export async function ${nome}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`async function ${nome}\\(`));
  }
  assert.match(ler("../../app/explorar/hooks/use-explorar-catalog-query.ts"), /from "\.\.\/lib\/explorar-remote-loader"/);
  assert.match(pagina, /useExplorarCatalogQuery\(\{/);
  assert.match(ler("../../app/explorar/hooks/use-explorar-catalog-query.ts"), /carregarObrasPublicadasSupabase\(/);
  assert.match(pagina, /useExplorarInitialLoad\(\{/);
  assert.match(
    ler("../../app/explorar/hooks/use-explorar-initial-load.ts"),
    /carregarColecoesUsuarioExplorar\(userIdAtual\)/,
  );
  assert.match(codigo, /\.eq\("publicado", true\)/);
  assert.match(codigo, /\.in\("id", \[\.\.\.obraIdsCatalogo\]\)/);
  assert.match(codigo, /carregarTodasPaginasPorLotesSupabase/);
  assert.doesNotMatch(codigo, /\b(?:useEffect|useState|localStorage)\b|supabase\.auth/);
});
