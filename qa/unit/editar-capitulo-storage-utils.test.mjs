import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const storageSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-storage-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);
const backupSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-file-backup-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const localWorkStorageSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/lib/editar-capitulo-local-work-storage.ts",
    import.meta.url,
  ),
  "utf8",
);
const storageJavascript = typescript.transpileModule(storageSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  criarStorageKeyUsuarioEditarCapitulo,
  lerStorageUsuarioEditarCapitulo,
  salvarJsonStorageUsuarioEditarCapitulo,
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

test("storage de Editar Capítulo preserva chave por usuário e leitura segura", () => {
  assert.equal(
    criarStorageKeyUsuarioEditarCapitulo("obras", " usuario-1 "),
    "obras:usuario-1",
  );
  assert.equal(criarStorageKeyUsuarioEditarCapitulo("obras", "  "), "");
  assert.equal(lerStorageUsuarioEditarCapitulo("obras", "usuario-1"), null);

  comStorage({ "obras:usuario-1": "conteúdo" }, () => {
    assert.equal(
      lerStorageUsuarioEditarCapitulo("obras", " usuario-1 "),
      "conteúdo",
    );
    assert.equal(lerStorageUsuarioEditarCapitulo("obras", ""), null);
  });
});

test("storage de Editar Capítulo preserva serialização e falhas silenciosas", () => {
  comStorage({}, (valores) => {
    salvarJsonStorageUsuarioEditarCapitulo("obras", " usuario-1 ", {
      titulo: "Obra",
    });
    salvarJsonStorageUsuarioEditarCapitulo("obras", "", { titulo: "Ignorada" });

    assert.equal(
      valores.get("obras:usuario-1"),
      JSON.stringify({ titulo: "Obra" }),
    );
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
    assert.equal(lerStorageUsuarioEditarCapitulo("obras", "usuario-1"), null);
    assert.doesNotThrow(() =>
      salvarJsonStorageUsuarioEditarCapitulo("obras", "usuario-1", {}),
    );
  } finally {
    globalThis.window = windowAnterior;
    globalThis.localStorage = storageAnterior;
  }
});

test("Editar Capítulo delega somente as utilidades de storage ao módulo extraído", () => {
  assert.match(
    localWorkStorageSource,
    /import \{[\s\S]*?lerStorageUsuarioEditarCapitulo,[\s\S]*?salvarJsonStorageUsuarioEditarCapitulo,[\s\S]*?\} from "\.\/editar-capitulo-storage-utils";/,
  );
  assert.doesNotMatch(pageSource, /function criarStorageKeyUsuarioEditarCapitulo\(/);
  assert.doesNotMatch(pageSource, /function lerStorageUsuarioEditarCapitulo\(/);
  assert.doesNotMatch(pageSource, /function salvarJsonStorageUsuarioEditarCapitulo\(/);
  assert.doesNotMatch(pageSource, /lerStorageUsuarioEditarCapitulo|salvarJsonStorageUsuarioEditarCapitulo/);
  assert.match(
    localWorkStorageSource,
    /salvarJsonStorageUsuarioEditarCapitulo\(\s*STORAGE_KEY,/,
  );
  assert.match(
    backupSource,
    /import \{[\s\S]*?lerStorageUsuarioEditarCapitulo,[\s\S]*?salvarJsonStorageUsuarioEditarCapitulo,[\s\S]*?\} from "\.\/editar-capitulo-storage-utils";/,
  );
  assert.match(
    backupSource,
    /lerStorageUsuarioEditarCapitulo\(\s*FILE_BACKUP_STORAGE_KEY,/,
  );
  assert.match(storageSource, /localStorage é fallback; a edição continua com o estado em memória\./);
  assert.doesNotMatch(storageSource, /supabase|useState|useEffect/);
});
