import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const desktopHookSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/hooks/useAdicionarCapituloDesktopMode.ts",
    import.meta.url,
  ),
  "utf8",
);
const derivedHookSource = readFileSync(
  new URL(
    "../../app/adicionar-capitulo/hooks/useAdicionarCapituloDerivedValues.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url),
  "utf8",
);

let cleanupDesktop;
let atualizacoesDesktop;

globalThis.__adicionarCapituloUseState = (valorInicial) => [
  valorInicial,
  (valor) => atualizacoesDesktop.push(valor),
];
globalThis.__adicionarCapituloUseEffect = (efeito) => {
  cleanupDesktop = efeito();
};

const desktopHookJavascript = typescript.transpileModule(
  desktopHookSource.replace(
    'import { useEffect, useState } from "react";',
    "const useEffect = globalThis.__adicionarCapituloUseEffect; const useState = globalThis.__adicionarCapituloUseState;",
  ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { useAdicionarCapituloDesktopMode } = await import(
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
    useAdicionarCapituloDesktopMode();
  } finally {
    globalThis.window = windowAnterior;
  }
}

test("useAdicionarCapituloDesktopMode atualiza imediatamente e limpa o listener moderno", () => {
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

test("useAdicionarCapituloDesktopMode preserva o fallback legado e o cleanup", () => {
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

const chamadasHref = [];
globalThis.__adicionarCapituloUseMemo = (calcular) => calcular();
globalThis.__adicionarCapituloObterOrdem = (capitulo, fallback) => (
  typeof capitulo.ordem === "number" && Number.isInteger(capitulo.ordem) && capitulo.ordem >= 1
    ? capitulo.ordem
    : Math.max(1, fallback)
);
globalThis.__adicionarCapituloObterProximaOrdem = (capitulos) => (
  capitulos.reduce(
    (maior, capitulo, index) => Math.max(
      maior,
      globalThis.__adicionarCapituloObterOrdem(capitulo, index + 1),
    ),
    0,
  ) + 1
);
globalThis.__adicionarCapituloCriarHref = (...args) => {
  chamadasHref.push(args);
  return `/leitura/${args[1].id}/${args[2]}`;
};

const derivedHookJavascript = typescript.transpileModule(
  derivedHookSource
    .replace(
      'import { useMemo } from "react";',
      "const useMemo = globalThis.__adicionarCapituloUseMemo;",
    )
    .replace(
      'import { obterOrdemCapitulo, obterProximaOrdemCapitulo } from "../lib/adicionar-capitulo-chapter-order-utils";',
      "const obterOrdemCapitulo = globalThis.__adicionarCapituloObterOrdem; const obterProximaOrdemCapitulo = globalThis.__adicionarCapituloObterProximaOrdem;",
    )
    .replace(
      'import { criarHrefLeituraCapitulo } from "../lib/adicionar-capitulo-route-utils";',
      "const criarHrefLeituraCapitulo = globalThis.__adicionarCapituloCriarHref;",
    ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const { useAdicionarCapituloDerivedValues } = await import(
  `data:text/javascript;base64,${Buffer.from(derivedHookJavascript).toString("base64")}`,
);

function criarObras() {
  return [
    {
      id: "obra-primeira",
      titulo: "Primeira",
      slug: "primeira",
      publicado: true,
      capitulos: [{ id: "capitulo-primeiro", ordem: 2 }],
    },
    {
      id: "obra-alvo",
      titulo: "Obra alvo",
      slug: "obra-alvo",
      publicado: false,
      capitulos: [
        { id: "capitulo-sem-ordem" },
        { id: "capitulo-criado", ordem: 7 },
      ],
    },
  ];
}

function calcularValores({
  obras = criarObras(),
  obraId = "obra-alvo",
  titulo = " Título informado ",
  texto = " Texto informado ",
  capituloCriado = null,
} = {}) {
  chamadasHref.length = 0;

  return useAdicionarCapituloDerivedValues({
    obras,
    obraId,
    titulo,
    texto,
    capituloCriado,
  });
}

test("useAdicionarCapituloDerivedValues preserva a obra, a prévia e os fallbacks", () => {
  const obras = criarObras();
  const valores = calcularValores({ obras, titulo: "   ", texto: "  texto  " });

  assert.equal(valores.obraAtual, obras[1]);
  assert.equal(valores.numeroNovoCapitulo, 8);
  assert.equal(valores.tituloPreview, "Capítulo 8");
  assert.equal(valores.textoPreview, "texto");
  assert.equal(valores.minhaObraHref, "/painel-autor");
  assert.equal(valores.capituloCriadoHref, "");

  const semObra = calcularValores({ obraId: "obra-ausente", titulo: "", texto: "" });
  assert.equal(semObra.obraAtual, null);
  assert.equal(semObra.numeroNovoCapitulo, 1);
  assert.equal(semObra.tituloPreview, "Capítulo 1");
  assert.equal(semObra.textoPreview, "");
  assert.equal(semObra.minhaObraHref, "/painel-autor");
  assert.equal(semObra.capituloCriadoHref, "");
});

test("useAdicionarCapituloDerivedValues preserva a ordem usada no link do capítulo criado", () => {
  const obras = criarObras();
  const capituloCriado = obras[1].capitulos[1];
  const valores = calcularValores({ obras, capituloCriado });

  assert.equal(valores.capituloCriadoHref, "/leitura/capitulo-criado/7");
  assert.deepEqual(chamadasHref, [[obras[1], capituloCriado, 7]]);

  const capituloSemOrdem = obras[1].capitulos[0];
  const valoresSemOrdem = calcularValores({ obras, capituloCriado: capituloSemOrdem });
  assert.equal(valoresSemOrdem.capituloCriadoHref, "/leitura/capitulo-sem-ordem/1");
  assert.deepEqual(chamadasHref, [[obras[1], capituloSemOrdem, 1]]);
});

test("Adicionar Capítulo delega somente os hooks de UI derivados", () => {
  assert.match(
    desktopHookSource,
    /const mediaQuery = window\.matchMedia\("\(min-width: 1024px\)"\);/,
  );
  assert.match(desktopHookSource, /atualizarModoDesktop\(\);/);
  assert.match(desktopHookSource, /mediaQuery\.addEventListener\("change", atualizarModoDesktop\);/);
  assert.match(desktopHookSource, /mediaQuery\.removeEventListener\("change", atualizarModoDesktop\);/);
  assert.match(desktopHookSource, /mediaQuery\.addListener\(atualizarModoDesktop\);/);
  assert.match(desktopHookSource, /mediaQuery\.removeListener\(atualizarModoDesktop\);/);
  assert.doesNotMatch(desktopHookSource, /setTimeout/);

  assert.match(derivedHookSource, /const obraAtual: TObra \| null = useMemo/);
  assert.match(derivedHookSource, /obterProximaOrdemCapitulo\(obraAtual\.capitulos\)/);
  assert.match(derivedHookSource, /titulo\.trim\(\) \|\| `Capítulo \$\{numeroNovoCapitulo\}`/);
  assert.match(derivedHookSource, /texto\.trim\(\)/);
  assert.match(derivedHookSource, /const minhaObraHref = "\/painel-autor";/);
  assert.match(derivedHookSource, /obterOrdemCapitulo\(/);
  assert.match(derivedHookSource, /findIndex\(/);
  assert.doesNotMatch(derivedHookSource, /supabase|localStorage|router|useState|useEffect/i);

  assert.match(
    pageSource,
    /import \{ useAdicionarCapituloDesktopMode \} from "\.\/hooks\/useAdicionarCapituloDesktopMode";/,
  );
  assert.match(
    pageSource,
    /import \{ useAdicionarCapituloDerivedValues \} from "\.\/hooks\/useAdicionarCapituloDerivedValues";/,
  );
  assert.match(pageSource, /const isDesktop = useAdicionarCapituloDesktopMode\(\);/);
  assert.match(pageSource, /\} = useAdicionarCapituloDerivedValues\(\{/);
  assert.doesNotMatch(pageSource, /setIsDesktop/);
  assert.doesNotMatch(pageSource, /window\.matchMedia/);
  assert.doesNotMatch(pageSource, /const obraAtual = useMemo/);
  assert.doesNotMatch(pageSource, /const numeroNovoCapitulo =/);
  assert.doesNotMatch(pageSource, /const tituloPreview =/);
  assert.doesNotMatch(pageSource, /const textoPreview =/);
  assert.doesNotMatch(pageSource, /const minhaObraHref =/);
  assert.doesNotMatch(pageSource, /const capituloCriadoHref =/);
});
