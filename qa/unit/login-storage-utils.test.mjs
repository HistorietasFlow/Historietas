import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL("../../app/login/lib/login-storage-utils.ts", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/login/page.tsx", import.meta.url),
  "utf8",
);
let indiceModulo = 0;

async function carregarModulo() {
  const javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;

  return import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${indiceModulo++}`,
  );
}

test("normalizarListaStringsLogin mantém somente strings válidas, trimadas e ordenadas", async () => {
  const { normalizarListaStringsLogin } = await carregarModulo();

  assert.deepEqual(
    normalizarListaStringsLogin(["  primeiro  ", "", "   ", 2, null, "segundo", "segundo"]),
    ["primeiro", "segundo", "segundo"],
  );
  assert.deepEqual(normalizarListaStringsLogin({}), []);
});

test("lerJsonStorageLogin preserva SSR, chave trimada, JSON e falhas silenciosas", async () => {
  const windowAnterior = globalThis.window;
  const localStorageAnterior = globalThis.localStorage;
  const chamadas = [];
  const { lerJsonStorageLogin } = await carregarModulo();

  try {
    delete globalThis.window;
    globalThis.localStorage = {
      getItem(chave) {
        chamadas.push(chave);
        return '{"ignorado":true}';
      },
    };
    assert.equal(lerJsonStorageLogin(" chave "), null);
    assert.deepEqual(chamadas, []);

    globalThis.window = {};
    globalThis.localStorage = {
      getItem(chave) {
        chamadas.push(chave);
        return '{"ok":true}';
      },
    };
    assert.deepEqual(lerJsonStorageLogin(" chave "), { ok: true });
    assert.equal(chamadas.at(-1), "chave");
    assert.equal(lerJsonStorageLogin("   "), null);

    globalThis.localStorage = {
      getItem() {
        return "json inválido";
      },
    };
    assert.equal(lerJsonStorageLogin("chave"), null);

    globalThis.localStorage = {
      getItem() {
        throw new Error("falha simulada");
      },
    };
    assert.equal(lerJsonStorageLogin("chave"), null);
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

test("salvarJsonStorageLogin preserva serialização, chave trimada e falhas silenciosas", async () => {
  const windowAnterior = globalThis.window;
  const localStorageAnterior = globalThis.localStorage;
  const chamadas = [];
  const { salvarJsonStorageLogin } = await carregarModulo();

  try {
    globalThis.window = {};
    globalThis.localStorage = {
      setItem(chave, valor) {
        chamadas.push([chave, valor]);
      },
    };
    salvarJsonStorageLogin(" chave ", { itens: ["a"] });
    assert.deepEqual(chamadas, [["chave", '{"itens":["a"]}']]);

    salvarJsonStorageLogin("   ", { ignorado: true });
    assert.equal(chamadas.length, 1);

    globalThis.localStorage = {
      setItem() {
        throw new Error("falha simulada");
      },
    };
    assert.doesNotThrow(() => salvarJsonStorageLogin("chave", { ok: true }));

    const circular = {};
    circular.proprio = circular;
    assert.doesNotThrow(() => salvarJsonStorageLogin("chave", circular));
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

test("Login delega os helpers básicos de storage ao módulo extraído", () => {
  assert.match(source, /typeof item === "string" && Boolean\(item\.trim\(\)\)/);
  assert.match(source, /JSON\.parse\(texto\)/);
  assert.match(source, /JSON\.stringify\(valor\)/);
  assert.match(source, /typeof window === "undefined"/);
  assert.doesNotMatch(source, /react|supabase|router/i);
  assert.match(
    pageSource,
    /from "\.\/lib\/login-storage-utils";/,
  );
  assert.doesNotMatch(pageSource, /function normalizarListaStringsLogin\(/);
  assert.doesNotMatch(pageSource, /function lerJsonStorageLogin\(/);
  assert.doesNotMatch(pageSource, /function salvarJsonStorageLogin\(/);
  assert.match(pageSource, /lerJsonStorageLogin\(chaveObrasUsuario\)/);
  assert.match(pageSource, /salvarJsonStorageLogin\(chaveObrasUsuario, obrasUsuarioFiltradas\)/);
  assert.match(pageSource, /normalizarListaStringsLogin\(/);
});
