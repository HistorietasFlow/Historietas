import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

function transpilarModuloTypescript(caminho) {
  const texto = readFileSync(new URL(caminho, import.meta.url), "utf8");

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

const storageJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-user-storage.ts",
);
const storageUrl = criarUrlModulo(storageJavascript);
const comentariosJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-local-comment-storage-utils.ts",
).replace('from "./obra-user-storage";', `from "${storageUrl}";`);
const {
  WORK_COMMENTS_STORAGE_KEY,
  carregarComentariosObraLocais,
  salvarComentariosObraLocais,
} = await import(criarUrlModulo(comentariosJavascript));

function criarLocalStorage(
  valoresIniciais = {},
  { falharLeitura = false, falharEscrita = false } = {},
) {
  const valores = new Map(Object.entries(valoresIniciais));

  return {
    getItem(chave) {
      if (falharLeitura) {
        throw new Error("leitura indisponivel");
      }

      return valores.get(chave) ?? null;
    },
    setItem(chave, valor) {
      if (falharEscrita) {
        throw new Error("escrita indisponivel");
      }

      valores.set(chave, String(valor));
    },
  };
}

function executarComStorageNavegador(valoresIniciais, executar, opcoes = {}) {
  const windowAnterior = Object.getOwnPropertyDescriptor(globalThis, "window");
  const localStorageAnterior = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  const localStorage = criarLocalStorage(valoresIniciais, opcoes);

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

function criarComentario({
  id = "comentario",
  obraId = "obra-a",
  userId = "usuario-a",
  local = true,
} = {}) {
  return {
    id,
    obraId,
    userId,
    nome: "Nome",
    avatar: "",
    texto: `Texto ${id}`,
    criadoEm: "2026-01-02T03:04:05.000Z",
    comentarioPaiId: "",
    curtidas: [],
    local,
  };
}

test("isola os comentarios por usuario e obra e nao le sem IDs", () => {
  executarComStorageNavegador(
    {
      [`${WORK_COMMENTS_STORAGE_KEY}:usuario-a`]: JSON.stringify({
        "obra-a": [criarComentario({ id: "comentario-a" })],
      }),
      [`${WORK_COMMENTS_STORAGE_KEY}:usuario-b`]: JSON.stringify({
        "obra-b": [
          criarComentario({
            id: "comentario-b",
            obraId: "obra-b",
            userId: "usuario-b",
          }),
        ],
      }),
    },
    () => {
      assert.deepEqual(
        carregarComentariosObraLocais(" usuario-a ", " obra-a ").map(
          (comentario) => comentario.id,
        ),
        ["comentario-a"],
      );
      assert.deepEqual(
        carregarComentariosObraLocais("usuario-b", "obra-b").map(
          (comentario) => comentario.id,
        ),
        ["comentario-b"],
      );
      assert.deepEqual(carregarComentariosObraLocais("", "obra-a"), []);
      assert.deepEqual(carregarComentariosObraLocais("usuario-a", ""), []);
    },
  );
});

test("retorna vazio para JSON, raiz ou lista de comentarios invalidos", () => {
  ["{invalido", "null", "1", "[]"].forEach((valor) => {
    executarComStorageNavegador(
      { [`${WORK_COMMENTS_STORAGE_KEY}:usuario-a`]: valor },
      () => {
        assert.deepEqual(carregarComentariosObraLocais("usuario-a", "obra-a"), []);
      },
    );
  });

  executarComStorageNavegador(
    {
      [`${WORK_COMMENTS_STORAGE_KEY}:usuario-a`]: JSON.stringify({
        "obra-a": {},
      }),
    },
    () => {
      assert.deepEqual(carregarComentariosObraLocais("usuario-a", "obra-a"), []);
    },
  );
});

test("normaliza comentarios, fallbacks, parentesco e curtidas locais", () => {
  executarComStorageNavegador(
    {
      [`${WORK_COMMENTS_STORAGE_KEY}:usuario-a`]: JSON.stringify({
        "obra-a": [
          {
            id: " comentario-1 ",
            texto: " Texto valido ",
            userId: 9,
            nome: " ",
            avatar: 4,
            criadoEm: " ",
            comentarioPaiId: " pai-camel ",
            comentario_pai_id: " pai-snake ",
            local: false,
            curtidas: [" usuario-1 ", "usuario-1", "", " usuario-2 ", 3],
          },
          {
            id: "comentario-2",
            texto: "texto dois",
            userId: " usuario-dois ",
            nome: " Nome dois ",
            avatar: " avatar-dois ",
            criadoEm: "2026-02-03T04:05:06.000Z",
            comentario_pai_id: " pai-snake ",
          },
          { id: "sem-texto", texto: "   " },
          { texto: "sem id" },
          null,
        ],
      }),
    },
    () => {
      const comentarios = carregarComentariosObraLocais("usuario-a", "obra-a");

      assert.equal(comentarios.length, 2);
      assert.deepEqual(comentarios[0], {
        id: "comentario-1",
        obraId: "obra-a",
        userId: "usuario-a",
        nome: "Você",
        avatar: "",
        texto: "Texto valido",
        criadoEm: comentarios[0].criadoEm,
        comentarioPaiId: "pai-camel",
        local: true,
        curtidas: ["usuario-1", "usuario-2"],
      });
      assert.match(comentarios[0].criadoEm, /^\d{4}-\d{2}-\d{2}T/);
      assert.deepEqual(comentarios[1], {
        id: "comentario-2",
        obraId: "obra-a",
        userId: "usuario-dois",
        nome: "Nome dois",
        avatar: "avatar-dois",
        texto: "texto dois",
        criadoEm: "2026-02-03T04:05:06.000Z",
        comentarioPaiId: "pai-snake",
        local: true,
        curtidas: [],
      });
    },
  );
});

test("persiste apenas comentarios locais, preserva outras obras, ordem e limite", () => {
  executarComStorageNavegador(
    {
      [`${WORK_COMMENTS_STORAGE_KEY}:usuario-a`]: JSON.stringify({
        "obra-antiga": [criarComentario({ id: "antigo", obraId: "obra-antiga" })],
        "obra-atual": [criarComentario({ id: "substituido" })],
      }),
    },
    (localStorage) => {
      const comentarios = [
        ...Array.from({ length: 122 }, (_, indice) =>
          criarComentario({ id: `local-${indice}` }),
        ),
        criarComentario({ id: "remoto", local: false }),
      ];

      salvarComentariosObraLocais(" usuario-a ", " obra-atual ", comentarios);

      const persistidos = JSON.parse(
        localStorage.getItem(`${WORK_COMMENTS_STORAGE_KEY}:usuario-a`),
      );
      assert.deepEqual(persistidos["obra-antiga"].map(({ id }) => id), ["antigo"]);
      assert.equal(persistidos["obra-atual"].length, 120);
      assert.equal(persistidos["obra-atual"][0].id, "local-0");
      assert.equal(persistidos["obra-atual"][119].id, "local-119");
      assert.equal(
        persistidos["obra-atual"].some(({ id }) => id === "remoto"),
        false,
      );
    },
  );
});

test("no catch da escrita persiste somente a obra atual sem interromper o fluxo", () => {
  executarComStorageNavegador(
    {
      [`${WORK_COMMENTS_STORAGE_KEY}:usuario-a`]: "{invalido",
      [`${WORK_COMMENTS_STORAGE_KEY}:usuario-b`]: JSON.stringify({
        "obra-b": [criarComentario({ id: "comentario-b", obraId: "obra-b" })],
      }),
    },
    (localStorage) => {
      assert.doesNotThrow(() => {
        salvarComentariosObraLocais("usuario-a", "obra-a", [
          criarComentario({ id: "local-a" }),
          criarComentario({ id: "remoto-a", local: false }),
        ]);
      });

      assert.deepEqual(
        JSON.parse(localStorage.getItem(`${WORK_COMMENTS_STORAGE_KEY}:usuario-a`)),
        { "obra-a": [criarComentario({ id: "local-a" })] },
      );
      assert.deepEqual(
        JSON.parse(localStorage.getItem(`${WORK_COMMENTS_STORAGE_KEY}:usuario-b`)),
        {
          "obra-b": [
            criarComentario({ id: "comentario-b", obraId: "obra-b" }),
          ],
        },
      );
    },
  );
});
