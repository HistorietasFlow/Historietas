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
const { normalizarListaIds, criarStorageKeyUsuarioPainel } = await import(
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

test("Painel do Autor delega somente os helpers puros de armazenamento", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?criarStorageKeyUsuarioPainel,[\s\S]*?normalizarListaIds,[\s\S]*?\} from "\.\/lib\/painel-autor-storage-utils";/,
  );
  assert.doesNotMatch(pagina, /function normalizarListaIds\(/);
  assert.doesNotMatch(pagina, /function criarStorageKeyUsuarioPainel\(/);
  assert.equal((pagina.match(/\bnormalizarListaIds\b/g) || []).length, 7);
  assert.equal((pagina.match(/\bcriarStorageKeyUsuarioPainel\b/g) || []).length, 3);
  assert.match(pagina, /function lerStorageUsuarioPainel\(/);
  assert.match(pagina, /localStorage\.getItem\(chaveStorage\)/);
  assert.match(pagina, /localStorage\.setItem\(chaveStorage, JSON\.stringify\(valor\)\)/);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
  assert.doesNotMatch(utilsSource, /localStorage|supabase|useState|useEffect/);
});
