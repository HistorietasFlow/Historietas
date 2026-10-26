import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/login/lib/login-storage-sync.ts", import.meta.url),
  "utf8",
);
const storageUtilsSource = readFileSync(
  new URL("../../app/login/lib/login-storage-utils.ts", import.meta.url),
  "utf8",
);
const storageKeyUtilsSource = readFileSync(
  new URL("../../app/login/lib/login-storage-key-utils.ts", import.meta.url),
  "utf8",
);
const workStorageUtilsSource = readFileSync(
  new URL("../../app/login/lib/login-work-storage-utils.ts", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/login/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

function transpilar(codigo) {
  return typescript.transpileModule(codigo, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
}

function criarUrlData(codigo) {
  return `data:text/javascript;base64,${Buffer.from(codigo).toString("base64")}`;
}

async function carregarModulo() {
  const dependencias = {
    "./login-storage-key-utils": criarUrlData(transpilar(storageKeyUtilsSource)),
    "./login-storage-utils": criarUrlData(transpilar(storageUtilsSource)),
    "./login-work-storage-utils": criarUrlData(transpilar(workStorageUtilsSource)),
  };
  let javascript = transpilar(source);

  Object.entries(dependencias).forEach(([caminho, url]) => {
    javascript = javascript.replaceAll(`from "${caminho}"`, `from "${url}"`);
  });

  return import(`${criarUrlData(javascript)}#${indiceModulo++}`);
}

function criarStorage(inicial = {}, opcoes = {}) {
  const valores = new Map(Object.entries(inicial));
  const leituras = [];
  const escritas = [];

  return {
    leituras,
    escritas,
    getItem(chave) {
      leituras.push(chave);

      if (opcoes.falharLeitura) {
        throw new Error("falha de leitura");
      }

      return valores.get(chave) ?? null;
    },
    setItem(chave, valor) {
      escritas.push([chave, valor]);

      if (opcoes.falharEscrita) {
        throw new Error("falha de escrita");
      }

      valores.set(chave, valor);
    },
  };
}

test("sincronizarStorageUsuarioLogin retorna sem acessar storage para usuário vazio ou SSR", async () => {
  const { sincronizarStorageUsuarioLogin } = await carregarModulo();
  const windowAnterior = globalThis.window;
  const localStorageAnterior = globalThis.localStorage;
  const storage = criarStorage();

  try {
    globalThis.window = {};
    globalThis.localStorage = storage;
    sincronizarStorageUsuarioLogin("   ");
    assert.deepEqual(storage.leituras, []);
    assert.deepEqual(storage.escritas, []);

    delete globalThis.window;
    sincronizarStorageUsuarioLogin("usuario-1");
    assert.deepEqual(storage.leituras, []);
    assert.deepEqual(storage.escritas, []);
  } finally {
    if (windowAnterior === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = windowAnterior;
    }

    if (localStorageAnterior === undefined) {
      delete globalThis.localStorage;
    } else {
      globalThis.localStorage = localStorageAnterior;
    }
  }
});

test("sincronizarStorageUsuarioLogin preserva obras autorizadas, legado e as quatro listas", async () => {
  const { sincronizarStorageUsuarioLogin } = await carregarModulo();
  const windowAnterior = globalThis.window;
  const localStorageAnterior = globalThis.localStorage;
  const userId = " usuario-1 ";
  const userIdLimpo = "usuario-1";
  const storage = criarStorage({
    "historietas-obras:usuario-1": JSON.stringify([
      { id: "obra-do-usuario", autorId: " usuario-1 " },
      { id: "obra-de-outro", user_id: "usuario-2" },
      { id: "obra-antiga", titulo: "Sem autor" },
    ]),
    "historietas-obras-favoritas:usuario-1": JSON.stringify(["  favorita  ", "", 1]),
    "historietas-obras-concluidas:usuario-1": JSON.stringify(["  concluida  ", "   "]),
    "historietas-obras-seguidas:usuario-1": JSON.stringify(["  seguida  ", null]),
    "historietas-autores-seguidos:usuario-1": JSON.stringify(["  autor  ", {}]),
  });

  try {
    globalThis.window = {};
    globalThis.localStorage = storage;
    sincronizarStorageUsuarioLogin(userId);

    assert.equal(storage.leituras[0], "historietas-obras:usuario-1");
    assert.deepEqual(
      JSON.parse(storage.escritas[0][1]),
      [
        { id: "obra-do-usuario", autorId: " usuario-1 " },
        { id: "obra-antiga", titulo: "Sem autor", autorId: userIdLimpo },
      ],
    );
    assert.deepEqual(
      storage.escritas.slice(1).map(([chave, valor]) => [chave, JSON.parse(valor)]),
      [
        ["historietas-obras-favoritas:usuario-1", ["favorita"]],
        ["historietas-obras-concluidas:usuario-1", ["concluida"]],
        ["historietas-obras-seguidas:usuario-1", ["seguida"]],
        ["historietas-autores-seguidos:usuario-1", ["autor"]],
      ],
    );
  } finally {
    if (windowAnterior === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = windowAnterior;
    }

    if (localStorageAnterior === undefined) {
      delete globalThis.localStorage;
    } else {
      globalThis.localStorage = localStorageAnterior;
    }
  }
});

test("sincronizarStorageUsuarioLogin absorve falhas de leitura e escrita", async () => {
  const { sincronizarStorageUsuarioLogin } = await carregarModulo();
  const windowAnterior = globalThis.window;
  const localStorageAnterior = globalThis.localStorage;

  try {
    globalThis.window = {};
    globalThis.localStorage = criarStorage({}, { falharLeitura: true });
    assert.doesNotThrow(() => sincronizarStorageUsuarioLogin("usuario-1"));

    globalThis.localStorage = criarStorage({}, { falharEscrita: true });
    assert.doesNotThrow(() => sincronizarStorageUsuarioLogin("usuario-1"));
  } finally {
    if (windowAnterior === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = windowAnterior;
    }

    if (localStorageAnterior === undefined) {
      delete globalThis.localStorage;
    } else {
      globalThis.localStorage = localStorageAnterior;
    }
  }
});

test("Login delega exclusivamente a sincronização local ao módulo extraído", () => {
  assert.match(source, /const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas"/);
  assert.match(source, /const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas"/);
  assert.match(source, /const FOLLOW_STORAGE_KEY = "historietas-obras-seguidas"/);
  assert.match(source, /const AUTHOR_FOLLOW_STORAGE_KEY = "historietas-autores-seguidos"/);
  assert.match(source, /const userIdLimpo = userId\.trim\(\)/);
  assert.match(source, /return !autorId \|\| obraPertenceAoUsuarioLogin\(obra, userIdLimpo\)/);
  assert.match(source, /autorId: userIdLimpo/);
  assert.match(source, /normalizarListaStringsLogin\(/);
  assert.doesNotMatch(
    source,
    /from\s+["']react["']|useState|useEffect|supabase\.(?:auth|from|rpc)|router|<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/i,
  );
  assert.match(pageSource, /from "\.\/lib\/login-storage-sync"/);
  assert.doesNotMatch(pageSource, /function sincronizarStorageUsuarioLogin\(/);
  assert.equal(
    (pageSource.match(/sincronizarStorageUsuarioLogin\(data\.user\.id\)/g) || []).length,
    3,
  );
});
