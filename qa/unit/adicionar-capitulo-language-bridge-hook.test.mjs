import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const hookSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/hooks/useAdicionarCapituloLanguageBridge.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);

let cleanup;
const chamadasTraducao = [];

globalThis.__adicionarCapituloUseEffect = (efeito) => {
  cleanup = efeito();
};
globalThis.__adicionarCapituloTraduzirElemento = (...argumentos) => {
  chamadasTraducao.push(argumentos);
};

const hookJavascript = typescript.transpileModule(
  hookSource
    .replace(
      'import { useEffect, type RefObject } from "react";',
      "const useEffect = globalThis.__adicionarCapituloUseEffect;",
    )
    .replace('import type { HistorietasLanguage } from "../../../lib/i18n";\n', "")
    .replace(
      'import { traduzirElementoAdicionarCapitulo } from "../lib/adicionar-capitulo-language-bridge";',
      "const traduzirElementoAdicionarCapitulo = globalThis.__adicionarCapituloTraduzirElemento;",
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { useAdicionarCapituloLanguageBridge } = await import(
  `data:text/javascript;base64,${Buffer.from(hookJavascript).toString("base64")}`,
);

test("useAdicionarCapituloLanguageBridge aplica a tradução e preserva o observer", () => {
  const mutationObserverAnterior = globalThis.MutationObserver;
  const queueMicrotaskAnterior = globalThis.queueMicrotask;
  const tarefas = [];
  const chamadasObserver = [];
  let callbackObserver;
  let desconectou = false;
  const raiz = {};

  class MutationObserverMock {
    constructor(callback) {
      callbackObserver = callback;
    }

    observe(elemento, opcoes) {
      chamadasObserver.push([elemento, opcoes]);
    }

    disconnect() {
      desconectou = true;
    }
  }

  globalThis.MutationObserver = MutationObserverMock;
  globalThis.queueMicrotask = (tarefa) => {
    tarefas.push(tarefa);
  };
  chamadasTraducao.length = 0;
  cleanup = undefined;

  try {
    Reflect.apply(useAdicionarCapituloLanguageBridge, null, [
      {
        raizTraducaoRef: { current: raiz },
        language: "en",
        carregando: false,
        obraAtual: { id: "obra-1" },
      },
    ]);

    assert.deepEqual(chamadasTraducao, [[raiz, "en"]]);
    assert.deepEqual(chamadasObserver, [[raiz, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-label", "title", "placeholder", "alt"],
    }]]);

    callbackObserver([]);
    callbackObserver([]);
    assert.equal(tarefas.length, 1);

    tarefas[0]();
    assert.deepEqual(chamadasTraducao, [[raiz, "en"], [raiz, "en"]]);

    cleanup();
    assert.equal(desconectou, true);
  } finally {
    globalThis.MutationObserver = mutationObserverAnterior;
    globalThis.queueMicrotask = queueMicrotaskAnterior;
  }
});

test("Adicionar Capítulo delega exclusivamente o lifecycle da bridge de tradução", () => {
  assert.match(hookSource, /const raiz = raizTraducaoRef\.current;/);
  assert.match(hookSource, /traduzirElementoAdicionarCapitulo\(raiz, language\);/);
  assert.match(hookSource, /new MutationObserver/);
  assert.match(hookSource, /let atualizacaoAgendada = false;/);
  assert.match(hookSource, /if \(atualizacaoAgendada\) \{/);
  assert.match(hookSource, /queueMicrotask\(aplicarTraducao\);/);
  assert.match(
    hookSource,
    /attributeFilter: \["aria-label", "title", "placeholder", "alt"\]/,
  );
  assert.match(
    hookSource,
    /observer\.observe\(raiz, \{\s*subtree: true,\s*childList: true,\s*characterData: true,\s*attributes: true,/,
  );
  assert.match(hookSource, /observer\.disconnect\(\);/);
  assert.match(hookSource, /\}, \[language, carregando, obraAtual\]\);/);
  assert.doesNotMatch(hookSource, /supabase|localStorage|router/i);
  assert.doesNotMatch(
    hookSource,
    /<\/?(?:div|main|section|span|button|input|textarea)\b/i,
  );

  assert.match(
    pageSource,
    /import \{ useAdicionarCapituloLanguageBridge \} from "\.\/hooks\/useAdicionarCapituloLanguageBridge";/,
  );
  assert.match(pageSource, /useAdicionarCapituloLanguageBridge\(\{[\s\S]*?raizTraducaoRef,[\s\S]*?language,[\s\S]*?carregando,[\s\S]*?obraAtual,/);
  assert.doesNotMatch(pageSource, /new MutationObserver/);
  assert.doesNotMatch(pageSource, /traduzirElementoAdicionarCapitulo/);
  assert.equal((pageSource.match(/ref=\{raizTraducaoRef\}/g) || []).length, 3);
});
