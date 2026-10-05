import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

function transpilarModuloTypescript(caminho, substituicoes = []) {
  let texto = readFileSync(new URL(caminho, import.meta.url), "utf8");

  substituicoes.forEach(([padrao, substituicao]) => {
    texto = texto.replace(padrao, substituicao);
  });

  return typescript.transpileModule(texto, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
}

function criarUrlModulo(codigo) {
  return `data:text/javascript;base64,${Buffer.from(codigo).toString("base64")}`;
}

const arquivoObraJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-file-utils.ts",
  [
    [
      /import \{ criarSlugBase, idObraSupabaseValido \} from "\.\.\/\.\.\/\.\.\/\.\.\/lib\/utils";/,
      "const criarSlugBase = () => \"\"; const idObraSupabaseValido = () => false;",
    ],
  ],
);
const storageUsuarioJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-user-storage.ts",
);
const backupArquivosJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-file-backup-utils.ts",
).replace(
  'from "./obra-file-utils";',
  `from "${criarUrlModulo(arquivoObraJavascript)}";`,
).replace(
  'from "./obra-user-storage";',
  `from "${criarUrlModulo(storageUsuarioJavascript)}";`,
);
const {
  carregarBackupArquivosObras,
  FILE_BACKUP_STORAGE_KEY,
} = await import(criarUrlModulo(backupArquivosJavascript));

function criarLocalStorage(valoresIniciais = {}) {
  const valores = new Map(Object.entries(valoresIniciais));

  return {
    getItem(chave) {
      return valores.get(chave) ?? null;
    },
    setItem(chave, valor) {
      valores.set(chave, String(valor));
    },
  };
}

function executarComStorageNavegador(valoresIniciais, executar) {
  const windowAnterior = Object.getOwnPropertyDescriptor(globalThis, "window");
  const localStorageAnterior = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  const localStorage = criarLocalStorage(valoresIniciais);

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {},
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: localStorage,
  });

  try {
    return executar(localStorage);
  } finally {
    if (windowAnterior) {
      Object.defineProperty(globalThis, "window", windowAnterior);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }

    if (localStorageAnterior) {
      Object.defineProperty(globalThis, "localStorage", localStorageAnterior);
    } else {
      Reflect.deleteProperty(globalThis, "localStorage");
    }
  }
}

test("retorna backup vazio sem sobrescrever JSON inválido", () => {
  executarComStorageNavegador(
    {
      [`${FILE_BACKUP_STORAGE_KEY}:usuario-a`]: "{invalido",
    },
    (localStorage) => {
      assert.deepEqual(carregarBackupArquivosObras("usuario-a"), {});
      assert.equal(
        localStorage.getItem(`${FILE_BACKUP_STORAGE_KEY}:usuario-a`),
        "{invalido",
      );
    },
  );
});

test("normaliza entradas válidas, descarta inválidas e persiste o backup canônico", () => {
  executarComStorageNavegador(
    {
      [`${FILE_BACKUP_STORAGE_KEY}:usuario-a`]: JSON.stringify({
        "obra-valida": {
          nome: " Roteiro ",
          tipo: 123,
          tamanho: "12",
          conteudo: "conteúdo",
          categoria: "texto",
          criadoEm: 123,
        },
        "   ": {
          nome: "Arquivo",
          tipo: "text/plain",
          tamanho: 1,
          conteudo: "conteúdo",
          categoria: "texto",
          criadoEm: "2026-01-01",
        },
        "obra-invalida": {
          nome: "",
          conteudo: "conteúdo",
        },
      }),
    },
    (localStorage) => {
      const backup = carregarBackupArquivosObras("usuario-a");

      assert.deepEqual(backup, {
        "obra-valida": {
          nome: " Roteiro ",
          tipo: "",
          tamanho: 0,
          conteudo: "conteúdo",
          categoria: "texto",
          criadoEm: "",
        },
      });
      assert.deepEqual(
        JSON.parse(localStorage.getItem(`${FILE_BACKUP_STORAGE_KEY}:usuario-a`)),
        backup,
      );
    },
  );
});

test("isola a leitura e a regravação do backup por usuário", () => {
  executarComStorageNavegador(
    {
      [`${FILE_BACKUP_STORAGE_KEY}:usuario-a`]: JSON.stringify({
        "obra-a": {
          nome: "Arquivo A",
          tipo: "text/plain",
          tamanho: 1,
          conteudo: "A",
          categoria: "texto",
          criadoEm: "",
        },
      }),
      [`${FILE_BACKUP_STORAGE_KEY}:usuario-b`]: JSON.stringify({
        "obra-b": {
          nome: "Arquivo B",
          tipo: "text/plain",
          tamanho: 1,
          conteudo: "B",
          categoria: "texto",
          criadoEm: "",
        },
      }),
    },
    (localStorage) => {
      assert.deepEqual(Object.keys(carregarBackupArquivosObras("usuario-a")), [
        "obra-a",
      ]);
      assert.deepEqual(Object.keys(carregarBackupArquivosObras("usuario-b")), [
        "obra-b",
      ]);
      assert.match(
        localStorage.getItem(`${FILE_BACKUP_STORAGE_KEY}:usuario-a`),
        /Arquivo A/,
      );
      assert.match(
        localStorage.getItem(`${FILE_BACKUP_STORAGE_KEY}:usuario-b`),
        /Arquivo B/,
      );
    },
  );
});
