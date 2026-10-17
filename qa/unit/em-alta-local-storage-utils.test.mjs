import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-local-storage-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const interacoesLocaisRanking = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-ranking-local-interactions.ts",
    import.meta.url,
  ),
  "utf8",
);
const colecoesRanking = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-ranking-collections-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const normalizadorObrasSupabase = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-supabase-work-normalizer.ts",
    import.meta.url,
  ),
  "utf8",
);
const loaderObrasSupabase = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-supabase-works-loader.ts",
    import.meta.url,
  ),
  "utf8",
);
const moduloExecutavel = modulo
  .replace(
    'import { normalizarTexto } from "../../../lib/utils";',
    `const normalizarTexto = (texto) => texto
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/\\s+/g, " ");`,
  )
  .replace(
    'import { normalizarListaIdsEmAlta } from "./em-alta-ranking-list-utils";',
    `const normalizarListaIdsEmAlta = (valor) => Array.isArray(valor)
      ? Array.from(new Set(valor
        .filter((id) => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean)))
      : [];`,
  );
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  adicionarAvatarAutorLocalEmAlta,
  AUTHOR_PROFILE_STORAGE_KEY,
  carregarAvataresAutoresLocaisEmAlta,
  carregarListaIdsLocalEmAlta,
  COMPLETED_STORAGE_KEY,
  criarStorageKeyUsuarioEmAlta,
  FAVORITES_STORAGE_KEY,
  normalizarChaveAutorEmAlta,
  obterAvatarAutorLocalEmAlta,
  RATED_WORKS_STORAGE_KEY,
  salvarListaIdsLocalEmAlta,
  VIEWED_WORKS_STORAGE_KEY,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

function comBrowser(armazenamento, executar) {
  const windowOriginal = globalThis.window;
  const storageOriginal = globalThis.localStorage;

  globalThis.window = {};
  globalThis.localStorage = armazenamento;

  try {
    executar();
  } finally {
    if (windowOriginal === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = windowOriginal;
    }

    if (storageOriginal === undefined) {
      delete globalThis.localStorage;
    } else {
      globalThis.localStorage = storageOriginal;
    }
  }
}

function criarStorage(valores = {}) {
  const dados = new Map(Object.entries(valores));

  return {
    dados,
    getItem(chave) {
      return dados.get(chave) ?? null;
    },
    setItem(chave, valor) {
      dados.set(chave, valor);
    },
  };
}

test("preserva as chaves literais de storage de Em Alta", () => {
  assert.equal(FAVORITES_STORAGE_KEY, "historietas-obras-favoritas");
  assert.equal(COMPLETED_STORAGE_KEY, "historietas-obras-concluidas");
  assert.equal(VIEWED_WORKS_STORAGE_KEY, "historietas-obras-visualizacoes");
  assert.equal(RATED_WORKS_STORAGE_KEY, "historietas-obras-avaliacoes");
  assert.equal(AUTHOR_PROFILE_STORAGE_KEY, "historietas-perfis-autores");
});

test("cria chave de usuário e normaliza chave de autor", () => {
  assert.equal(
    criarStorageKeyUsuarioEmAlta("historietas-obras-favoritas", " usuario-a "),
    "historietas-obras-favoritas:usuario-a",
  );
  assert.equal(criarStorageKeyUsuarioEmAlta("chave", "  "), "");
  assert.equal(normalizarChaveAutorEmAlta("  Ana   Clara "), "ana clara");
});

test("adiciona somente avatares e chaves válidas", () => {
  const avatares = new Map();

  adicionarAvatarAutorLocalEmAlta(avatares, " Ana ", " avatar-a ");
  adicionarAvatarAutorLocalEmAlta(avatares, "Bia", 1);
  adicionarAvatarAutorLocalEmAlta(avatares, "", "avatar-c");
  adicionarAvatarAutorLocalEmAlta(avatares, "Caio", " ");

  assert.deepEqual([...avatares], [["ana", "avatar-a"]]);
});

