import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

function transpilarModuloTypescript(caminho, substituicoes = []) {
  let texto = readFileSync(new URL(caminho, import.meta.url), "utf8");

  substituicoes.forEach(([padrao, substituicao]) => {
    texto = texto.replace(padrao, substituicao);
  });

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

const utilsJavascript = [
  "export const normalizarTexto = (texto) => String(texto)",
  '.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "")',
  '.trim().toLowerCase().replace(/\\s+/g, " ");',
].join(" ");
const utilsUrl = criarUrlModulo(utilsJavascript);
const ratingJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-rating-utils.ts",
  [[/from "\.\.\/\.\.\/\.\.\/\.\.\/lib\/utils";/, `from "${utilsUrl}";`]],
);
const ratingUrl = criarUrlModulo(ratingJavascript);
const storageJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-user-storage.ts",
);
const storageUrl = criarUrlModulo(storageJavascript);
const avaliacaoLocalJavascript = transpilarModuloTypescript(
  "../../app/obra/[slug]/lib/obra-local-rating-storage-utils.ts",
)
  .replace('from "./obra-user-storage";', `from "${storageUrl}";`)
  .replace('from "./obra-rating-utils";', `from "${ratingUrl}";`);
const {
  RATED_WORKS_STORAGE_KEY,
  carregarAvaliacoesLocais,
  obterAvaliacaoLocalDetalhada,
  obterAvaliacaoLocalInicialObra,
  salvarAvaliacaoLocal,
} = await import(criarUrlModulo(avaliacaoLocalJavascript));

