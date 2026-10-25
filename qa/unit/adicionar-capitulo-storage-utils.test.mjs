import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const storageSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/lib/adicionar-capitulo-storage-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const storageJavascript = typescript.transpileModule(storageSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  criarStorageKeyUsuarioAdicionarCapitulo,
  lerStorageUsuarioAdicionarCapitulo,
  salvarJsonStorageUsuarioAdicionarCapitulo,
} = await import(
  `data:text/javascript;base64,${Buffer.from(storageJavascript).toString("base64")}`,
);

function comStorage(storage, executar) {
  const windowAnterior = globalThis.window;
  const storageAnterior = globalThis.localStorage;

  globalThis.window = {};
  globalThis.localStorage = storage;

  try {
    executar();
  } finally {
    globalThis.window = windowAnterior;
    globalThis.localStorage = storageAnterior;
  }
}

test("storage de Adicionar Capítulo preserva chave por usuário e leitura segura", () => {
  assert.equal(
    criarStorageKeyUsuarioAdicionarCapitulo("obras", " usuario-1 "),
    "obras:usuario-1",
  );
  assert.equal(
    criarStorageKeyUsuarioAdicionarCapitulo("obras", "   "),
    "",
  );
  assert.equal(
    lerStorageUsuarioAdicionarCapitulo("obras", "usuario-1"),
    null,
  );

  const leituras = [];
  comStorage(
    {
      getItem(chave) {
        leituras.push(chave);
        return "conteúdo";
      },
      setItem() {},
    },
    () => {
      assert.equal(
        lerStorageUsuarioAdicionarCapitulo("obras", " usuario-1 "),
        "conteúdo",
      );
      assert.equal(lerStorageUsuarioAdicionarCapitulo("obras", ""), null);
    },
  );

  assert.deepEqual(leituras, ["obras:usuario-1"]);
});

test("storage de Adicionar Capítulo preserva serialização e falhas silenciosas", () => {
  const escritas = [];
  comStorage(
    {
      getItem() {
        return null;
      },
      setItem(chave, valor) {
        escritas.push([chave, valor]);
      },
    },
    () => {
      salvarJsonStorageUsuarioAdicionarCapitulo("obras", " usuario-1 ", {
        titulo: "Obra",
      });
      salvarJsonStorageUsuarioAdicionarCapitulo("obras", "", {
        titulo: "Ignorada",
      });
    },
  );

  assert.deepEqual(escritas, [
    ["obras:usuario-1", JSON.stringify({ titulo: "Obra" })],
  ]);

  comStorage(
    {
      getItem() {
        throw new Error("bloqueado");
      },
      setItem() {
        throw new Error("bloqueado");
      },
    },
    () => {
      assert.equal(lerStorageUsuarioAdicionarCapitulo("obras", "usuario-1"), null);
      assert.doesNotThrow(() =>
        salvarJsonStorageUsuarioAdicionarCapitulo("obras", "usuario-1", {}),
      );
    },
  );
});

test("Adicionar Capítulo delega somente utilidades de storage ao módulo extraído", () => {
  assert.match(
    pageSource,
    /import \{[\s\S]*?lerStorageUsuarioAdicionarCapitulo,[\s\S]*?salvarJsonStorageUsuarioAdicionarCapitulo,[\s\S]*?\} from "\.\/lib\/adicionar-capitulo-storage-utils";/,
  );
  assert.doesNotMatch(pageSource, /function criarStorageKeyUsuarioAdicionarCapitulo\(/);
  assert.doesNotMatch(pageSource, /function lerStorageUsuarioAdicionarCapitulo\(/);
  assert.doesNotMatch(pageSource, /function salvarJsonStorageUsuarioAdicionarCapitulo\(/);
  assert.match(pageSource, /lerStorageUsuarioAdicionarCapitulo\(\s*FILE_BACKUP_STORAGE_KEY,/);
  assert.match(pageSource, /lerStorageUsuarioAdicionarCapitulo\(\s*STORAGE_KEY,/);
  assert.match(pageSource, /salvarJsonStorageUsuarioAdicionarCapitulo\(\s*FILE_BACKUP_STORAGE_KEY,/);
  assert.match(pageSource, /salvarJsonStorageUsuarioAdicionarCapitulo\(\s*STORAGE_KEY,/);
  assert.match(pageSource, /const STORAGE_KEY = "historietas-obras";/);
  assert.match(
    pageSource,
    /const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";/,
  );
  assert.match(
    storageSource,
    /localStorage é fallback; a criação do capítulo continua em memória\./,
  );
  assert.doesNotMatch(storageSource, /supabase|useState|useEffect|<\w+/i);
});