test("carrega avatares por usuário, aliases e todos os campos suportados", () => {
  const chave = `${AUTHOR_PROFILE_STORAGE_KEY}:usuario-a`;
  const storage = criarStorage({
    [chave]: JSON.stringify({
      "id-ana": {
        avatar: "avatar-ana",
        avatar_url: "não-deve-ser-prioritário",
        nome: "Ana Clara",
      },
      "id-bia": { avatar_url: "avatar-bia", nome: "Bia" },
      "id-caio": { foto_url: "avatar-caio", nome: "Caio" },
      "id-duda": { imagem_url: "avatar-duda", nome: "Duda" },
      "id-eva": { photo_url: "avatar-eva", nome: "Eva" },
    }),
  });
  let leituras = 0;
  const getItemOriginal = storage.getItem;
  storage.getItem = (chaveStorage) => {
    leituras += 1;
    return getItemOriginal(chaveStorage);
  };

  comBrowser(storage, () => {
    const avatares = carregarAvataresAutoresLocaisEmAlta([
      " usuario-a ",
      "usuario-a",
    ]);

    assert.equal(leituras, 1);
    assert.equal(avatares.get("id-ana"), "avatar-ana");
    assert.equal(avatares.get("ana clara"), "avatar-ana");
    assert.equal(avatares.get("id-bia"), "avatar-bia");
    assert.equal(avatares.get("id-caio"), "avatar-caio");
    assert.equal(avatares.get("id-duda"), "avatar-duda");
    assert.equal(avatares.get("id-eva"), "avatar-eva");
  });
});

test("tolera SSR e dados de avatares inválidos", () => {
  assert.deepEqual([...carregarAvataresAutoresLocaisEmAlta(["usuario-a"])], []);

  const storage = criarStorage({
    [`${AUTHOR_PROFILE_STORAGE_KEY}:usuario-a`]: "{inválido",
    [`${AUTHOR_PROFILE_STORAGE_KEY}:usuario-b`]: JSON.stringify([]),
  });

  comBrowser(storage, () => {
    assert.deepEqual(
      [...carregarAvataresAutoresLocaisEmAlta(["usuario-a", "usuario-b"])],
      [],
    );
  });
});

test("encontra avatar por identificador, nome e nome normalizado", () => {
  const avatares = new Map([
    ["autor-a", "avatar-id"],
    ["ana clara", "avatar-nome"],
    ["aurea", "avatar-normalizado"],
  ]);

  assert.equal(
    obterAvatarAutorLocalEmAlta(avatares, "Outro nome", "autor-a"),
    "avatar-id",
  );
  assert.equal(
    obterAvatarAutorLocalEmAlta(avatares, "Ana Clara", ""),
    "avatar-nome",
  );
  assert.equal(
    obterAvatarAutorLocalEmAlta(avatares, "Áurea", ""),
    "avatar-normalizado",
  );
  assert.equal(obterAvatarAutorLocalEmAlta(avatares, "Sem perfil", ""), "");
});

test("carrega IDs locais com SSR, JSON inválido e normalização", () => {
  assert.deepEqual(carregarListaIdsLocalEmAlta(FAVORITES_STORAGE_KEY, "usuario-a"), []);

  const storage = criarStorage({
    [`${FAVORITES_STORAGE_KEY}:usuario-a`]: JSON.stringify([
      " obra-a ",
      "obra-a",
      1,
      "obra-b",
    ]),
    [`${FAVORITES_STORAGE_KEY}:usuario-b`]: "{inválido",
  });

  comBrowser(storage, () => {
    assert.deepEqual(carregarListaIdsLocalEmAlta(FAVORITES_STORAGE_KEY, ""), []);
    assert.deepEqual(
      carregarListaIdsLocalEmAlta(FAVORITES_STORAGE_KEY, " usuario-a "),
      ["obra-a", "obra-b"],
    );
    assert.deepEqual(
      carregarListaIdsLocalEmAlta(FAVORITES_STORAGE_KEY, "usuario-b"),
      [],
    );
  });
});

