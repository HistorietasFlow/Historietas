import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (arquivo) =>
  readFileSync(new URL(arquivo, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const pagina = ler("../../app/explorar/page.tsx");
const codigo = ler("../../app/explorar/lib/explorar-derived-utils.ts");
const compilar = (codigoFonte) =>
  typescript.transpileModule(codigoFonte, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
const urlModulo = (codigoFonte) =>
  `data:text/javascript;base64,${Buffer.from(compilar(codigoFonte)).toString("base64")}`;
const utilUrl = urlModulo(ler("../../lib/utils.ts"));
const adultoUrl = urlModulo(ler("../../lib/historietasAdultContent.ts"));
const normalizadoresUrl = urlModulo(
  ler("../../app/explorar/lib/explorar-work-normalizers.ts")
    .replace("../../../lib/utils", utilUrl)
    .replace("../../../lib/historietasAdultContent", adultoUrl),
);
const traducoesUrl = urlModulo(
  ler("../../app/explorar/lib/explorar-translations.ts")
    .replace("../../../lib/utils", utilUrl),
);
const modulo = await import(urlModulo(
  codigo
    .replace("../../../lib/utils", utilUrl)
    .replace("../../../lib/historietasAdultContent", adultoUrl)
    .replace("./explorar-translations", traducoesUrl)
    .replaceAll("./explorar-work-normalizers", normalizadoresUrl),
));

const {
  categoriaCombinaComGenero, ordenarObrasLocais,
  filtrarObrasBaseExplorar, filtrarObrasExplorar,
  criarAutoresExplorar, filtrarAutoresExplorar,
  criarSecoesCriativasObrasExplorar, criarSecoesCriativasAutoresExplorar,
  criarSecoesObrasPorGeneroExplorar, criarSecoesAutoresPorGeneroExplorar,
} = modulo;
const obra = (id, extra = {}) => ({
  id, slug: id, titulo: id, autor: "Ana", autorId: "ana", genero: "Ficção",
  formato: "História", classificacaoIndicativa: "Livre", sinopse: "",
  tags: [], capaNome: "", arquivoObra: null, publicado: true,
  capitulos: [{ titulo: "Abertura", lido: false, curtiu: false, salvo: false, comentario: "", criadoEm: "2024-01-01" }],
  criadaEm: "2024-01-01", totalCurtidas: 0, totalComentarios: 0,
  totalSalvos: 0, totalLidos: 0, visualizacoes: 0, ...extra,
});
const base = (obrasLocais, extra = {}) => ({
  obrasLocais, filtroFormato: "todos", filtroClassificacao: "todos",
  filtroCapitulos: "todos", filtroColecao: "todos", usuarioLogado: false,
  ordenacao: "relevancia", obrasFavoritas: [], obrasConcluidas: [],
  colecaoTemObraExplorar: (colecao, item) => colecao.includes(item.id),
  ...extra,
});
const ids = (obras) => obras.map((item) => item.id);
const obrasSecoes = (obrasBaseFiltradas, extra = {}) => ({
  obrasBaseFiltradas, categoriaSelecionada: "", termoBusca: "",
  filtroConteudo18Ativo: false, ...extra,
});
const autoresSecoes = (autoresExplorar, extra = {}) => ({
  autoresExplorar, categoriaSelecionada: "", termoBusca: "", ...extra,
});

test("os oito corpos dos useMemos foram movidos literalmente e as dependências permaneceram", () => {
  const funcoes = [
    "filtrarObrasBaseExplorar", "filtrarObrasExplorar", "criarAutoresExplorar",
    "filtrarAutoresExplorar", "criarSecoesCriativasObrasExplorar",
    "criarSecoesCriativasAutoresExplorar", "criarSecoesObrasPorGeneroExplorar",
    "criarSecoesAutoresPorGeneroExplorar",
  ];
  const corpos = funcoes.map((nome) => {
    const inicio = codigo.indexOf(`export function ${nome}(`);
    assert.notEqual(inicio, -1, nome);
    const corpo = codigo.indexOf("}) {\n", inicio) + "}) {\n".length;
    const fim = codigo.indexOf("\n}", corpo);
    assert.ok(corpo > inicio && fim > corpo, nome);
    return codigo.slice(corpo, fim);
  });
  assert.equal(createHash("sha256").update(corpos.join("\n---\n")).digest("hex"),
    "9a46286da748759c23ffd901d2c196882f79b56f89ece45078ca98733bf56d7f");
  for (const nome of funcoes) assert.match(pagina, new RegExp(`return ${nome}\\(\\{`));
  const nomesMemo = [
    "obrasBaseFiltradas", "obrasLocaisFiltradas", "autoresExplorar",
    "autoresFiltrados", "secoesCriativasObras", "secoesCriativasAutores",
    "secoesObrasPorGenero", "secoesAutoresPorGenero",
  ];
  const dependencias = nomesMemo.map((nome) => {
    const inicio = pagina.indexOf(`  const ${nome} = useMemo(() => {\n`);
    assert.notEqual(inicio, -1, nome);
    const abertura = pagina.indexOf("\n  }, [", inicio) + 7;
    const fim = pagina.indexOf("]);", abertura);
    assert.ok(abertura > inicio && fim > abertura, nome);
    return pagina.slice(abertura, fim + 1);
  });
  assert.equal(createHash("sha256").update(dependencias.join("\n---\n")).digest("hex"),
    "de43d25061d4620d3c87c39c6abb37838448a6451784eef083db4934752370e0");
  assert.match(pagina, /\[obrasBaseFiltradas, categoriaSelecionada, termoBusca\]/);
  assert.match(pagina, /\[autoresExplorar, categoriaSelecionada, termoBusca\]/);
  assert.match(pagina, /obrasLocais,\s*filtroFormato,\s*filtroClassificacao,\s*filtroCapitulos,\s*filtroColecao,\s*usuarioLogado,\s*ordenacao,\s*obrasFavoritas,\s*obrasConcluidas,/);
  assert.doesNotMatch(codigo, /\b(?:window|document|localStorage|supabase|useMemo|useEffect)\b/);
});

test("categorias preservam normalização e exceção Ficção / sci-fi", () => {
  assert.equal(categoriaCombinaComGenero("Ficção", "SCI-FI espacial"), true);
  assert.equal(categoriaCombinaComGenero("Ficção", "sci fi espacial"), true);
  assert.equal(categoriaCombinaComGenero("Ficção", "ficção científica"), true);
  assert.equal(categoriaCombinaComGenero("Ação", "Ação e aventura"), true);
  assert.equal(categoriaCombinaComGenero("", "Ação"), false);
  assert.equal(categoriaCombinaComGenero("Ação", "Romance"), false);
});

test("ordenação preserva métricas, ordem de empate e não altera entrada", () => {
  const lista = [
    obra("a", { totalCurtidas: 1, totalSalvos: 5, totalComentarios: 2, criadaEm: "2020-01-01" }),
    obra("b", { totalCurtidas: 4, totalSalvos: 1, totalComentarios: 5, criadaEm: "2024-01-01", capitulos: [obra("x").capitulos[0], obra("y").capitulos[0]] }),
    obra("c", { totalCurtidas: 4 }),
  ];
  assert.deepEqual(ids(ordenarObrasLocais(lista, "mais-curtidas")), ["b", "c", "a"]);
  assert.deepEqual(ids(ordenarObrasLocais(lista, "mais-salvas")), ["a", "b", "c"]);
  assert.equal(ordenarObrasLocais(lista, "mais-comentadas")[0].id, "b");
  assert.equal(ordenarObrasLocais(lista, "mais-recentes")[0].id, "b");
  assert.equal(ordenarObrasLocais(lista, "mais-capitulos")[0].id, "b");
  assert.deepEqual(ids(lista), ["a", "b", "c"]);
});

test("filtros base preservam publicação, 18+, formato, capítulos e coleções por sessão", () => {
  const lista = [
    obra("livre"),
    obra("adulta", { classificacaoIndicativa: "18+" }),
    obra("arquivo", { capitulos: [], arquivoObra: { nome: "a", conteudo: "b" } }),
    obra("vazia", { capitulos: [] }),
    obra("rascunho", { publicado: false }),
    obra("lida", { formato: "HQ", capitulos: [{ titulo: "C", lido: true, curtiu: false, salvo: false, comentario: "", criadoEm: "" }] }),
  ];
  assert.deepEqual(ids(filtrarObrasBaseExplorar(base(lista))), ["livre", "arquivo", "lida"]);
  assert.deepEqual(ids(filtrarObrasBaseExplorar(base(lista, { filtroClassificacao: "18+" }))), ["adulta"]);
  assert.deepEqual(ids(filtrarObrasBaseExplorar(base(lista, { filtroFormato: "HQ" }))), ["lida"]);
  assert.deepEqual(ids(filtrarObrasBaseExplorar(base(lista, { filtroCapitulos: "sem-capitulos" }))), ["arquivo"]);
  assert.deepEqual(ids(filtrarObrasBaseExplorar(base(lista, { usuarioLogado: true, filtroColecao: "favoritas", obrasFavoritas: ["livre"] }))), ["livre"]);
  assert.deepEqual(ids(filtrarObrasBaseExplorar(base(lista, { usuarioLogado: true, filtroColecao: "concluidas", obrasConcluidas: ["arquivo"] }))), ["arquivo"]);
  assert.deepEqual(ids(filtrarObrasBaseExplorar(base(lista, { usuarioLogado: true, filtroColecao: "lendo" }))), ["lida"]);
  assert.deepEqual(ids(filtrarObrasBaseExplorar(base(lista, { usuarioLogado: true, filtroColecao: "sem-leitura" }))), ["livre", "arquivo"]);
  assert.equal(filtrarObrasBaseExplorar(base(lista, { filtroColecao: "favoritas" })).length, 3);
});

test("busca normalizada combina categoria, título, tags e capítulos", () => {
  const lista = [
    obra("um", { titulo: "Viagem Estelar", tags: ["espaço"], capitulos: [{ titulo: "O Despertar" }] }),
    obra("dois", { titulo: "Outro", genero: "Romance" }),
  ];
  for (const termoBusca of ["viagem", "espaco", "despertar"]) {
    assert.deepEqual(ids(filtrarObrasExplorar({ obrasBaseFiltradas: lista, categoriaSelecionada: "Ficção", termoBusca })), ["um"]);
  }
  assert.deepEqual(filtrarObrasExplorar({ obrasBaseFiltradas: lista, categoriaSelecionada: "Romance", termoBusca: "despertar" }), []);
});

test("autores agregam obras únicas, métricas, perfil, avaliação, idioma e categorias", () => {
  const lista = [
    obra("a", { autor: "Ana", totalCurtidas: 3, totalComentarios: 2 }),
    obra("a", { autor: "Ana", genero: "Romance", totalCurtidas: 1 }),
    obra("b", { autor: "Bia", autorId: "", genero: "Outro" }),
  ];
  const autores = criarAutoresExplorar({
    obrasBaseFiltradas: lista, perfisAutores: { ana: { nome: "Ana Perfil", avatar: "foto", bio: "bio salva" } },
    avaliacoesAutores: { ana: { media: 4.5, total: 2 } }, language: "en",
    categorias: ["Ficção", "Romance"],
    criarBioAutorExplorar: (nome, generos, idioma) => `${nome}:${generos.join(",")}:${idioma}`,
    criarPerfilAutorHrefExplorar: (nome, id) => `/${id || nome}`,
  });
  const ana = autores.find((autor) => autor.autorId === "ana");
  assert.equal(ana.nome, "Ana Perfil");
  assert.equal(ana.totalObras, 1);
  assert.equal(ana.totalCurtidas, 4);
  assert.equal(ana.totalComentarios, 2);
  assert.deepEqual(ana.generos, ["Ficção", "Romance"]);
  assert.deepEqual([ana.avatar, ana.bio, ana.href, ana.avaliacao.media], ["foto", "bio salva", "/ana", 4.5]);
  assert.equal(autores.find((autor) => autor.nome === "Bia").bio, "Bia::en");
  assert.deepEqual(filtrarAutoresExplorar({ autoresExplorar: autores, categoriaSelecionada: "ficção", termoBusca: "perfil" }).map((a) => a.nome), ["Ana Perfil"]);
});

test("seções de obras preservam títulos, ordenações, desempate, limite e guardas", () => {
  const lista = Array.from({ length: 15 }, (_, index) =>
    obra(String(index), { totalCurtidas: index, totalComentarios: index, criadaEm: `2024-01-${String(index + 1).padStart(2, "0")}` }),
  );
  const secoes = criarSecoesCriativasObrasExplorar(obrasSecoes(lista));
  assert.deepEqual(secoes.map((secao) => secao.titulo), ["Recomendações para você", "Publicações recentes", "Novos capítulos", "Mais curtidas", "Mais comentadas", "Para ler agora"]);
  for (const secao of secoes) assert.equal(secao.obras.length, 12);
  assert.equal(secoes[0].obras[0].id, "14");
  assert.equal(secoes[1].obras[0].id, "14");
  assert.equal(secoes[3].obras[0].id, "14");
  for (const extra of [{ termoBusca: "x" }, { categoriaSelecionada: "Ação" }, { filtroConteudo18Ativo: true }]) {
    assert.deepEqual(criarSecoesCriativasObrasExplorar(obrasSecoes(lista, extra)), []);
  }
  const empatadas = [obra("antiga", { criadaEm: "2022-01-01", capitulos: [] }), obra("nova", { criadaEm: "2024-01-01", capitulos: [] })];
  assert.equal(criarSecoesCriativasObrasExplorar(obrasSecoes(empatadas))[0].obras[0].id, "nova");
});

test("seções de autores e gêneros preservam ranking, limite, outros e guardas", () => {
  const autores = Array.from({ length: 15 }, (_, i) => ({
    chave: String(i), nome: String(i), generos: i === 0 ? ["Ficção"] : [],
    totalObras: 1, totalCurtidas: i, totalComentarios: 0,
    avaliacao: { media: 4, total: i + 1 },
  }));
  const secoes = criarSecoesCriativasAutoresExplorar(autoresSecoes(autores));
  assert.deepEqual(secoes.map((secao) => secao.titulo), ["Autores para conhecer", "Autores em destaque", "Mais bem avaliados"]);
  assert.equal(secoes[0].autores.length, 12);
  assert.equal(secoes[1].autores[0].chave, "14");
  assert.equal(secoes[2].autores[0].chave, "14");
  assert.deepEqual(criarSecoesCriativasAutoresExplorar(autoresSecoes(autores, { termoBusca: "x" })), []);
  const porGenero = criarSecoesAutoresPorGeneroExplorar({ ...autoresSecoes(autores), categorias: ["Ficção"] });
  assert.deepEqual(porGenero.map((secao) => secao.genero), ["Ficção", "Outros"]);
  const porGeneroObra = criarSecoesObrasPorGeneroExplorar({ ...obrasSecoes([obra("ficcao"), obra("outra", { genero: "Outra" })]), categorias: ["Ficção"] });
  assert.deepEqual(porGeneroObra.map((secao) => secao.genero), ["Ficção", "Outros"]);
  assert.deepEqual(criarSecoesObrasPorGeneroExplorar({ ...obrasSecoes([], { filtroConteudo18Ativo: true }), categorias: [] }), []);
});
