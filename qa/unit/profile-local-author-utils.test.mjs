import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-local-author-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const storageRuntime = `
const criarStorageKeyUsuarioPerfilBiblioteca = (chave, userId) => {
  const userIdLimpo = userId.trim();
  return userIdLimpo ? \`\${chave}:\${userIdLimpo}\` : "";
};
const carregarJsonUsuarioPerfilAutor = (chave, userId = "") => {
  const userIdLimpo = userId.trim();
  if (typeof window === "undefined" || !userIdLimpo) return null;
  try {
    const texto = localStorage.getItem(
      criarStorageKeyUsuarioPerfilBiblioteca(chave, userIdLimpo),
    );
    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
};
const salvarJsonUsuarioPerfilAutor = (chave, userId, valor) => {
  const userIdLimpo = userId.trim();
  if (typeof window === "undefined" || !userIdLimpo) return;
  try {
    localStorage.setItem(
      criarStorageKeyUsuarioPerfilBiblioteca(chave, userIdLimpo),
      JSON.stringify(valor),
    );
  } catch {}
};`;
const utilsJavascript = typescript.transpileModule(
  utilsSource
    .replace(
      `import {
  AUTHOR_PROFILE_STORAGE_KEY,
  AUTHOR_RATINGS_STORAGE_KEY,
} from "../constants";`,
      `const AUTHOR_PROFILE_STORAGE_KEY = "historietas-perfis-autores";
const AUTHOR_RATINGS_STORAGE_KEY = "historietas-autores-avaliacoes";`,
    )
    .replace(
      'import { obterChaveAvaliacaoAutor } from "./profile-formatters";',
      `const obterChaveAvaliacaoAutor = (perfil) =>
  perfil.autorId.trim().toLowerCase() || perfil.nome.trim().toLowerCase();`,
    )
    .replace(
      `import {
  carregarJsonUsuarioPerfilAutor,
  salvarJsonUsuarioPerfilAutor,
} from "./profile-local-storage-utils";`,
      storageRuntime,
    )
    .replace(
      'import { normalizarPerfisAutores } from "./work-normalizers";',
      `const normalizarPerfisAutores = (valor) => {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return {};
  return Object.fromEntries(
    Object.entries(valor)
      .filter(([autor, perfil]) => autor.trim() && perfil && typeof perfil === "object")
      .map(([autor, perfil]) => [autor.trim().toLowerCase(), {
        avatar: typeof perfil.avatar === "string" ? perfil.avatar : "",
        avatarNome: typeof perfil.avatarNome === "string" ? perfil.avatarNome : "",
        bio: typeof perfil.bio === "string" ? perfil.bio.slice(0, 90) : "",
        sobreBio: typeof perfil.sobreBio === "string" ? perfil.sobreBio.slice(0, 600) : "",
        mostrarDestaques: perfil.mostrarDestaques === true,
      }]),
  );
};`,
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const {
  carregarAvaliacoesAutoresLocais,
  carregarPerfisAutores,
  obterAvaliacaoAutorLocal,
  salvarAvaliacaoAutorLocal,
} = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

function comStorage(storage, executar) {
  const windowAnterior = Object.getOwnPropertyDescriptor(globalThis, "window");
  const localStorageAnterior = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );

  Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });

  try {
    return executar();
  } finally {
    if (windowAnterior) Object.defineProperty(globalThis, "window", windowAnterior);
    else delete globalThis.window;
    if (localStorageAnterior) {
      Object.defineProperty(globalThis, "localStorage", localStorageAnterior);
    } else delete globalThis.localStorage;
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

test("avaliações locais preservam isolamento, valores válidos e incrementos de meio ponto", () => {
  const storage = criarStorageMemoria();
  const perfil = { autorId: " Autor-A ", nome: "Ana" };

  comStorage(storage, () => {
    salvarAvaliacaoAutorLocal(perfil, 2.76, " usuario-a ");
    salvarAvaliacaoAutorLocal(perfil, 4.5, "usuario-b");

    assert.equal(obterAvaliacaoAutorLocal(perfil, "usuario-a"), 3);
    assert.equal(obterAvaliacaoAutorLocal(perfil, "usuario-b"), 4.5);
    assert.equal(obterAvaliacaoAutorLocal(perfil, "usuario-c"), 0);

    salvarAvaliacaoAutorLocal(perfil, 0, "usuario-a");
    assert.equal(obterAvaliacaoAutorLocal(perfil, "usuario-a"), 0);
    assert.equal(obterAvaliacaoAutorLocal(perfil, "usuario-b"), 4.5);
  });
});

test("avaliações e perfis locais preservam fallbacks para dados inválidos", () => {
  const storage = criarStorageMemoria(
    new Map([
      ["historietas-autores-avaliacoes:usuario-a", "[]"],
      [
        "historietas-perfis-autores:usuario-a",
        JSON.stringify({
          " Ana ": { bio: "bio", mostrarDestaques: true },
          " ": { bio: "descartar" },
        }),
      ],
    ]),
  );

  comStorage(storage, () => {
    assert.deepEqual(carregarAvaliacoesAutoresLocais("usuario-a"), {});
    assert.deepEqual(carregarPerfisAutores("usuario-a"), {
      ana: {
        avatar: "",
        avatarNome: "",
        bio: "bio",
        sobreBio: "",
        mostrarDestaques: true,
      },
    });
    assert.deepEqual(carregarPerfisAutores(""), {});
  });
});

test("storage indisponível preserva retornos seguros das avaliações e perfis", () => {
  const storageIndisponivel = {
    getItem() {
      throw new Error("indisponível");
    },
    setItem() {
      throw new Error("indisponível");
    },
  };

  comStorage(storageIndisponivel, () => {
    assert.deepEqual(carregarAvaliacoesAutoresLocais("usuario-a"), {});
    assert.equal(
      obterAvaliacaoAutorLocal({ autorId: "autor-a", nome: "Ana" }, "usuario-a"),
      0,
    );
    assert.doesNotThrow(() =>
      salvarAvaliacaoAutorLocal({ autorId: "autor-a", nome: "Ana" }, 5, "usuario-a"),
    );
    assert.deepEqual(carregarPerfisAutores("usuario-a"), {});
  });
});

test("Perfil de Autor delega exclusivamente avaliações e perfis locais", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?carregarPerfisAutores,[\s\S]*?obterAvaliacaoAutorLocal,[\s\S]*?salvarAvaliacaoAutorLocal,[\s\S]*?\} from "\.\/lib\/profile-local-author-utils";/,
  );

  for (const helper of [
    "carregarAvaliacoesAutoresLocais",
    "obterAvaliacaoAutorLocal",
    "salvarAvaliacaoAutorLocal",
    "carregarPerfisAutores",
  ]) {
    assert.match(utilsSource, new RegExp(`export function ${helper}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
  }

  assert.match(utilsSource, /carregarJsonUsuarioPerfilAutor/);
  assert.match(utilsSource, /salvarJsonUsuarioPerfilAutor/);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
});