test("salva IDs normalizados e tolera falhas de storage", () => {
  const storage = criarStorage();

  salvarListaIdsLocalEmAlta(FAVORITES_STORAGE_KEY, "usuario-a", ["obra-a"]);

  comBrowser(storage, () => {
    salvarListaIdsLocalEmAlta(FAVORITES_STORAGE_KEY, " usuario-a ", [
      " obra-a ",
      "obra-a",
      "obra-b",
    ]);
    assert.deepEqual(
      JSON.parse(storage.dados.get(`${FAVORITES_STORAGE_KEY}:usuario-a`)),
      ["obra-a", "obra-b"],
    );

    globalThis.localStorage = {
      getItem: storage.getItem,
      setItem() {
        throw new Error("storage bloqueado");
      },
    };
    assert.doesNotThrow(() =>
      salvarListaIdsLocalEmAlta(FAVORITES_STORAGE_KEY, "usuario-a", ["obra-c"]),
    );
  });
});

test("Em Alta delega a persistência local sem manter implementações duplicadas", () => {
  const importacao = colecoesRanking.match(
    /import \{([^}]*)\} from "\.\/em-alta-local-storage-utils";/,
  );

  assert.ok(importacao);

  for (const nome of [
    "carregarListaIdsLocalEmAlta",
    "salvarListaIdsLocalEmAlta",
    "FAVORITES_STORAGE_KEY",
    "COMPLETED_STORAGE_KEY",
  ]) {
    assert.match(importacao[1], new RegExp(`\\b${nome}\\b`));
  }

  assert.match(
    interacoesLocaisRanking,
    /import \{[\s\S]*?criarStorageKeyUsuarioEmAlta,[\s\S]*?RATED_WORKS_STORAGE_KEY,[\s\S]*?VIEWED_WORKS_STORAGE_KEY,[\s\S]*?\} from "\.\/em-alta-local-storage-utils";/,
  );

  assert.match(
    pagina,
    /import \{ carregarColecoesRankingEmAlta \} from "\.\/lib\/em-alta-ranking-collections-loader";/,
  );
  assert.match(pagina, /carregarColecoesRankingEmAlta\(userIdAtual\)/);
  assert.match(
    loaderObrasSupabase,
    /import \{ carregarAvataresAutoresLocaisEmAlta \} from "\.\/em-alta-local-storage-utils";/,
  );
  assert.match(
    normalizadorObrasSupabase,
    /import \{ obterAvatarAutorLocalEmAlta \} from "\.\/em-alta-local-storage-utils";/,
  );

  for (const nome of [
    "FAVORITES_STORAGE_KEY",
    "COMPLETED_STORAGE_KEY",
    "VIEWED_WORKS_STORAGE_KEY",
    "RATED_WORKS_STORAGE_KEY",
    "AUTHOR_PROFILE_STORAGE_KEY",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`const ${nome} =`));
  }

  for (const helper of [
    "criarStorageKeyUsuarioEmAlta",
    "normalizarChaveAutorEmAlta",
    "adicionarAvatarAutorLocalEmAlta",
    "carregarAvataresAutoresLocaisEmAlta",
    "carregarListaIdsLocalEmAlta",
    "salvarListaIdsLocalEmAlta",
  ]) {
    assert.match(modulo, new RegExp(`export function ${helper}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
  }

  assert.match(
    modulo,
    /export function obterAvatarAutorLocalEmAlta\(/,
  );
  assert.doesNotMatch(importacao[1], /\bobterAvatarAutorLocalEmAlta\b/);
});

test("módulo de storage permanece isolado de UI, Supabase e autenticação", () => {
  assert.match(
    modulo,
    /import \{ normalizarTexto \} from "\.\.\/\.\.\/\.\.\/lib\/utils";/,
  );
  assert.match(
    modulo,
    /import \{ normalizarListaIdsEmAlta \} from "\.\/em-alta-ranking-list-utils";/,
  );

  for (const termoProibido of [
    /from ["']react["']/i,
    /\buse[A-Z]\w*\b/,
    /\bsupabase\b/i,
    /\bauth\b/i,
    /<[A-Z][\w.]*/,
  ]) {
    assert.doesNotMatch(modulo, termoProibido);
  }
});
