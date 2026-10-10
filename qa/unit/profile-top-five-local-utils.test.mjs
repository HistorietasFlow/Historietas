import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-top-five-local-utils.ts",
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
  TOP_FIVE_LIKES_STORAGE_KEY,
  TOP_FIVE_MAXIMO,
  TOP_FIVE_STORAGE_KEY,
} from "../constants";`,
      `const TOP_FIVE_LIKES_STORAGE_KEY = "historietas-top-5-curtidas";
const TOP_FIVE_MAXIMO = 5;
const TOP_FIVE_STORAGE_KEY = "historietas-top-5-obras";`,
    )
    .replace(
      `import {
  criarChaveCurtidaTopFivePerfil,
  normalizarCurtidasTopFiveLocais,
} from "./library-normalizers";`,
      `const criarChaveCurtidaTopFivePerfil = (perfilUserId) =>
  perfilUserId.trim().toLowerCase();
const normalizarCurtidasTopFiveLocais = (valor) => {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return {};
  return Object.fromEntries(Object.entries(valor).flatMap(([perfilId, curtidas]) =>
    !perfilId.trim() || !Array.isArray(curtidas) ? [] : [[
      criarChaveCurtidaTopFivePerfil(perfilId),
      Array.from(new Set(curtidas
        .filter((usuarioId) => typeof usuarioId === "string" && Boolean(usuarioId.trim()))
        .map((usuarioId) => usuarioId.trim().toLowerCase()),
      )),
    ]],
  ));
};`,
    )
    .replace(
      `import {
  carregarJsonUsuarioPerfilAutor,
  salvarJsonUsuarioPerfilAutor,
} from "./profile-local-storage-utils";`,
      storageRuntime,
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const {
  carregarCurtidasTopFiveLocais,
  carregarTopFivePerfilAutor,
  salvarCurtidaTopFiveLocal,
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

test("Top 5 preserva isolamento por conta, deduplicação e limite de cinco obras", () => {
  const storage = criarStorageMemoria(
    new Map([
      [
        "historietas-top-5-obras:usuario-a",
        JSON.stringify(["obra-1", "obra-1", "", "obra-2", "obra-3", "obra-4", "obra-5", "obra-6"]),
      ],
      ["historietas-top-5-obras:usuario-b", JSON.stringify(["obra-b"])],
    ]),
  );

  comStorage(storage, () => {
    assert.deepEqual(carregarTopFivePerfilAutor(" usuario-a "), [
      "obra-1",
      "obra-2",
      "obra-3",
      "obra-4",
      "obra-5",
    ]);
    assert.deepEqual(carregarTopFivePerfilAutor("usuario-b"), ["obra-b"]);
    assert.deepEqual(carregarTopFivePerfilAutor(""), []);
  });
});

test("curtidas locais preservam repetição, alternância e isolamento entre contas", () => {
  const storage = criarStorageMemoria();

  comStorage(storage, () => {
    salvarCurtidaTopFiveLocal(" Perfil-A ", " Usuario-A ", true);
    salvarCurtidaTopFiveLocal(" Perfil-A ", " Usuario-A ", true);

    assert.deepEqual(carregarCurtidasTopFiveLocais("perfil-a", "usuario-a"), {
      total: 1,
      curtiu: true,
    });
    assert.deepEqual(carregarCurtidasTopFiveLocais("perfil-a", "usuario-b"), {
      total: 0,
      curtiu: false,
    });

    salvarCurtidaTopFiveLocal("perfil-a", "usuario-a", false);
    assert.deepEqual(carregarCurtidasTopFiveLocais("perfil-a", "usuario-a"), {
      total: 0,
      curtiu: false,
    });
  });
});

test("Top 5 preserva fallbacks quando o armazenamento falha", () => {
  const storageIndisponivel = {
    getItem() {
      throw new Error("indisponível");
    },
    setItem() {
      throw new Error("indisponível");
    },
  };

  comStorage(storageIndisponivel, () => {
    assert.deepEqual(carregarTopFivePerfilAutor("usuario-a"), []);
    assert.deepEqual(carregarCurtidasTopFiveLocais("perfil-a", "usuario-a"), {
      total: 0,
      curtiu: false,
    });
    assert.doesNotThrow(() =>
      salvarCurtidaTopFiveLocal("perfil-a", "usuario-a", true),
    );
  });
});

test("Perfil de Autor delega exclusivamente o Top 5 local", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?carregarCurtidasTopFiveLocais,[\s\S]*?carregarTopFivePerfilAutor,[\s\S]*?salvarCurtidaTopFiveLocal,[\s\S]*?\} from "\.\/lib\/profile-top-five-local-utils";/,
  );

  for (const helper of [
    "carregarTopFivePerfilAutor",
    "carregarCurtidasTopFiveLocais",
    "salvarCurtidaTopFiveLocal",
  ]) {
    assert.match(utilsSource, new RegExp(`export function ${helper}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
  }

  assert.match(utilsSource, /carregarJsonUsuarioPerfilAutor/);
  assert.match(utilsSource, /salvarJsonUsuarioPerfilAutor/);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
});
