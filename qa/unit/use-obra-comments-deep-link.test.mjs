import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const fonte = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-comments-deep-link.ts",
    import.meta.url,
  ),
  "utf8",
).replace(/\r\n/g, "\n");
const cliente = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);
const fonteMockada = fonte.replace(
  'import { useEffect, useRef } from "react";',
  "const useEffect = (...args) => globalThis.__obraCommentsDeepLink.useEffect(...args); const useRef = (...args) => globalThis.__obraCommentsDeepLink.useRef(...args);",
);
const javascript = typescript.transpileModule(fonteMockada, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  deveAbrirComentariosObraPorBusca,
  useObraCommentsDeepLink,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

function useMontarHook(search = "", prontoInicial = true) {
  const windowAnterior = globalThis.window;
  const efeitos = [];
  const listeners = new Map();
  const refs = [];
  let indiceRef = 0;
  let aberturas = 0;

  globalThis.window = {
    location: { search },
    addEventListener(tipo, callback) {
      listeners.set(tipo, callback);
    },
    removeEventListener(tipo, callback) {
      if (listeners.get(tipo) === callback) listeners.delete(tipo);
    },
  };
  globalThis.__obraCommentsDeepLink = {
    useEffect(callback) {
      efeitos.push(callback);
    },
    useRef(valorInicial) {
      const indice = indiceRef++;
      refs[indice] ||= { current: valorInicial };
      return refs[indice];
    },
  };

  let cleanups = [];
  function useRender(pronto = true, chaveRota = "obra") {
    cleanups.reverse().forEach((cleanup) => cleanup());
    indiceRef = 0;
    efeitos.length = 0;
    useObraCommentsDeepLink({
      abrirComentariosObra() { aberturas += 1; }, pronto, chaveRota,
    });
    cleanups = efeitos.map((efeito) => efeito()).filter(Boolean);
  }
  useRender(prontoInicial);

  return {
    get aberturas() {
      return aberturas;
    },
    render: useRender,
    navegar(searchAtual) {
      globalThis.window.location.search = searchAtual;
      listeners.get("popstate")?.();
    },
    desmontar() {
      cleanups.reverse().forEach((cleanup) => cleanup());
      assert.equal(listeners.size, 0);
      delete globalThis.__obraCommentsDeepLink;
      if (windowAnterior === undefined) delete globalThis.window;
      else globalThis.window = windowAnterior;
    },
  };
}

const montarHook = useMontarHook;

test("reconhece somente o deep link explicito de comentarios", () => {
  assert.equal(deveAbrirComentariosObraPorBusca("?comentarios=1"), true);
  assert.equal(deveAbrirComentariosObraPorBusca("?origem=notificacao&comentarios=1"), true);
  assert.equal(deveAbrirComentariosObraPorBusca("?comentarios=0"), false);
  assert.equal(deveAbrirComentariosObraPorBusca(""), false);
});

test("abre uma vez por entrada no deep link e reage a voltar e avancar", () => {
  const cenario = montarHook("?comentarios=1");

  try {
    assert.equal(cenario.aberturas, 1);
    cenario.navegar("?comentarios=1");
    assert.equal(cenario.aberturas, 1);
    cenario.navegar("");
    assert.equal(cenario.aberturas, 1);
    cenario.navegar("?comentarios=1");
    assert.equal(cenario.aberturas, 2);
  } finally {
    cenario.desmontar();
  }
});

test("cliente conecta o deep link ao mesmo handler acessivel do sheet", () => {
  assert.match(
    cliente,
    /import \{ useObraCommentsDeepLink \} from "\.\/hooks\/use-obra-comments-deep-link";/,
  );
  assert.match(cliente, /useObraCommentsDeepLink\(\{\s*abrirComentariosObra,\s*pronto: autenticacaoCarregada && \(!snapshotInicial \|\| publica\.interativa\),\s*chaveRota: slug,/);
});

test("deep link aguarda identidade/barreira e não reabre após fechamento ou nova confirmação", () => {
  const cenario = montarHook("?comentarios=1", false);
  try {
    assert.equal(cenario.aberturas, 0);
    cenario.navegar("?comentarios=1");
    assert.equal(cenario.aberturas, 0);
    cenario.render(true);
    assert.equal(cenario.aberturas, 1);
    cenario.render(false); cenario.render(true);
    assert.equal(cenario.aberturas, 1);
    cenario.navegar(""); cenario.navegar("?comentarios=1");
    assert.equal(cenario.aberturas, 2);
    cenario.render(true, "outra-obra");
    assert.equal(cenario.aberturas, 3);
  } finally { cenario.desmontar(); }
});
