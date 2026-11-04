import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const page = readFileSync(new URL("../../app/listas/page.tsx", import.meta.url), "utf8");
const routeSyncSource = readFileSync(
  new URL("../../app/listas/hooks/use-listas-route-ui-sync.ts", import.meta.url),
  "utf8",
);
const workMenuSource = readFileSync(
  new URL("../../app/listas/hooks/use-listas-work-menu-lifecycle.ts", import.meta.url),
  "utf8",
);
const commentsSheetSource = readFileSync(
  new URL("../../app/listas/hooks/use-listas-diary-comments-sheet-lifecycle.ts", import.meta.url),
  "utf8",
);
const targetFocusSource = readFileSync(
  new URL("../../app/listas/hooks/use-listas-target-work-focus.ts", import.meta.url),
  "utf8",
);

async function importarHook(source) {
  const javascript = typescript.transpileModule(
    source
      .replace(
        'import { useEffect, type Dispatch, type SetStateAction } from "react";',
        "const useEffect = globalThis.__listasUseEffect;",
      )
      .replace(
        /import \{\s*useEffect,\s*useRef,\s*type Dispatch,\s*type KeyboardEvent,\s*type SetStateAction,\s*\} from "react";/,
        "const useEffect = globalThis.__listasUseEffect; const useRef = globalThis.__listasUseRef;",
      )
      .replace(
        /import \{\s*focarInicioDialogo,\s*manterFocoNoDialogo,\s*obterElementoComFocoAtual,\s*restaurarFocoAnterior,\s*\} from "\.\.\/\.\.\/obra\/\[slug\]\/lib\/obra-dialog-focus";/,
        "const { focarInicioDialogo, manterFocoNoDialogo, obterElementoComFocoAtual, restaurarFocoAnterior } = globalThis.__listasDialogFocus;",
      ),
    {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    },
  ).outputText;

  return import(
    `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${Math.random()}`
  );
}

function prepararUseEffect() {
  const effects = [];
  globalThis.__listasUseEffect = (callback, dependencies) => {
    effects.push({ callback, dependencies });
  };
  globalThis.__listasUseRef = (valorInicial) => ({ current: valorInicial });
  return effects;
}

