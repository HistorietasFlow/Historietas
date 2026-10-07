import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const caminhoModulo = new URL(
  "../../app/obra/[slug]/lib/obra-share-utils.ts",
  import.meta.url,
);
const codigoTypescript = readFileSync(caminhoModulo, "utf8");
const codigoJavascript = typescript.transpileModule(codigoTypescript, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { copiarLinkComFallback } = await import(
  `data:text/javascript;base64,${Buffer.from(codigoJavascript).toString("base64")}`,
);

function comNavegadorSimulado({
  seguro,
  clipboard,
  resultadoFallback,
}, executar) {
  const descritorJanelaAnterior = Object.getOwnPropertyDescriptor(
    globalThis,
    "window",
  );
  const descritorNavegadorAnterior = Object.getOwnPropertyDescriptor(
    globalThis,
    "navigator",
  );
  const descritorDocumentoAnterior = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { isSecureContext: seguro },
  });
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { clipboard },
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: () => ({
        style: {},
        setAttribute: () => {},
        select: () => {},
      }),
      body: {
        appendChild: () => {},
        removeChild: () => {},
      },
      execCommand: () => resultadoFallback,
    },
  });

  return Promise.resolve(executar()).finally(() => {
    [
      ["window", descritorJanelaAnterior],
      ["navigator", descritorNavegadorAnterior],
      ["document", descritorDocumentoAnterior],
    ].forEach(([propriedade, descritor]) => {
      if (descritor) {
        Object.defineProperty(globalThis, propriedade, descritor);
        return;
      }

      delete globalThis[propriedade];
    });
  });
}

test("copia pelo clipboard seguro antes de usar o fallback", async () => {
  const textosCopiados = [];

  const copiado = await comNavegadorSimulado(
    {
      seguro: true,
      clipboard: {
        writeText: async (texto) => {
          textosCopiados.push(texto);
        },
      },
      resultadoFallback: false,
    },
    () => copiarLinkComFallback("https://historietas.app/obra"),
  );

  assert.equal(copiado, true);
  assert.deepEqual(textosCopiados, ["https://historietas.app/obra"]);
});

test("recorre ao fallback quando clipboard indisponivel ou rejeitado", async () => {
  const rejeitado = await comNavegadorSimulado(
    {
      seguro: true,
      clipboard: {
        writeText: async () => {
          throw new Error("clipboard indisponivel");
        },
      },
      resultadoFallback: true,
    },
    () => copiarLinkComFallback("https://historietas.app/rejeitado"),
  );
  const inseguro = await comNavegadorSimulado(
    {
      seguro: false,
      clipboard: undefined,
      resultadoFallback: false,
    },
    () => copiarLinkComFallback("https://historietas.app/inseguro"),
  );

  assert.equal(rejeitado, true);
  assert.equal(inseguro, false);
});

test("cliente preserva a ordem nativa antes da estrategia de copia", () => {
  const pagina = readFileSync(
    new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
    "utf8",
  );
  const inicio = pagina.indexOf("async function compartilharObraAtual()");
  const fim = pagina.indexOf("const acaoLeituraPrincipal", inicio);
  const bloco = pagina.slice(inicio, fim);
  const indiceShare = bloco.indexOf("navigator.share(dadosCompartilhamento)");
  const indiceFecharNativo = bloco.indexOf(
    "setAcoesObraAbertas(false);",
    indiceShare,
  );
  const indiceAwaitShare = bloco.indexOf("await compartilhamento;", indiceFecharNativo);
  const indiceAbort = bloco.indexOf('error.name === "AbortError"', indiceAwaitShare);
  const indiceFecharCopia = bloco.indexOf(
    "setAcoesObraAbertas(false);",
    indiceAbort,
  );
  const indiceCopia = bloco.indexOf(
    "await copiarLinkComFallback(linkAtual);",
    indiceFecharCopia,
  );

  assert.ok(indiceShare >= 0);
  assert.ok(indiceFecharNativo > indiceShare);
  assert.ok(indiceAwaitShare > indiceFecharNativo);
  assert.ok(indiceAbort > indiceAwaitShare);
  assert.ok(indiceFecharCopia > indiceAbort);
  assert.ok(indiceCopia > indiceFecharCopia);
  assert.match(bloco, /setLinkCopiado\(true\)/);
  assert.match(bloco, /setMensagemAcao\(""\)/);
  assert.match(bloco, /setTimeout\(\(\) => \{\s*setLinkCopiado\(false\);\s*\}, 1800\)/);
});
