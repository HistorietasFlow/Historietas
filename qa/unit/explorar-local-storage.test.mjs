import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (caminho) =>
  readFileSync(new URL(caminho, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const pagina = ler("../../app/explorar/page.tsx");
const codigo = ler("../../app/explorar/lib/explorar-local-storage.ts");
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
const modulo = await import(urlModulo(
  codigo
    .replace("../../../lib/utils", utilUrl)
    .replace("./explorar-work-normalizers", normalizadoresUrl),
));

const {
  criarStorageKeyUsuarioExplorar,
  lerStorageUsuarioExplorar,
  salvarJsonStorageUsuarioExplorar,
  normalizarListaIdsExplorar,
  carregarListaIdsUsuarioExplorar,
  salvarListaIdsUsuarioExplorar,
  obterIdentificadoresObraExplorar,
  colecaoTemObraExplorar,
  carregarBackupArquivosObras,
  obterArquivoObraComBackup,
  salvarBackupsArquivosObras,
} = modulo;
const chaveBackup = "historietas-arquivos-obras-backup";
const arquivo = (conteudo) => ({ nome: "obra.txt", conteudo, categoria: "texto" });
const normalizado = (conteudo) => ({
  nome: "obra.txt", tipo: "", tamanho: 0, conteudo, categoria: "texto", criadoEm: "",
});
const obra = { id: "id-1", slug: "aventura-azul", titulo: "Aventura Azul" };

function comStorage(dadosIniciais, executar) {
  const windowAnterior = globalThis.window;
  const storageAnterior = globalThis.localStorage;
  const dados = new Map(Object.entries(dadosIniciais));
  globalThis.window = {};
  globalThis.localStorage = {
    getItem(chave) { return dados.get(chave) ?? null; },
    setItem(chave, valor) { dados.set(chave, valor); },
  };
  try {
    return executar(dados);
  } finally {
    if (windowAnterior === undefined) delete globalThis.window;
    else globalThis.window = windowAnterior;
    if (storageAnterior === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = storageAnterior;
  }
}

test("SSR e usuário vazio mantêm leitura vazia e escritas inertes", () => {
  assert.equal(criarStorageKeyUsuarioExplorar("obras", " user "), "obras:user");
  assert.equal(criarStorageKeyUsuarioExplorar("obras", "  "), "");
  assert.equal(lerStorageUsuarioExplorar("obras", "user"), null);
  assert.deepEqual(carregarListaIdsUsuarioExplorar("ids", "user"), []);
  assert.deepEqual(carregarBackupArquivosObras("user"), {});
  assert.doesNotThrow(() => salvarJsonStorageUsuarioExplorar("obras", "user", []));
  assert.doesNotThrow(() => salvarBackupsArquivosObras([], "user"));
  comStorage({}, (dados) => {
    salvarJsonStorageUsuarioExplorar("obras", "  ", ["x"]);
    salvarListaIdsUsuarioExplorar("ids", "", ["x"]);
    salvarBackupsArquivosObras([{ ...obra, arquivoObra: arquivo("x") }], "");
    assert.equal(dados.size, 0);
    assert.equal(lerStorageUsuarioExplorar("obras", ""), null);
  });
});

test("listas isolam usuários, validam IDs e deduplicam somente na gravação", () => {
  assert.deepEqual(normalizarListaIdsExplorar([" a ", 2, "", "a", null, " b "]), ["a", "a", "b"]);
  assert.deepEqual(normalizarListaIdsExplorar({}), []);
  comStorage({ "ids:alice": JSON.stringify([" a ", "", 5, "a"]), "ids:bob": "inválido" }, (dados) => {
    assert.deepEqual(carregarListaIdsUsuarioExplorar("ids", " alice "), ["a", "a"]);
    assert.deepEqual(carregarListaIdsUsuarioExplorar("ids", "bob"), []);
    salvarListaIdsUsuarioExplorar("ids", " alice ", [" b ", "a", "b", " ", "a"]);
    assert.deepEqual(JSON.parse(dados.get("ids:alice")), ["b", "a"]);
    assert.equal(dados.get("ids:bob"), "inválido");
    salvarJsonStorageUsuarioExplorar("preferencias", "bob", { tamanho: 2 });
    assert.equal(lerStorageUsuarioExplorar("preferencias", "bob"), '{"tamanho":2}');
    assert.equal(lerStorageUsuarioExplorar("preferencias", "alice"), null);
  });
});

test("identificadores preservam id, slug, título derivado e título normalizado", () => {
  assert.deepEqual(obterIdentificadoresObraExplorar(obra), [
    "id-1", "aventura-azul", "aventura azul",
  ]);
  assert.equal(colecaoTemObraExplorar([" outro ", " aventura azul "], obra), true);
  assert.equal(colecaoTemObraExplorar(["outro"], obra), false);
  assert.deepEqual(obterIdentificadoresObraExplorar({ id: "", slug: "", titulo: "" }), ["obra"]);
});

test("backups preservam precedência, chaves, merge e isolamento por usuário", () => {
  const antigo = normalizado("antigo");
  const deOutro = normalizado("outro usuário");
  comStorage({
    [`${chaveBackup}:alice`]: JSON.stringify({ "id:id-1": antigo, "antiga": antigo }),
    [`${chaveBackup}:bob`]: JSON.stringify({ "id:id-1": deOutro }),
  }, (dados) => {
    assert.deepEqual(obterArquivoObraComBackup({ ...obra, arquivoObra: arquivo("atual") }, obra.slug, "alice"), normalizado("atual"));
    assert.deepEqual(obterArquivoObraComBackup(obra, obra.slug, "alice"), antigo);
    assert.deepEqual(obterArquivoObraComBackup(obra, obra.slug, "bob"), deOutro);
    assert.equal(obterArquivoObraComBackup(obra, obra.slug, "terceiro"), null);
    salvarBackupsArquivosObras([{ ...obra, arquivoObra: arquivo("novo") }], " alice ");
    const salvo = JSON.parse(dados.get(`${chaveBackup}:alice`));
    assert.deepEqual(Object.keys(salvo), ["id:id-1", "antiga", "slug:aventura-azul", "titulo:aventura azul"]);
    assert.deepEqual(salvo["id:id-1"], normalizado("novo"));
    assert.deepEqual(salvo["slug:aventura-azul"], normalizado("novo"));
    assert.deepEqual(salvo["titulo:aventura azul"], normalizado("novo"));
    assert.deepEqual(salvo.antiga, antigo);
    assert.deepEqual(JSON.parse(dados.get(`${chaveBackup}:bob`)), { "id:id-1": deOutro });
  });
});

test("backups inválidos e storage bloqueado preservam fallbacks silenciosos", () => {
  comStorage({ [`${chaveBackup}:alice`]: "{inválido" }, (dados) => {
    assert.deepEqual(carregarBackupArquivosObras("alice"), {});
    dados.set(`${chaveBackup}:alice`, JSON.stringify([arquivo("x")]));
    assert.deepEqual(carregarBackupArquivosObras("alice"), {});
    dados.set(`${chaveBackup}:alice`, JSON.stringify({ "": arquivo("x"), "válido": arquivo("y"), "inválido": {} }));
    assert.deepEqual(carregarBackupArquivosObras("alice"), { "válido": normalizado("y") });
    globalThis.localStorage = {
      getItem() { throw new Error("bloqueado"); },
      setItem() { throw new Error("bloqueado"); },
    };
    assert.equal(lerStorageUsuarioExplorar("ids", "alice"), null);
    assert.deepEqual(carregarListaIdsUsuarioExplorar("ids", "alice"), []);
    assert.deepEqual(carregarBackupArquivosObras("alice"), {});
    assert.doesNotThrow(() => salvarListaIdsUsuarioExplorar("ids", "alice", ["a"]));
    assert.doesNotThrow(() => salvarBackupsArquivosObras([{ ...obra, arquivoObra: arquivo("x") }], "alice"));
  });
});

test("backup consulta chaves na ordem de id, slug e título", () => {
  comStorage({
    [`${chaveBackup}:alice`]: JSON.stringify({
      "id:id-1": arquivo("id"),
      "slug:aventura-azul": arquivo("slug"),
      "titulo:aventura azul": arquivo("título"),
    }),
  }, (dados) => {
    assert.deepEqual(obterArquivoObraComBackup(obra, obra.slug, "alice"), normalizado("id"));
    dados.set(`${chaveBackup}:alice`, JSON.stringify({
      "slug:aventura-azul": arquivo("slug"),
      "titulo:aventura azul": arquivo("título"),
    }));
    assert.deepEqual(obterArquivoObraComBackup(obra, obra.slug, "alice"), normalizado("slug"));
    dados.set(`${chaveBackup}:alice`, JSON.stringify({ "titulo:aventura azul": arquivo("título") }));
    assert.deepEqual(obterArquivoObraComBackup(obra, obra.slug, "alice"), normalizado("título"));
  });
});

test("a página consome a fronteira local sem mover loaders ou normalizadores", () => {
  for (const nome of Object.keys(modulo)) {
    assert.match(codigo, new RegExp(`export function ${nome}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`function ${nome}\\(`));
  }
  assert.match(pagina, /from "\.\/lib\/explorar-local-storage"/);
  assert.match(pagina, /normalizarObra\(obra, index, userIdAtual, obterArquivoObraComBackup\)/);
  assert.match(codigo, /from "\.\/explorar-work-normalizers"/);
  assert.doesNotMatch(codigo, /\b(?:supabase|useEffect|useState)\b/i);
});
