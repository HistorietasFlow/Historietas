import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-author-storage-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(
  new URL("../../app/hooks/use-home-initial-data.ts", import.meta.url),
  "utf8",
);
const moduloExecutavel = modulo
  .replace(
    `import {
  lerStorageUsuarioHome,
  salvarJsonStorageUsuarioHome,
} from "./home-storage-utils";\n`,
    `const lerStorageUsuarioHome = (chave, userId) => {
  const userIdLimpo = userId.trim();
  if (typeof window === "undefined" || !userIdLimpo) return null;
  return localStorage.getItem(chave + ":" + userIdLimpo);
};
const salvarJsonStorageUsuarioHome = (chave, userId, valor) => {
  const userIdLimpo = userId.trim();
  if (typeof window === "undefined" || !userIdLimpo) return;
  localStorage.setItem(chave + ":" + userIdLimpo, JSON.stringify(valor));
};
`,
  )
  .replace(
    `import {
  normalizarChaveAutor,
  normalizarPerfisAutoresSalvos,
} from "./home-author-profile-utils";\n`,
    `const normalizarChaveAutor = (nome) => String(nome || "")
  .normalize("NFD")
  .replace(/[\\u0300-\\u036f]/g, "")
  .toLowerCase()
  .replace(/\\s+/g, " ")
  .trim();
const normalizarPerfisAutoresSalvos = (valor) => {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return {};
  return Object.fromEntries(Object.entries(valor).flatMap(([chave, perfil]) => (
    perfil && typeof perfil === "object" && !Array.isArray(perfil)
      ? [[chave, {
        avatar: typeof perfil.avatar === "string" ? perfil.avatar : "",
        avatarNome: typeof perfil.avatarNome === "string" ? perfil.avatarNome : "",
        bio: typeof perfil.bio === "string" ? perfil.bio : "",
      }]]
      : []
  )));
};
`,
  );
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  carregarPerfisAutoresHomeSalvos,
  salvarPerfisSupabaseHomeNoStorage,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function comStorage(storage, callback) {
  const descritorWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const descritorStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

  Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });

  try {
    return callback();
  } finally {
    if (descritorWindow) Object.defineProperty(globalThis, "window", descritorWindow);
    else delete globalThis.window;
    if (descritorStorage) Object.defineProperty(globalThis, "localStorage", descritorStorage);
    else delete globalThis.localStorage;
  }
}

const perfil = (overrides = {}) => ({
  avatar: "ana.png",
  bio: "Bio da Ana",
  nome: "Ana Souza",
  userId: "user-ana",
  ...overrides,
});

test("home-author-storage-utils preserva usuário vazio, JSON e fallback inválido", () => {
  assert.deepEqual(carregarPerfisAutoresHomeSalvos(""), {});

  comStorage(
    {
      getItem() {
        return JSON.stringify({ ana: { avatar: "ana.png", avatarNome: "", bio: "Bio" } });
      },
      setItem() {},
    },
    () => {
      assert.deepEqual(carregarPerfisAutoresHomeSalvos(" usuario "), {
        ana: { avatar: "ana.png", avatarNome: "", bio: "Bio" },
      });
    },
  );

  comStorage(
    {
      getItem() {
        return "{inválido";
      },
      setItem() {},
    },
    () => assert.deepEqual(carregarPerfisAutoresHomeSalvos("usuario"), {}),
  );
});

test("home-author-storage-utils preserva merge e as múltiplas chaves de cada perfil", () => {
  const gravacoes = [];
  comStorage(
    {
      getItem() {
        return JSON.stringify({ existente: { avatar: "existente.png", avatarNome: "", bio: "Bio existente" } });
      },
      setItem(chave, valor) {
        gravacoes.push([chave, JSON.parse(valor)]);
      },
    },
    () => salvarPerfisSupabaseHomeNoStorage([perfil()], " usuario "),
  );

  assert.equal(gravacoes.length, 1);
  const [chave, perfis] = gravacoes[0];
  assert.equal(chave, "historietas-perfis-autores:usuario");
  assert.deepEqual(perfis.existente, { avatar: "existente.png", avatarNome: "", bio: "Bio existente" });
  for (const chavePerfil of ["user-ana", "Ana Souza", "ana souza"]) {
    assert.deepEqual(perfis[chavePerfil], { avatar: "ana.png", avatarNome: "", bio: "Bio da Ana" });
  }
});

test("home-author-storage-utils ignora perfis vazios e chaves vazias", () => {
  const gravacoes = [];
  comStorage(
    {
      getItem() {
        return null;
      },
      setItem(...args) {
        gravacoes.push(args);
      },
    },
    () => {
      salvarPerfisSupabaseHomeNoStorage([], "usuario");
      salvarPerfisSupabaseHomeNoStorage([perfil({ nome: "   ", userId: "  " })], "usuario");
    },
  );

  assert.equal(gravacoes.length, 1);
  assert.deepEqual(JSON.parse(gravacoes[0][1]), {});
});

test("home-author-storage-utils não deixa storage bloqueado quebrar a Home", () => {
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
      assert.deepEqual(carregarPerfisAutoresHomeSalvos("usuario"), {});
      assert.equal(salvarPerfisSupabaseHomeNoStorage([perfil()], "usuario"), undefined);
    },
  );
});

test("home-author-storage-utils estabelece a fronteira de persistência", () => {
  assert.match(modulo, /import \{[\s\S]*?lerStorageUsuarioHome,[\s\S]*?salvarJsonStorageUsuarioHome,[\s\S]*?\} from "\.\/home-storage-utils";/);
  assert.match(modulo, /import \{[\s\S]*?normalizarChaveAutor,[\s\S]*?normalizarPerfisAutoresSalvos,[\s\S]*?\} from "\.\/home-author-profile-utils";/);
  assert.match(modulo, /const AUTHOR_PROFILE_STORAGE_KEY = "historietas-perfis-autores";/);
  for (const nomeFuncao of [
    "carregarPerfisAutoresHomeSalvos",
    "salvarPerfisSupabaseHomeNoStorage",
  ]) {
    assert.match(modulo, new RegExp(`export function ${nomeFuncao}\\b`));
    assert.doesNotMatch(pagina, new RegExp(`function ${nomeFuncao}\\b`));
  }
  assert.match(pagina, /from "\.\/hooks\/use-home-initial-data";/);
  assert.match(hook, /import \{ carregarPerfisAutoresHomeSalvos \} from "\.\.\/lib\/home-author-storage-utils";/);
  assert.match(modulo, /JSON\.parse/);
  assert.match(modulo, /\[\s*perfil\.userId,\s*perfil\.nome,\s*normalizarChaveAutor\(perfil\.nome\),\s*perfil\.nome\.trim\(\)\.replace\(\/\\s\+\/g, " "\)\.toLowerCase\(\),\s*\]/);
  assert.doesNotMatch(modulo, /supabase|useEffect|useState/);
});
