import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-local-storage-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const utilsJavascript = typescript.transpileModule(utilsSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  carregarJsonUsuarioPerfilAutor,
  carregarListaIdsPerfilBiblioteca,
  criarStorageKeyUsuarioPerfilBiblioteca,
  normalizarListaIdsPerfilBiblioteca,
  salvarJsonUsuarioPerfilAutor,
  salvarListaIdsPerfilBiblioteca,
} = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

function comStorage(storage, executar) {
  const windowAnterior = Object.getOwnPropertyDescriptor(globalThis, "window");
  const localStorageAnterior = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {},
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });

  try {
    return executar();
  } finally {
    if (windowAnterior) {
      Object.defineProperty(globalThis, "window", windowAnterior);
    } else {
      delete globalThis.window;
    }

    if (localStorageAnterior) {
      Object.defineProperty(globalThis, "localStorage", localStorageAnterior);
    } else {
      delete globalThis.localStorage;
    }
  }
}

function criarStorageMemoria(dados = new Map()) {
  return {
    dados,
    getItem(chave) {
      return dados.has(chave) ? dados.get(chave) : null;
    },
    setItem(chave, valor) {
      dados.set(chave, valor);
    },
  };
}

test("criar chave e normalizar lista preservam trim, filtro e ordem", () => {
  assert.equal(
    criarStorageKeyUsuarioPerfilBiblioteca("historietas-favoritas", " usuario-1 "),
    "historietas-favoritas:usuario-1",
  );
  assert.equal(criarStorageKeyUsuarioPerfilBiblioteca("historietas-favoritas", "   "), "");
  assert.deepEqual(normalizarListaIdsPerfilBiblioteca(null), []);
  assert.deepEqual(
    normalizarListaIdsPerfilBiblioteca([" obra-1 ", "", 12, "obra-1", " obra-1 "]),
    [" obra-1 ", "obra-1", " obra-1 "],
  );
});

test("guards sem window ou usuário preservam fallbacks e não gravam", () => {
  assert.deepEqual(carregarListaIdsPerfilBiblioteca("historietas-favoritas", "usuario-1"), []);
  assert.equal(carregarJsonUsuarioPerfilAutor("historietas-perfis", "usuario-1"), null);
  assert.equal(salvarListaIdsPerfilBiblioteca("historietas-favoritas", "", ["obra-1"]), undefined);
  assert.equal(salvarJsonUsuarioPerfilAutor("historietas-perfis", "", { nome: "Ana" }), undefined);
});

test("listas isolam usuários, preservam primeira ocorrência e deduplicam na leitura", () => {
  const storage = criarStorageMemoria();

  comStorage(storage, () => {
    salvarListaIdsPerfilBiblioteca(
      "historietas-favoritas",
      " usuario-a ",
      ["obra-1", "", "obra-1", " obra-2 "],
    );

    assert.equal(
      storage.dados.get("historietas-favoritas:usuario-a"),
      JSON.stringify(["obra-1", "obra-1", " obra-2 "]),
    );
    assert.deepEqual(
      carregarListaIdsPerfilBiblioteca("historietas-favoritas", "usuario-a"),
      ["obra-1", " obra-2 "],
    );
    assert.deepEqual(
      carregarListaIdsPerfilBiblioteca("historietas-favoritas", "usuario-b"),
      [],
    );
  });
});

test("JSON por usuário preserva serialização, troca de conta e dados inválidos", () => {
  const storage = criarStorageMemoria();

  comStorage(storage, () => {
    salvarJsonUsuarioPerfilAutor("historietas-perfis", "usuario-a", {
      nome: "Ana",
    });
    salvarJsonUsuarioPerfilAutor("historietas-perfis", "usuario-b", {
      nome: "Bia",
    });

    assert.deepEqual(
      carregarJsonUsuarioPerfilAutor("historietas-perfis", "usuario-a"),
      { nome: "Ana" },
    );
    assert.deepEqual(
      carregarJsonUsuarioPerfilAutor("historietas-perfis", "usuario-b"),
      { nome: "Bia" },
    );

    storage.dados.set("historietas-perfis:usuario-invalido", "{");
    assert.equal(
      carregarJsonUsuarioPerfilAutor("historietas-perfis", "usuario-invalido"),
      null,
    );
  });
});

test("falhas de localStorage preservam retornos seguros", () => {
  const storageIndisponivel = {
    getItem() {
      throw new Error("indisponível");
    },
    setItem() {
      throw new Error("indisponível");
    },
  };

  comStorage(storageIndisponivel, () => {
    assert.deepEqual(
      carregarListaIdsPerfilBiblioteca("historietas-favoritas", "usuario-1"),
      [],
    );
    assert.equal(
      carregarJsonUsuarioPerfilAutor("historietas-perfis", "usuario-1"),
      null,
    );
    assert.equal(
      salvarListaIdsPerfilBiblioteca("historietas-favoritas", "usuario-1", ["obra-1"]),
      undefined,
    );
    assert.equal(
      salvarJsonUsuarioPerfilAutor("historietas-perfis", "usuario-1", { nome: "Ana" }),
      undefined,
    );
  });
});

test("Perfil de Autor delega exclusivamente os helpers locais de storage", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?carregarJsonUsuarioPerfilAutor,[\s\S]*?carregarListaIdsPerfilBiblioteca,[\s\S]*?salvarJsonUsuarioPerfilAutor,[\s\S]*?salvarListaIdsPerfilBiblioteca,[\s\S]*?\} from "\.\/lib\/profile-local-storage-utils";/,
  );

  for (const helper of [
    "criarStorageKeyUsuarioPerfilBiblioteca",
    "normalizarListaIdsPerfilBiblioteca",
    "carregarListaIdsPerfilBiblioteca",
    "salvarListaIdsPerfilBiblioteca",
    "carregarJsonUsuarioPerfilAutor",
    "salvarJsonUsuarioPerfilAutor",
  ]) {
    assert.match(utilsSource, new RegExp(`export function ${helper}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
  }

  assert.equal(
    (pagina.match(/\bcriarStorageKeyUsuarioPerfilBiblioteca\b/g) || []).length,
    0,
  );
  assert.match(
    utilsSource,
    /criarStorageKeyUsuarioPerfilBiblioteca\(chave, userIdLimpo\)/,
  );
  assert.match(
    utilsSource,
    /const listaNormalizada = normalizarListaIdsPerfilBiblioteca\(lista\);/,
  );
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
  assert.doesNotMatch(utilsSource, /supabase|useState|useEffect/);
});
