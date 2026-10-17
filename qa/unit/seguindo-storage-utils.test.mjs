import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/seguindo/lib/seguindo-storage-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const dadosLocais = readFileSync(
  new URL(
    "../../app/seguindo/lib/seguindo-local-data-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const modulo = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);
const {
  criarStorageKeyUsuarioSeguindo,
  lerJsonStorageUsuarioSeguindo,
  salvarJsonStorageUsuarioSeguindo,
} = modulo;

test("chave de storage preserva trim e exige usuário", () => {
  assert.equal(
    criarStorageKeyUsuarioSeguindo("historietas-obras", " usuario-1 "),
    "historietas-obras:usuario-1",
  );
  assert.equal(
    criarStorageKeyUsuarioSeguindo("historietas-obras", "   "),
    "",
  );
});

test("leitura de JSON preserva fallbacks e tolera conteúdo inválido", () => {
  const anteriorWindow = globalThis.window;
  const anteriorStorage = globalThis.localStorage;

  try {
    globalThis.window = {};
    globalThis.localStorage = {
      getItem(chave) {
        if (chave === "lista:usuario-1") {
          return JSON.stringify(["a", "b"]);
        }
        if (chave === "lista:invalido") {
          return "{";
        }
        return null;
      },
    };

    assert.deepEqual(
      lerJsonStorageUsuarioSeguindo("lista", " usuario-1 "),
      ["a", "b"],
    );
    assert.equal(
      lerJsonStorageUsuarioSeguindo("lista", "invalido"),
      null,
    );
    assert.equal(
      lerJsonStorageUsuarioSeguindo("lista", ""),
      null,
    );
  } finally {
    globalThis.window = anteriorWindow;
    globalThis.localStorage = anteriorStorage;
  }
});

test("escrita preserva chave por usuário, JSON e falhas silenciosas", () => {
  const anteriorWindow = globalThis.window;
  const anteriorStorage = globalThis.localStorage;
  const gravacoes = [];

  try {
    globalThis.window = {};
    globalThis.localStorage = {
      setItem(chave, valor) {
        gravacoes.push([chave, valor]);
      },
    };

    salvarJsonStorageUsuarioSeguindo(
      "lista",
      " usuario-2 ",
      { ativo: true },
    );
    salvarJsonStorageUsuarioSeguindo("lista", "   ", ["ignorar"]);

    assert.deepEqual(gravacoes, [
      ["lista:usuario-2", JSON.stringify({ ativo: true })],
    ]);

    globalThis.localStorage = {
      setItem() {
        throw new Error("storage indisponível");
      },
    };

    assert.doesNotThrow(() =>
      salvarJsonStorageUsuarioSeguindo("lista", "usuario-2", ["a"]),
    );
  } finally {
    globalThis.window = anteriorWindow;
    globalThis.localStorage = anteriorStorage;
  }
});

test("página e snapshot local delegam storage por usuário ao módulo dedicado", () => {
  assert.match(
    pagina,
    /salvarJsonStorageUsuarioSeguindo,[\s\S]*?from "\.\/lib\/seguindo-storage-utils";/,
  );
  assert.match(
    dadosLocais,
    /lerJsonStorageUsuarioSeguindo,[\s\S]*?from "\.\/seguindo-storage-utils";/,
  );

  for (const source of [pagina, dadosLocais]) {
    assert.doesNotMatch(
      source,
      /function criarStorageKeyUsuarioSeguindo\(/,
    );
    assert.doesNotMatch(
      source,
      /function lerJsonStorageUsuarioSeguindo\(/,
    );
    assert.doesNotMatch(
      source,
      /function salvarJsonStorageUsuarioSeguindo\(/,
    );
  }
});
