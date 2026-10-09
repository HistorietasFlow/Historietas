import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-storage-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const utilsJavascript = typescript.transpileModule(utilsSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  normalizarListaIds,
  criarStorageKeyUsuarioPainel,
  lerStorageUsuarioPainel,
  salvarJsonStorageUsuarioPainel,
  carregarListaIdsPainel,
  salvarListaIdsUsuarioPainel,
} = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

test("normalizarListaIds preserva filtro, normalização e deduplicação", () => {
  assert.deepEqual(normalizarListaIds(null), []);
  assert.deepEqual(normalizarListaIds("obra"), []);
  assert.deepEqual(
    normalizarListaIds([" obra-1 ", "", 42, "obra-1", " obra-2 ", null]),
    ["obra-1", "obra-2"],
  );
});

test("criarStorageKeyUsuarioPainel preserva chave, trim e fallback", () => {
  assert.equal(
    criarStorageKeyUsuarioPainel("historietas-obras", " usuario-1 "),
    "historietas-obras:usuario-1",
  );
  assert.equal(criarStorageKeyUsuarioPainel("historietas-obras", "   "), "");
  assert.equal(criarStorageKeyUsuarioPainel("", "usuario-1"), ":usuario-1");
});

test("helpers de leitura e gravação preservam guards e localStorage", () => {
  assert.equal(lerStorageUsuarioPainel("historietas-obras", "usuario-1"), null);
  assert.equal(salvarJsonStorageUsuarioPainel("historietas-obras", "usuario-1", {}), undefined);
  assert.match(
    utilsSource,
    /if \(typeof window === "undefined" \|\| !userIdLimpo\) \{[\s\S]*?return null;/,
  );
  assert.match(utilsSource, /localStorage\.getItem\(chaveStorage\)/);
  assert.match(utilsSource, /localStorage\.setItem\(chaveStorage, JSON\.stringify\(valor\)\)/);
  assert.match(utilsSource, /catch \{[\s\S]*?return null;/);
});

test("helpers de listas preservam JSON, normalização e fallbacks", () => {
  assert.deepEqual(carregarListaIdsPainel("historietas-obras", "usuario-1"), []);
  assert.equal(
    salvarListaIdsUsuarioPainel("historietas-obras", "", ["obra-1"]),
    undefined,
  );
  assert.match(utilsSource, /JSON\.parse\(listaUsuarioTexto\)/);
  assert.match(utilsSource, /return \[\] as string\[\];/);
  assert.match(
    utilsSource,
    /const listaUsuarioNormalizada = normalizarListaIds\(listaUsuario\);/,
  );
  assert.match(
    utilsSource,
    /salvarJsonStorageUsuarioPainel\(chave, userId, listaUsuarioNormalizada\)/,
  );
});

test("Painel do Autor delega somente os helpers puros de armazenamento", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?carregarListaIdsPainel,[\s\S]*?lerStorageUsuarioPainel,[\s\S]*?normalizarListaIds,[\s\S]*?salvarJsonStorageUsuarioPainel,[\s\S]*?salvarListaIdsUsuarioPainel,[\s\S]*?\} from "\.\/lib\/painel-autor-storage-utils";/,
  );
  assert.doesNotMatch(pagina, /function normalizarListaIds\(/);
  assert.doesNotMatch(pagina, /function criarStorageKeyUsuarioPainel\(/);
  assert.doesNotMatch(pagina, /function lerStorageUsuarioPainel\(/);
  assert.doesNotMatch(pagina, /function salvarJsonStorageUsuarioPainel\(/);
  assert.doesNotMatch(pagina, /function carregarListaIdsPainel\(/);
  assert.doesNotMatch(pagina, /function salvarListaIdsUsuarioPainel\(/);
  assert.equal((pagina.match(/\bnormalizarListaIds\b/g) || []).length, 5);
  assert.equal((pagina.match(/\bcriarStorageKeyUsuarioPainel\b/g) || []).length, 0);
  assert.match(
    utilsSource,
    /criarStorageKeyUsuarioPainel\(chave, userIdLimpo\)/,
  );
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
  assert.doesNotMatch(utilsSource, /supabase|useState|useEffect/);
});
