import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const storage = ler("../../app/ler-capitulo/lib/ler-capitulo-local-storage.ts");
const preferencias = ler("../../app/ler-capitulo/lib/ler-capitulo-reading-preferences.ts");
const loaderObra = ler("../../app/ler-capitulo/lib/ler-capitulo-work-read-loader.ts");
const commentPersistence = ler("../../app/ler-capitulo/lib/ler-capitulo-comment-persistence.ts");
const js = (source) => typescript.transpileModule(source, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const dataUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const utilsUrl = dataUrl(js(ler("../../lib/utils.ts")));
const adultUrl = dataUrl(js(ler("../../lib/historietasAdultContent.ts")));
const normalizacao = js(ler("../../app/ler-capitulo/lib/ler-capitulo-work-normalization.ts"))
  .replace('"../../../lib/utils"', JSON.stringify(utilsUrl))
  .replace('"../../../lib/historietasAdultContent"', JSON.stringify(adultUrl));
const storageUrl = dataUrl(js(storage).replace('"./ler-capitulo-work-normalization"', JSON.stringify(dataUrl(normalizacao))));
const local = await import(storageUrl);
const leitura = await import(dataUrl(js(preferencias).replace('"./ler-capitulo-local-storage"', JSON.stringify(storageUrl))));

async function comStorage(valores, teste, bloqueado = false) {
  const anteriores = { window: globalThis.window, localStorage: globalThis.localStorage };
  const dados = new Map(Object.entries(valores));
  globalThis.window = {};
  globalThis.localStorage = {
    getItem(chave) {
      if (bloqueado) throw new Error("storage bloqueado");
      return dados.get(chave) ?? null;
    },
    setItem(chave, valor) {
      if (bloqueado) throw new Error("storage bloqueado");
      dados.set(chave, valor);
    },
  };
  try {
    await teste(dados);
  } finally {
    if (anteriores.window === undefined) delete globalThis.window;
    else globalThis.window = anteriores.window;
    if (anteriores.localStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = anteriores.localStorage;
  }
}

test("os três blocos movidos permanecem literalmente iguais", () => {
  const semExport = (texto) => texto.replace(/export function /g, "function ").trimEnd();
  const inicio = storage.indexOf("function criarStorageKeyUsuarioLeitor(");
  const obras = storage.indexOf("export function carregarObrasLocaisNormalizadas(");
  const blocos = [
    [semExport(storage.slice(inicio, obras)), "f7010bbf19a32373d218e5978df668afd14e79eb84313fb5e0ba49e8c4690b5f"],
    [semExport(storage.slice(obras)), "06e60144abf3600068bdbe975319d3b1c2ea1880b9eb6f1c050521ebef924e86"],
    [semExport(preferencias.slice(preferencias.indexOf("function normalizarTamanhoFonte("))), "cf017ad9e3000a5498f6e1a5c5ee82d04d61ec20e83d9a3f5e8be77fc3c66f99"],
  ];
  for (const [conteudo, hash] of blocos) {
    assert.equal(createHash("sha256").update(conteudo).digest("hex"), hash);
  }
  assert.match(storage, /const STORAGE_KEY = "historietas-obras";/);
  assert.match(storage, /const CURTIDAS_COMENTARIOS_CAPITULOS_STORAGE_KEY = "historietas-comentarios-capitulos-curtidas";/);
  assert.match(preferencias, /const READER_PREFERENCES_STORAGE_KEY = "historietas-preferencias-leitura";/);
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-local-storage";/);
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-reading-preferences";/);
  assert.doesNotMatch(pagina, /function (?:salvarObrasPreservandoContas|carregarPreferenciasLeitura|aplicarCurtidasComentariosCapitulosLocais)\(/);
  assert.match(loaderObra, /export async function carregarObraSupabase\(/);
  const inicializacao = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-initial-load.ts");
  assert.match(pagina, /useLerCapituloInitialLoad\(/);
  assert.match(inicializacao, /carregarObraSupabase\(/);
  assert.match(pagina, /from "\.\/lib\/ler-capitulo-comment-persistence";/);
  assert.doesNotMatch(pagina, /async function salvarComentarioCapituloSupabase\(/);
  assert.match(commentPersistence, /export async function salvarComentarioCapituloSupabase\(/);
  assert.doesNotMatch(storage + preferencias, /\b(?:supabase|useEffect|useState)\b|\.(?:insert|update|delete|upsert)\s*\(/);
});

test("acesso básico é isolado por usuário e seguro sem window ou storage", async () => {
  assert.equal(local.lerStorageUsuarioLeitor("chave", "u"), null);
  assert.doesNotThrow(() => local.salvarJsonStorageUsuarioLeitor("chave", "u", [1]));
  await comStorage({}, (dados) => {
    assert.equal(local.lerStorageUsuarioLeitor("chave", " "), null);
    local.salvarJsonStorageUsuarioLeitor("chave", " ", [1]);
    local.salvarJsonStorageUsuarioLeitor("chave", " usuario-a ", { valor: 1 });
    assert.equal(local.lerStorageUsuarioLeitor("chave", "usuario-a"), '{"valor":1}');
    assert.equal(local.lerStorageUsuarioLeitor("chave", "usuario-b"), null);
    assert.deepEqual([...dados.keys()], ["chave:usuario-a"]);
  });
  await comStorage({}, () => {
    assert.equal(local.lerStorageUsuarioLeitor("chave", "u"), null);
    assert.doesNotThrow(() => local.salvarJsonStorageUsuarioLeitor("chave", "u", {}));
  }, true);
});

test("curtidas locais preservam adição, remoção, deduplicação e contas", async () => {
  const chave = "historietas-comentarios-capitulos-curtidas";
  await comStorage({
    [`${chave}:a`]: JSON.stringify({ c1: true, c2: false, invalido: "sim" }),
    [`${chave}:b`]: JSON.stringify({ c2: true }),
  }, (dados) => {
    const comentarios = [
      { id: "c1", curtidas: ["a", "outro"] },
      { id: "c2", curtidas: ["a", "outro"] },
      { id: "invalido", curtidas: [] },
    ];
    assert.equal(local.aplicarCurtidasComentariosCapitulosLocais(comentarios, ""), comentarios);
    const atualizados = local.aplicarCurtidasComentariosCapitulosLocais(comentarios, " a ");
    assert.deepEqual(atualizados.map((item) => item.curtidas), [["a", "outro"], ["outro"], []]);
    local.salvarCurtidaComentarioCapituloLocal(" a ", " c2 ", true);
    assert.deepEqual(JSON.parse(dados.get(`${chave}:a`)), { c1: true, c2: true });
    assert.deepEqual(JSON.parse(dados.get(`${chave}:b`)), { c2: true });
    local.salvarCurtidaComentarioCapituloLocal(" ", "c", true);
    local.salvarCurtidaComentarioCapituloLocal("a", " ", true);
    assert.equal(dados.size, 2);
  });
  await comStorage({ [`${chave}:a`]: "{inválido" }, (dados) => {
    assert.deepEqual(local.aplicarCurtidasComentariosCapitulosLocais([{ id: "c", curtidas: [] }], "a"), [{ id: "c", curtidas: [] }]);
    local.salvarCurtidaComentarioCapituloLocal("a", "c", true);
    assert.deepEqual(JSON.parse(dados.get(`${chave}:a`)), { c: true });
  });
  await comStorage({}, () => assert.doesNotThrow(() => local.salvarCurtidaComentarioCapituloLocal("a", "c", true)), true);
});

test("preferências preservam versões, escala legada, fallback e isolamento", async () => {
  const chave = "historietas-preferencias-leitura";
  const padrao = { tamanhoFonte: 3, mostrarLinhaProgresso: false, versaoTamanhoFonte: 2 };
  assert.deepEqual(leitura.FONT_SCALE_VALUES, [1, 2, 3, 4, 5]);
  assert.deepEqual(leitura.carregarPreferenciasLeitura("a"), padrao);
  await comStorage({}, (dados) => {
    for (const [original, esperado] of [[1, 1], [3, 2], [5, 3], [7, 4], [10, 5]]) {
      dados.set(`${chave}:a`, JSON.stringify({ tamanhoFonte: original, mostrarLinhaProgresso: 1 }));
      assert.deepEqual(leitura.carregarPreferenciasLeitura("a"), { tamanhoFonte: esperado, mostrarLinhaProgresso: true, versaoTamanhoFonte: 2 });
    }
    dados.set(`${chave}:a`, JSON.stringify({ tamanhoFonte: 2, mostrarLinhaProgresso: false, versaoTamanhoFonte: 2 }));
    assert.equal(leitura.carregarPreferenciasLeitura(" a ").tamanhoFonte, 2);
    dados.set(`${chave}:a`, "{inválido");
    assert.deepEqual(leitura.carregarPreferenciasLeitura("a"), padrao);
    dados.set(`${chave}:a`, JSON.stringify({ tamanhoFonte: "inválido" }));
    assert.deepEqual(leitura.carregarPreferenciasLeitura("a"), padrao);
    leitura.salvarPreferenciasLeitura({ tamanhoFonte: 5, mostrarLinhaProgresso: true, versaoTamanhoFonte: 2 }, "b");
    assert.equal(JSON.parse(dados.get(`${chave}:b`)).tamanhoFonte, 5);
    assert.deepEqual(leitura.carregarPreferenciasLeitura(" "), padrao);
  });
  await comStorage({}, () => {
    assert.deepEqual(leitura.carregarPreferenciasLeitura("a"), padrao);
    assert.doesNotThrow(() => leitura.salvarPreferenciasLeitura(padrao, "a"));
  }, true);
});

test("obras locais preservam acesso, posse e merge sem sobrescrever outras contas", async () => {
  const chave = "historietas-obras";
  const obra = (id, autorId, titulo, publicado = false) => ({ id, autorId, titulo, publicado, capitulos: [] });
  await comStorage({
    [`${chave}:a`]: JSON.stringify([obra("propria", "a", "original"), obra("outra", "b", "outra"), obra("sem-autor", "", "livre")]),
    [`${chave}:b`]: JSON.stringify([obra("privada-b", "b", "B")]),
  }, (dados) => {
    assert.deepEqual(local.carregarObrasLocaisNormalizadas("").map((item) => item.id), []);
    assert.equal(local.obterAutorIdSeguro({ autorId: " a " }), "a");
    assert.equal(local.usuarioPodeAbrirObraNoLeitor(obra("o", "b", "T"), "a"), false);
    assert.equal(local.usuarioPodeAbrirObraNoLeitor(obra("o", "b", "T", true), "a"), true);
    assert.equal(local.usuarioPodeAbrirObraNoLeitor(obra("o", "", "T"), ""), true);
    local.salvarObrasPreservandoContas([
      obra("propria", "a", "atualizada"),
      obra("outra", "b", "tentativa"),
      obra("nova-outra", "b", "não inserir"),
      obra("nova-propria", "a", "inserir"),
    ], " a ");
    const salvas = JSON.parse(dados.get(`${chave}:a`));
    assert.deepEqual(salvas.map((item) => item.id), ["nova-propria", "propria", "outra", "sem-autor"]);
    assert.equal(salvas.find((item) => item.id === "propria").titulo, "atualizada");
    assert.equal(salvas.find((item) => item.id === "outra").titulo, "outra");
    assert.equal(JSON.parse(dados.get(`${chave}:b`))[0].titulo, "B");
  });
});

test("JSON inválido nas obras mantém a exceção original e o save continua seguro", async () => {
  await comStorage({ "historietas-obras:a": "{inválido" }, (dados) => {
    assert.throws(() => local.carregarObrasLocaisNormalizadas("a"), SyntaxError);
    assert.doesNotThrow(() => local.salvarObrasPreservandoContas([], "a"));
    assert.equal(dados.get("historietas-obras:a"), "{inválido");
  });
  await comStorage({}, () => assert.doesNotThrow(() => local.salvarObrasPreservandoContas([], "a")), true);
});
