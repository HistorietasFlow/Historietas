import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const desktopHookSource = readFileSync(
  new URL("../../app/login/hooks/useLoginDesktopMode.ts", import.meta.url),
  "utf8",
);
const passwordChangedNoticeHookSource = readFileSync(
  new URL(
    "../../app/login/hooks/useLoginPasswordChangedNotice.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/login/page.tsx", import.meta.url),
  "utf8",
);

let cleanupDesktop;
let atualizacoesDesktop;
globalThis.__loginUseState = (valorInicial) => [
  valorInicial,
  (valor) => atualizacoesDesktop.push(valor),
];
globalThis.__loginUseEffectDesktop = (efeito) => {
  cleanupDesktop = efeito();
};

const desktopHookJavascript = typescript.transpileModule(
  desktopHookSource.replace(
    'import { useEffect, useState } from "react";',
    "const useEffect = globalThis.__loginUseEffectDesktop; const useState = globalThis.__loginUseState;",
  ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { useLoginDesktopMode } = await import(
  `data:text/javascript;base64,${Buffer.from(desktopHookJavascript).toString("base64")}`,
);

function executarHookDesktop(mediaQuery) {
  const windowAnterior = globalThis.window;
  atualizacoesDesktop = [];
  cleanupDesktop = undefined;
  globalThis.window = {
    ...windowAnterior,
    matchMedia: () => mediaQuery,
  };

  try {
    Reflect.apply(useLoginDesktopMode, null, []);
  } finally {
    globalThis.window = windowAnterior;
  }
}

test("useLoginDesktopMode atualiza imediatamente no breakpoint de 1024px e limpa listener moderno", () => {
  const chamadas = [];
  const mediaQuery = {
    matches: true,
    addEventListener(tipo, listener) {
      chamadas.push(["add", tipo, listener]);
    },
    removeEventListener(tipo, listener) {
      chamadas.push(["remove", tipo, listener]);
    },
  };

  executarHookDesktop(mediaQuery);

  assert.deepEqual(atualizacoesDesktop, [true]);
  assert.equal(chamadas[0][0], "add");
  assert.equal(chamadas[0][1], "change");
  cleanupDesktop();
  assert.equal(chamadas[1][0], "remove");
  assert.equal(chamadas[1][1], "change");
  assert.equal(chamadas[1][2], chamadas[0][2]);
});

test("useLoginDesktopMode preserva listener legado e cleanup", () => {
  const chamadas = [];
  const mediaQuery = {
    matches: false,
    addListener(listener) {
      chamadas.push(["add", listener]);
    },
    removeListener(listener) {
      chamadas.push(["remove", listener]);
    },
  };

  executarHookDesktop(mediaQuery);

  assert.deepEqual(atualizacoesDesktop, [false]);
  assert.equal(chamadas[0][0], "add");
  cleanupDesktop();
  assert.equal(chamadas[1][0], "remove");
  assert.equal(chamadas[1][1], chamadas[0][1]);
});

let cleanupAviso;
globalThis.__loginUseEffectPasswordChangedNotice = (efeito) => {
  cleanupAviso = efeito();
};
const passwordChangedNoticeHookJavascript = typescript.transpileModule(
  passwordChangedNoticeHookSource.replace(
    'import { useEffect } from "react";',
    "const useEffect = globalThis.__loginUseEffectPasswordChangedNotice;",
  ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { useLoginPasswordChangedNotice } = await import(
  `data:text/javascript;base64,${Buffer.from(passwordChangedNoticeHookJavascript).toString("base64")}`,
);

function executarHookAviso(search) {
  const windowAnterior = globalThis.window;
  const setters = [];
  const timers = [];
  const timersLimpos = [];
  cleanupAviso = undefined;
  const janelaTeste = {
    ...windowAnterior,
    location: { search },
    setTimeout(callback, atraso) {
      const timer = { callback, atraso };
      timers.push(timer);
      return timer;
    },
    clearTimeout(timer) {
      timersLimpos.push(timer);
    },
  };
  globalThis.window = janelaTeste;

  try {
    Reflect.apply(useLoginPasswordChangedNotice, null, [{
      t: (key) => `traduzido:${key}`,
      setModo: (valor) => setters.push(["modo", valor]),
      setErro: (valor) => setters.push(["erro", valor]),
      setAviso: (valor) => setters.push(["aviso", valor]),
    }]);

    return {
      setters,
      timers,
      timersLimpos,
      limpar() {
        const windowAtual = globalThis.window;
        globalThis.window = janelaTeste;

        try {
          cleanupAviso();
        } finally {
          globalThis.window = windowAtual;
        }
      },
    };
  } finally {
    globalThis.window = windowAnterior;
  }
}

test("useLoginPasswordChangedNotice não agenda aviso sem senhaRedefinida", () => {
  const resultado = executarHookAviso("?origem=perfil");

  assert.deepEqual(resultado.timers, []);
  assert.equal(cleanupAviso, undefined);
});

test("useLoginPasswordChangedNotice agenda em zero, atualiza setters em ordem e limpa o timer", () => {
  const resultado = executarHookAviso("?senhaRedefinida=1");

  assert.equal(resultado.timers.length, 1);
  assert.equal(resultado.timers[0].atraso, 0);
  resultado.timers[0].callback();
  assert.deepEqual(resultado.setters, [
    ["modo", "entrar"],
    ["erro", ""],
    ["aviso", "traduzido:passwordChangedNotice"],
  ]);
  resultado.limpar();
  assert.deepEqual(resultado.timersLimpos, [resultado.timers[0]]);
});

test("Login delega os lifecycles de UI sem manter implementações locais", () => {
  assert.match(
    desktopHookSource,
    /window\.matchMedia\("\(min-width: 1024px\)"\)/,
  );
  assert.match(desktopHookSource, /atualizarModoDesktop\(\);/);
  assert.match(desktopHookSource, /addEventListener\("change", atualizarModoDesktop\)/);
  assert.match(desktopHookSource, /removeEventListener\("change", atualizarModoDesktop\)/);
  assert.match(desktopHookSource, /addListener\(atualizarModoDesktop\)/);
  assert.match(desktopHookSource, /removeListener\(atualizarModoDesktop\)/);
  assert.doesNotMatch(desktopHookSource, /setTimeout/);

  assert.match(passwordChangedNoticeHookSource, /window\.location\.search/);
  assert.match(passwordChangedNoticeHookSource, /params\.get\("senhaRedefinida"\) !== "1"/);
  assert.match(passwordChangedNoticeHookSource, /window\.setTimeout\([\s\S]*?\}, 0\)/);
  assert.match(passwordChangedNoticeHookSource, /setModo\("entrar"\)[\s\S]*?setErro\(""\)[\s\S]*?setAviso\(t\("passwordChangedNotice"\)\)/);
  assert.match(passwordChangedNoticeHookSource, /window\.clearTimeout\(atualizarAvisoTimer\)/);

  assert.match(pageSource, /from "\.\/hooks\/useLoginDesktopMode"/);
  assert.match(pageSource, /from "\.\/hooks\/useLoginPasswordChangedNotice"/);
  assert.match(pageSource, /const isDesktop = useLoginDesktopMode\(\);/);
  assert.match(pageSource, /useLoginPasswordChangedNotice\(\{[\s\S]*?setModo,[\s\S]*?setErro,[\s\S]*?setAviso,/);
  assert.doesNotMatch(pageSource, /setIsDesktop/);
  assert.doesNotMatch(pageSource, /window\.matchMedia/);
  assert.doesNotMatch(pageSource, /params\.get\("senhaRedefinida"\)/);
});