test("Listas delega exclusivamente os quatro lifecycles de UI aos hooks", () => {
  for (const hook of [
    "useListasRouteUiSync",
    "useListasWorkMenuLifecycle",
    "useListasDiaryCommentsSheetLifecycle",
    "useListasTargetWorkFocus",
  ]) {
    assert.match(page, new RegExp(`import \\{ ${hook} \\}`));
    assert.match(page, new RegExp(`${hook}\\(\\{`));
  }

  for (const source of [
    routeSyncSource,
    workMenuSource,
    commentsSheetSource,
    targetFocusSource,
  ]) {
    assert.doesNotMatch(source, /supabase|\.from\(|\.rpc\(|\.insert\(|\.update\(|\.delete\(/);
  }

  assert.doesNotMatch(page, /setCategoria\(categoriaUrl\);/);
  assert.doesNotMatch(page, /setQuantidadeVisivel\(40\);/);
  assert.doesNotMatch(page, /document\.getElementById\(`lista-obra-\$\{obraAlvoId\}`\)/);
});

test("sincroniza categoria da rota e reinicia a paginação em 40", async () => {
  const effects = prepararUseEffect();
  const { useListasRouteUiSync } = await importarHook(routeSyncSource);
  const categorias = [];
  const quantidades = [];

  useListasRouteUiSync({
    categoriaUrl: "favoritas",
    setCategoria: (valor) => categorias.push(valor),
    categoria: "lendo",
    busca: "",
    ordenacao: "recentes",
    modo: "perfil",
    secao: "catalogo",
    genero: "",
    setQuantidadeVisivel: (valor) => quantidades.push(valor),
  });

  assert.deepEqual(effects.map(({ dependencies }) => dependencies), [
    ["favoritas"],
    ["lendo", "", "recentes", "perfil", "catalogo", ""],
  ]);
  effects[0].callback();
  effects[1].callback();
  assert.deepEqual(categorias, ["favoritas"]);
  assert.deepEqual(quantidades, [40]);
});

test("bloqueia e restaura o body do menu de obra, fechando somente com Escape", async () => {
  const effects = prepararUseEffect();
  const { useListasWorkMenuLifecycle } = await importarHook(workMenuSource);
  const anteriorDocument = globalThis.document;
  const anteriorWindow = globalThis.window;
  const listeners = new Map();
  const chamadas = [];

  globalThis.document = { body: { style: { overflow: "scroll" } } };
  globalThis.window = {
    addEventListener: (tipo, listener) => listeners.set(tipo, listener),
    removeEventListener: (tipo, listener) => {
      if (listeners.get(tipo) === listener) listeners.delete(tipo);
    },
  };

  try {
    useListasWorkMenuLifecycle({
      obraMenuAberta: { id: "obra-1" },
      setObraMenuAberta: (valor) => chamadas.push(["obra", valor]),
      setItemPerfilMenuAberto: (valor) => chamadas.push(["item", valor]),
      setObraMenuNoQueroLer: (valor) => chamadas.push(["quero", valor]),
      setEditorAnotacao: (valor) => chamadas.push(["editor", valor]),
      editorAnotacaoVazio: { aberto: false },
    });

    assert.deepEqual(effects[0].dependencies, [{ id: "obra-1" }]);
    const cleanup = effects[0].callback();
    assert.equal(globalThis.document.body.style.overflow, "hidden");
    listeners.get("keydown")({ key: "Enter" });
    assert.deepEqual(chamadas, []);
    listeners.get("keydown")({ key: "Escape" });
    assert.deepEqual(chamadas, [
      ["obra", null],
      ["item", null],
      ["quero", false],
      ["editor", { aberto: false }],
    ]);
    cleanup();
    assert.equal(globalThis.document.body.style.overflow, "scroll");
    assert.equal(listeners.has("keydown"), false);
  } finally {
    globalThis.document = anteriorDocument;
    globalThis.window = anteriorWindow;
  }
});

test("sheet de comentários gerencia foco, body e Escape por um único handler", async () => {
  const effects = prepararUseEffect();
  const anteriorDocument = globalThis.document;
  const anteriorWindow = globalThis.window;
  const anteriorDialogFocus = globalThis.__listasDialogFocus;
  const chamadas = [];
  const timers = [];
  const focoAnterior = { id: "acionador" };
  const sheet = { id: "sheet" };

  globalThis.document = { body: { style: { overflow: "auto" } } };
  globalThis.window = {
    setTimeout: (callback, atraso) => {
      timers.push({ callback, atraso });
      return timers.length;
    },
    clearTimeout: (timer) => chamadas.push(["timer-limpo", timer]),
  };
  globalThis.__listasDialogFocus = {
    focarInicioDialogo: (elemento) => chamadas.push(["foco-inicial", elemento]),
    manterFocoNoDialogo: (event, fechar) => {
      chamadas.push(["tecla", event.key, event.shiftKey]);
      if (event.key === "Escape") fechar();
    },
    obterElementoComFocoAtual: () => focoAnterior,
    restaurarFocoAnterior: (elemento) => chamadas.push(["foco-restaurado", elemento]),
  };

  try {
    const { useListasDiaryCommentsSheetLifecycle } = await importarHook(commentsSheetSource);
    const lifecycle = useListasDiaryCommentsSheetLifecycle({
      comentariosDiarioItem: { chave: "item-1" },
      setComentariosDiarioItem: (valor) => chamadas.push(["item", valor]),
      setComentariosDiarioExpandido: (valor) => chamadas.push(["expandido", valor]),
      setMenuOrdenacaoComentariosDiarioAberto: (valor) => chamadas.push(["ordenacao", valor]),
    });
    lifecycle.comentariosSheetRef.current = sheet;

    const cleanup = effects[0].callback();
    assert.equal(globalThis.document.body.style.overflow, "hidden");
    assert.deepEqual(timers.map(({ atraso }) => atraso), [0]);
    timers[0].callback();
    lifecycle.aoPressionarTeclaDialogo({ key: "Tab", shiftKey: true });
    lifecycle.aoPressionarTeclaDialogo({ key: "Escape", shiftKey: false });
    assert.deepEqual(chamadas.slice(0, 6), [
      ["foco-inicial", sheet],
      ["tecla", "Tab", true],
      ["tecla", "Escape", false],
      ["item", null],
      ["expandido", false],
      ["ordenacao", false],
    ]);
    cleanup();
    assert.equal(globalThis.document.body.style.overflow, "auto");
    assert.deepEqual(chamadas.slice(6), [
      ["timer-limpo", 1],
      ["foco-restaurado", focoAnterior],
    ]);
  } finally {
    globalThis.document = anteriorDocument;
    globalThis.window = anteriorWindow;
    globalThis.__listasDialogFocus = anteriorDialogFocus;
  }
});

test("focaliza a obra alvo, troca para tudo sem scroll e preserva timers de destaque", async () => {
  const effects = prepararUseEffect();
  const { useListasTargetWorkFocus } = await importarHook(targetFocusSource);
  const listasPerfil = {
    tudo: [{ obra: { id: "obra-1" } }],
    favoritas: [],
  };
  const categorias = [];
  const replaces = [];
  const router = { replace: (...args) => replaces.push(args) };

  useListasTargetWorkFocus({
    obraAlvoId: "obra-1",
    carregando: false,
    categoria: "favoritas",
    listasPerfil,
    modo: "perfil",
    queryAtual: "categoria=favoritas&obra=obra-1",
    router,
    setCategoria: (valor) => categorias.push(valor),
    setObraDestacadaId: () => {},
  });

  effects[0].callback();
  assert.deepEqual(categorias, ["tudo"]);
  assert.deepEqual(replaces, [["/listas?categoria=tudo&obra=obra-1", { scroll: false }]]);

  const timers = [];
  const limpos = [];
  const destaques = [];
  const anteriorDocument = globalThis.document;
  const anteriorWindow = globalThis.window;
  const scrolls = [];
  globalThis.document = {
    getElementById: (id) => id === "lista-obra-obra-1"
      ? { scrollIntoView: (opcoes) => scrolls.push(opcoes) }
      : null,
  };
  globalThis.window = {
    setTimeout: (callback, atraso) => {
      timers.push({ callback, atraso });
      return timers.length;
    },
    clearTimeout: (timer) => limpos.push(timer),
  };

  try {
    const effectsComDestaque = prepararUseEffect();
    const { useListasTargetWorkFocus: useListasTargetWorkFocusComDestaque } =
      await importarHook(targetFocusSource);
    useListasTargetWorkFocusComDestaque({
      obraAlvoId: "obra-1",
      carregando: false,
      categoria: "tudo",
      listasPerfil,
      modo: "perfil",
      queryAtual: "obra=obra-1",
      router,
      setCategoria: () => {},
      setObraDestacadaId: (valor) => destaques.push(valor),
    });

    const cleanup = effectsComDestaque[0].callback();
    assert.deepEqual(timers.map(({ atraso }) => atraso), [180]);
    timers[0].callback();
    assert.deepEqual(scrolls, [{ behavior: "smooth", block: "center" }]);
    assert.equal(destaques[0], "obra-1");
    assert.deepEqual(timers.map(({ atraso }) => atraso), [180, 2400]);
    timers[1].callback();
    assert.equal(destaques[1]("obra-1"), "");
    cleanup();
    assert.deepEqual(limpos, [1]);
  } finally {
    globalThis.document = anteriorDocument;
    globalThis.window = anteriorWindow;
  }
});
