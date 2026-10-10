import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-sharing-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const javascript = typescript.transpileModule(modulo, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  copiarTextoComFallbackPerfilAutor,
  criarUrlAbsolutaCompartilhamentoPerfilAutor,
  erroCompartilhamentoFoiCanceladoPerfilAutor,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

function comGlobais(globais, executar) {
  const anteriores = new Map(
    Object.keys(globais).map((nome) => [
      nome,
      Object.getOwnPropertyDescriptor(globalThis, nome),
    ]),
  );

  for (const [nome, valor] of Object.entries(globais)) {
    if (valor === undefined) {
      delete globalThis[nome];
    } else {
      Object.defineProperty(globalThis, nome, {
        configurable: true,
        value: valor,
      });
    }
  }

  return Promise.resolve(executar()).finally(() => {
    for (const [nome, descritor] of anteriores) {
      if (descritor) {
        Object.defineProperty(globalThis, nome, descritor);
      } else {
        delete globalThis[nome];
      }
    }
  });
}

function criarDocumento(resultadoFallback, falharNoExecCommand = false) {
  const chamadas = [];
  const body = {
    appendChild(elemento) {
      chamadas.push("append");
      elemento.parentNode = body;
    },
    removeChild(elemento) {
      chamadas.push("remove");
      elemento.parentNode = null;
    },
  };
  const textarea = {
    parentNode: null,
    style: {},
    value: "",
    setAttribute(nome, valor) {
      chamadas.push(`attribute:${nome}:${valor}`);
    },
    focus() {
      chamadas.push("focus");
    },
    select() {
      chamadas.push("select");
    },
    setSelectionRange(inicio, fim) {
      chamadas.push(`selection:${inicio}:${fim}`);
    },
  };

  return {
    chamadas,
    document: {
      body,
      createElement(nome) {
        chamadas.push(`create:${nome}`);
        return textarea;
      },
      execCommand(comando) {
        chamadas.push(`exec:${comando}`);
        if (falharNoExecCommand) {
          throw new Error("falha ao copiar");
        }

        return resultadoFallback;
      },
    },
    textarea,
  };
}

test("cria URLs absolutas, preserva trim e usa os fallbacks originais", async () => {
  await comGlobais(
    {
      window: {
        location: {
          href: "https://historietas.app/perfil/autora",
          origin: "https://historietas.app",
        },
      },
    },
    () => {
      assert.equal(
        criarUrlAbsolutaCompartilhamentoPerfilAutor(" /obra/minha-obra "),
        "https://historietas.app/obra/minha-obra",
      );
      assert.equal(
        criarUrlAbsolutaCompartilhamentoPerfilAutor("http://[invalida"),
        "https://historietas.app/perfil/autora",
      );
      assert.equal(
        criarUrlAbsolutaCompartilhamentoPerfilAutor("  "),
        "https://historietas.app/perfil/autora",
      );
    },
  );

  await comGlobais({ window: undefined }, () => {
    assert.equal(criarUrlAbsolutaCompartilhamentoPerfilAutor(" /perfil/ana "), "/perfil/ana");
  });
});

test("copia pela Clipboard API segura antes de usar o fallback", async () => {
  const textosCopiados = [];
  const { document, chamadas } = criarDocumento(false);

  const copiado = await comGlobais(
    {
      window: { isSecureContext: true },
      navigator: {
        clipboard: {
          writeText: async (texto) => {
            textosCopiados.push(texto);
          },
        },
      },
      document,
    },
    () => copiarTextoComFallbackPerfilAutor("  @autora  "),
  );

  assert.equal(copiado, true);
  assert.deepEqual(textosCopiados, ["@autora"]);
  assert.deepEqual(chamadas, []);
});

test("usa textarea no fallback, seleciona o texto e sempre limpa o DOM", async () => {
  const { document, chamadas, textarea } = criarDocumento(true);

  const copiado = await comGlobais(
    {
      window: { isSecureContext: false },
      navigator: {},
      document,
    },
    () => copiarTextoComFallbackPerfilAutor("link para compartilhar"),
  );

  assert.equal(copiado, true);
  assert.equal(textarea.value, "link para compartilhar");
  assert.deepEqual(chamadas, [
    "create:textarea",
    "attribute:readonly:true",
    "append",
    "focus",
    "select",
    "selection:0:22",
    "exec:copy",
    "remove",
  ]);
});

test("a ausência de navigator também usa o fallback de cópia", async () => {
  const { document, chamadas } = criarDocumento(true);

  const copiado = await comGlobais(
    {
      window: { isSecureContext: true },
      navigator: undefined,
      document,
    },
    () => copiarTextoComFallbackPerfilAutor("link sem navegador"),
  );

  assert.equal(copiado, true);
  assert.deepEqual(chamadas.slice(-2), ["exec:copy", "remove"]);
});

test("falhas de cópia e guardas retornam false sem deixar elemento temporário", async () => {
  const { document, chamadas } = criarDocumento(false, true);

  const falhou = await comGlobais(
    {
      window: { isSecureContext: true },
      navigator: {
        clipboard: {
          writeText: async () => {
            throw new Error("clipboard indisponível");
          },
        },
      },
      document,
    },
    () => copiarTextoComFallbackPerfilAutor("link"),
  );
  const vazio = await comGlobais(
    { window: undefined, document: undefined, navigator: undefined },
    () => copiarTextoComFallbackPerfilAutor("  "),
  );

  assert.equal(falhou, false);
  assert.equal(vazio, false);
  assert.equal(chamadas.at(-1), "remove");
});

test("identifica apenas o cancelamento AbortError", () => {
  assert.equal(erroCompartilhamentoFoiCanceladoPerfilAutor({ name: "AbortError" }), true);
  assert.equal(erroCompartilhamentoFoiCanceladoPerfilAutor({ name: "Error" }), false);
  assert.equal(erroCompartilhamentoFoiCanceladoPerfilAutor(null), false);
  assert.equal(erroCompartilhamentoFoiCanceladoPerfilAutor("AbortError"), false);
});

test("a página delega os três helpers sem alterar o fluxo de compartilhamento", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?copiarTextoComFallbackPerfilAutor,[\s\S]*?criarUrlAbsolutaCompartilhamentoPerfilAutor,[\s\S]*?erroCompartilhamentoFoiCanceladoPerfilAutor,[\s\S]*?\} from "\.\/lib\/profile-sharing-utils";/,
  );
  assert.doesNotMatch(pagina, /function criarUrlAbsolutaCompartilhamentoPerfilAutor\(/);
  assert.doesNotMatch(pagina, /async function copiarTextoComFallbackPerfilAutor\(/);
  assert.doesNotMatch(pagina, /function erroCompartilhamentoFoiCanceladoPerfilAutor\(/);
  assert.match(pagina, /const urlFinal = criarUrlAbsolutaCompartilhamentoPerfilAutor\(url\);/);
  assert.match(pagina, /await copiarTextoComFallbackPerfilAutor\(urlFinal\)/);
  assert.match(pagina, /erroCompartilhamentoFoiCanceladoPerfilAutor\(error\)/);
});
