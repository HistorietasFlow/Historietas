import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const storageSource = readFileSync(
  new URL(
    "../../app/editar-obra/lib/editar-obra-storage-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const storageJavascript = typescript.transpileModule(storageSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  criarStorageKeyUsuarioEditarObra,
  lerStorageUsuarioEditarObra,
  salvarJsonStorageUsuarioEditarObra,
} = await import(
  `data:text/javascript;base64,${Buffer.from(storageJavascript).toString("base64")}`,
);

function comStorage(valoresIniciais, executar) {
  const windowAnterior = globalThis.window;
  const storageAnterior = globalThis.localStorage;
  const valores = new Map(Object.entries(valoresIniciais));

  globalThis.window = {};
  globalThis.localStorage = {
    getItem(chave) {
      return valores.get(chave) ?? null;
    },
    setItem(chave, valor) {
      valores.set(chave, valor);
    },
  };

  try {
    executar(valores);
  } finally {
    globalThis.window = windowAnterior;
    globalThis.localStorage = storageAnterior;
  }
}

test("storage de Editar Obra preserva chave por usuário e leitura segura", () => {
  assert.equal(criarStorageKeyUsuarioEditarObra("obras", " usuario-1 "), "obras:usuario-1");
  assert.equal(criarStorageKeyUsuarioEditarObra("obras", "  "), "");
  assert.equal(lerStorageUsuarioEditarObra("obras", "usuario-1"), null);

  comStorage({ "obras:usuario-1": "conteúdo" }, () => {
    assert.equal(lerStorageUsuarioEditarObra("obras", " usuario-1 "), "conteúdo");
    assert.equal(lerStorageUsuarioEditarObra("obras", ""), null);
  });
});

test("storage de Editar Obra preserva serialização e falhas silenciosas", () => {
  comStorage({}, (valores) => {
    salvarJsonStorageUsuarioEditarObra("obras", " usuario-1 ", { titulo: "Obra" });
    salvarJsonStorageUsuarioEditarObra("obras", "", { titulo: "Ignorada" });

    assert.equal(valores.get("obras:usuario-1"), JSON.stringify({ titulo: "Obra" }));
    assert.equal(valores.get("obras:"), undefined);
  });

  const windowAnterior = globalThis.window;
  const storageAnterior = globalThis.localStorage;
  globalThis.window = {};
  globalThis.localStorage = {
    getItem() {
      throw new Error("bloqueado");
    },
    setItem() {
      throw new Error("bloqueado");
    },
  };

  try {
    assert.equal(lerStorageUsuarioEditarObra("obras", "usuario-1"), null);
    assert.doesNotThrow(() => salvarJsonStorageUsuarioEditarObra("obras", "usuario-1", {}));
  } finally {
    globalThis.window = windowAnterior;
    globalThis.localStorage = storageAnterior;
  }
});

test("Editar Obra delega somente as utilidades de storage ao módulo extraído", () => {
  assert.match(
    pageSource,
    /import \{[\s\S]*?lerStorageUsuarioEditarObra,[\s\S]*?salvarJsonStorageUsuarioEditarObra,[\s\S]*?\} from "\.\/lib\/editar-obra-storage-utils";/,
  );
  assert.doesNotMatch(
    pageSource,
    /import \{[\s\S]*?criarStorageKeyUsuarioEditarObra[\s\S]*?\} from "\.\/lib\/editar-obra-storage-utils";/,
  );
  assert.doesNotMatch(pageSource, /function criarStorageKeyUsuarioEditarObra\(/);
  assert.doesNotMatch(pageSource, /function lerStorageUsuarioEditarObra\(/);
  assert.doesNotMatch(pageSource, /function salvarJsonStorageUsuarioEditarObra\(/);
  assert.match(storageSource, /localStorage é fallback; a edição continua com o estado em memória\./);
  assert.doesNotMatch(storageSource, /supabase|useState|useEffect/);
});