function criarLocalStorage(valoresIniciais = {}, { falharLeitura = false, falharEscrita = false } = {}) {
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

function criarObra({
  id = "",
  slug = "",
  titulo = "Obra de teste",
  autorId = "",
} = {}) {
  return { id, slug, titulo, autorId };
}

test("ignora JSON invalido e valores que nao sao objetos sem regravar o cache", () => {
  ["{invalido", "null", "1", "[]"].forEach((valor) => {
    executarComStorageNavegador(
      { [`${RATED_WORKS_STORAGE_KEY}:usuario-a`]: valor },
      (localStorage) => {
        assert.deepEqual(carregarAvaliacoesLocais("usuario-a"), {});
        assert.equal(
          localStorage.getItem(`${RATED_WORKS_STORAGE_KEY}:usuario-a`),
          valor,
        );
      },
    );
  });
});

test("isola avaliacoes por usuario e nao le nem grava sem usuario", () => {
  executarComStorageNavegador(
    {
      [`${RATED_WORKS_STORAGE_KEY}:usuario-a`]: JSON.stringify({ "obra-a": 4 }),
      [`${RATED_WORKS_STORAGE_KEY}:usuario-b`]: JSON.stringify({ "obra-b": 3 }),
    },
    (localStorage) => {
      assert.deepEqual(carregarAvaliacoesLocais(" usuario-a "), { "obra-a": 4 });
      assert.deepEqual(carregarAvaliacoesLocais("usuario-b"), { "obra-b": 3 });
      assert.deepEqual(carregarAvaliacoesLocais(), {});

      salvarAvaliacaoLocal(criarObra({ id: "obra-sem-usuario" }), 4, "");
      assert.equal(localStorage.getItem(RATED_WORKS_STORAGE_KEY), null);
    },
  );
});

test("usa id, slug e titulo normalizado como chave de avaliacao", () => {
  executarComStorageNavegador({}, (localStorage) => {
    salvarAvaliacaoLocal(criarObra({ id: "id-obra", slug: "slug-obra" }), 2, "usuario-a");
    salvarAvaliacaoLocal(criarObra({ slug: "slug-obra" }), 3, "usuario-a");
    salvarAvaliacaoLocal(criarObra({ titulo: " Titulo  da  Obra " }), 4, "usuario-a");

    assert.deepEqual(
      JSON.parse(localStorage.getItem(`${RATED_WORKS_STORAGE_KEY}:usuario-a`)),
      {
        "id-obra": 2,
        "slug-obra": 3,
        "titulo da obra": 4,
      },
    );
  });
});

test("le somente a faixa valida, arredonda em meios pontos e preserva zero como remocao logica", () => {
  executarComStorageNavegador(
    {
      [`${RATED_WORKS_STORAGE_KEY}:usuario-a`]: JSON.stringify({
        meia: 0.5,
        cinco: 5,
        arredondada: 3.26,
        zero: 0,
        acima: 5.5,
      }),
    },
    (localStorage) => {
      assert.deepEqual(
        obterAvaliacaoLocalDetalhada(criarObra({ id: "meia" }), "usuario-a"),
        { encontrada: true, nota: 0.5 },
      );
      assert.deepEqual(
        obterAvaliacaoLocalDetalhada(criarObra({ id: "cinco" }), "usuario-a"),
        { encontrada: true, nota: 5 },
      );
      assert.deepEqual(
        obterAvaliacaoLocalDetalhada(criarObra({ id: "arredondada" }), "usuario-a"),
        { encontrada: true, nota: 3.5 },
      );
      assert.deepEqual(
        obterAvaliacaoLocalDetalhada(criarObra({ id: "zero" }), "usuario-a"),
        { encontrada: true, nota: 0 },
      );
      assert.deepEqual(
        obterAvaliacaoLocalDetalhada(criarObra({ id: "acima" }), "usuario-a"),
        { encontrada: true, nota: 0 },
      );

      salvarAvaliacaoLocal(criarObra({ id: "removida" }), 0, "usuario-a");
      salvarAvaliacaoLocal(criarObra({ id: "nova" }), 3.26, "usuario-a");

      const persistidas = JSON.parse(
        localStorage.getItem(`${RATED_WORKS_STORAGE_KEY}:usuario-a`),
      );
      assert.equal(persistidas.removida, 0);
      assert.equal(Object.hasOwn(persistidas, "removida"), true);
      assert.equal(persistidas.nova, 3.5);
    },
  );
});

test("autor recebe avaliacao local inicial vazia e os demais delegam para a leitura detalhada", () => {
  executarComStorageNavegador(
    {
      [`${RATED_WORKS_STORAGE_KEY}:usuario-a`]: JSON.stringify({
        "obra-do-autor": 4,
        "obra-de-terceiro": 3.5,
        "obra-sem-autor": 2.5,
        "obra-diferente": 4.5,
      }),
    },
    () => {
      assert.deepEqual(
        obterAvaliacaoLocalInicialObra(
          criarObra({ id: "obra-do-autor", autorId: "usuario-a" }),
          "usuario-a",
        ),
        { encontrada: false, nota: 0 },
      );
      assert.deepEqual(
        obterAvaliacaoLocalInicialObra(
          criarObra({ id: "obra-de-terceiro", autorId: "outro-autor" }),
          "usuario-a",
        ),
        { encontrada: true, nota: 3.5 },
      );
      assert.deepEqual(
        obterAvaliacaoLocalInicialObra(
          criarObra({ id: "obra-sem-autor", autorId: "" }),
          "usuario-a",
        ),
        { encontrada: true, nota: 2.5 },
      );
      assert.deepEqual(
        obterAvaliacaoLocalInicialObra(
          criarObra({ id: "obra-diferente", autorId: "usuario-a" }),
          "usuario-a ",
        ),
        { encontrada: true, nota: 4.5 },
      );
      assert.deepEqual(
        obterAvaliacaoLocalInicialObra(
          criarObra({ id: "obra-de-terceiro", autorId: "usuario-a" }),
          "",
        ),
        { encontrada: false, nota: 0 },
      );
    },
  );
});

test("falhas de storage nao interrompem leitura ou escrita local", () => {
  executarComStorageNavegador(
    {},
    () => {
      assert.deepEqual(carregarAvaliacoesLocais("usuario-a"), {});
      assert.doesNotThrow(() => {
        salvarAvaliacaoLocal(criarObra({ id: "obra-a" }), 4, "usuario-a");
      });
    },
    { falharLeitura: true, falharEscrita: true },
  );
});
