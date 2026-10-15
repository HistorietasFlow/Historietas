import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-storage-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const loaderInicial = readFileSync(
  new URL("../../app/lib/home-initial-data-loader.ts", import.meta.url),
  "utf8",
);
const moduloExecutavel = modulo.replace(
  'import { normalizarListaIdsHome } from "./home-collection-utils";\n',
  `const normalizarListaIdsHome = (lista) => Array.from(
  new Set(lista.map((item) => item.trim()).filter(Boolean))
);
`,
);
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  carregarListaIdsHome,
  criarStorageKeyUsuarioHome,
  lerStorageUsuarioHome,
  salvarJsonStorageUsuarioHome,
  salvarListaIdsHome,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function comStorage(storage, callback) {
  const descritorWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const descritorStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {},
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });

  try {
    return callback();
  } finally {
    if (descritorWindow) {
      Object.defineProperty(globalThis, "window", descritorWindow);
    } else {
      delete globalThis.window;
    }
    if (descritorStorage) {
      Object.defineProperty(globalThis, "localStorage", descritorStorage);
    } else {
      delete globalThis.localStorage;
    }
  }
}

test("home-storage-utils preserva SSR, usuário vazio e chaves isoladas", () => {
  assert.equal(criarStorageKeyUsuarioHome("favoritos", " usuario "), "favoritos:usuario");
  assert.equal(criarStorageKeyUsuarioHome("favoritos", "   "), "");
  assert.equal(lerStorageUsuarioHome("favoritos", "usuario"), null);
  assert.deepEqual(carregarListaIdsHome("favoritos", "usuario", ["fallback"]), []);
  assert.equal(salvarJsonStorageUsuarioHome("favoritos", "", ["obra"]), undefined);
  assert.equal(salvarListaIdsHome("favoritos", "", ["obra"]), undefined);
});

test("home-storage-utils preserva leitura, parse, filtro e deduplicação", () => {
  const chamadas = [];
  const storage = {
    getItem(chave) {
      chamadas.push(["get", chave]);
      return JSON.stringify([" obra-1 ", 2, "obra-2", "obra-1", ""]);
    },
    setItem() {},
  };

  comStorage(storage, () => {
    assert.equal(
      lerStorageUsuarioHome("favoritos", " usuario "),
      JSON.stringify([" obra-1 ", 2, "obra-2", "obra-1", ""]),
    );
    assert.deepEqual(
      carregarListaIdsHome("favoritos", "usuario", ["fallback", "obra-2"]),
      ["fallback", "obra-2", "obra-1"],
    );
  });
  assert.deepEqual(chamadas, [
    ["get", "favoritos:usuario"],
    ["get", "favoritos:usuario"],
  ]);
});

test("home-storage-utils preserva fallbacks para armazenamento bloqueado e JSON inválido", () => {
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
      assert.equal(lerStorageUsuarioHome("favoritos", "usuario"), null);
      assert.deepEqual(carregarListaIdsHome("favoritos", "usuario", [" fallback ", "fallback"]), ["fallback"]);
      assert.equal(salvarJsonStorageUsuarioHome("favoritos", "usuario", ["obra"]), undefined);
      assert.equal(salvarListaIdsHome("favoritos", "usuario", ["obra"]), undefined);
    },
  );
  comStorage(
    {
      getItem() {
        return "{inválido";
      },
      setItem() {},
    },
    () => {
      assert.deepEqual(carregarListaIdsHome("favoritos", "usuario", ["fallback"]), ["fallback"]);
    },
  );
});

test("home-storage-utils preserva escrita e a fronteira da Home", () => {
  const chamadas = [];
  comStorage(
    {
      getItem() {
        return null;
      },
      setItem(chave, valor) {
        chamadas.push([chave, valor]);
      },
    },
    () => {
      salvarJsonStorageUsuarioHome("perfil", " usuario ", { nome: "Ana" });
      salvarListaIdsHome("favoritos", "usuario", [" obra-1 ", "obra-1", "obra-2"]);
    },
  );
  assert.deepEqual(chamadas, [
    ["perfil:usuario", JSON.stringify({ nome: "Ana" })],
    ["favoritos:usuario", JSON.stringify(["obra-1", "obra-2"])],
  ]);
  assert.match(modulo, /import \{ normalizarListaIdsHome \} from "\.\/home-collection-utils";/);
  for (const nomeFuncao of [
    "criarStorageKeyUsuarioHome",
    "lerStorageUsuarioHome",
    "salvarJsonStorageUsuarioHome",
    "carregarListaIdsHome",
    "salvarListaIdsHome",
  ]) {
    assert.match(modulo, new RegExp(`export function ${nomeFuncao}\\b`));
    assert.doesNotMatch(pagina, new RegExp(`function ${nomeFuncao}\\b`));
  }
  assert.match(pagina, /useHomeInitialData\(usuarioIdLogado, obrasCacheLocalHomeRef\)/);
  assert.match(
    loaderInicial,
    /from "\.\/home-storage-utils";/,
  );
  assert.match(modulo, /localStorage\.getItem/);
  assert.match(modulo, /localStorage\.setItem/);
  assert.match(modulo, /JSON\.parse/);
  assert.match(modulo, /JSON\.stringify/);
  assert.doesNotMatch(modulo, /supabase|useEffect|useState/);
});
