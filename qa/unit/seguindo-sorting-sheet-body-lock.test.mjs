import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const hook = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-sorting-sheet-body-lock.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const painel = readFileSync(
  new URL("../../app/seguindo/components/seguindo-sorting-panel.tsx", import.meta.url),
  "utf8",
);
const controls = readFileSync(
  new URL("../../app/seguindo/components/seguindo-page-controls.tsx", import.meta.url),
  "utf8",
);

test("hook preserva o lifecycle de lock do painel de ordena\u00e7\u00e3o", () => {
  assert.match(hook, /"use client";/);
  assert.match(
    hook,
    /export function useSeguindoSortingSheetBodyLock\(\s*mostrarPainelOrdenacao: boolean,?\s*\)/,
  );
  assert.match(hook, /useEffect\(\(\) => \{/);
  assert.match(
    hook,
    /if \(!mostrarPainelOrdenacao \|\| typeof document === "undefined"\) \{\s*return;\s*\}/,
  );
  assert.match(hook, /const overflowAnterior = document\.body\.style\.overflow;/);
  assert.match(
    hook,
    /const overscrollAnterior = document\.body\.style\.overscrollBehavior;/,
  );
  assert.match(hook, /document\.body\.style\.overflow = "hidden";/);
  assert.match(hook, /document\.body\.style\.overscrollBehavior = "none";/);
  assert.match(
    hook,
    /return \(\) => \{\s*document\.body\.style\.overflow = overflowAnterior;\s*document\.body\.style\.overscrollBehavior = overscrollAnterior;\s*\};/,
  );
  assert.match(hook, /\}, \[mostrarPainelOrdenacao\]\);/);
  assert.doesNotMatch(hook, /return \{/);
  assert.doesNotMatch(hook, /useState|set[A-Z]/);
});

test("p\u00e1gina mant\u00e9m o lifecycle e delega o painel de ordena\u00e7\u00e3o", () => {
  assert.match(
    pagina,
    /import \{ useSeguindoSortingSheetBodyLock \} from "\.\/hooks\/use-seguindo-sorting-sheet-body-lock";/,
  );
  assert.match(
    pagina,
    /const \{ mostrarPainelOrdenacao, setMostrarPainelOrdenacao \} = useSeguindoSortingPanelState\(\);/,
  );
  assert.match(
    pagina,
    /useSeguindoSortingSheetBodyLock\(mostrarPainelOrdenacao\);/,
  );
  assert.doesNotMatch(
    pagina,
    /useEffect\(\(\) => \{[\s\S]*?const overflowAnterior = document\.body\.style\.overflow;[\s\S]*?\}, \[mostrarPainelOrdenacao\]\);/,
  );
  assert.match(pagina, /<SeguindoPageControls[\s\S]*?mostrarPainelOrdenacao=\{mostrarPainelOrdenacao\}/);
  assert.match(controls, /\{mostrarPainelOrdenacao && \(/);
  assert.match(controls, /<SeguindoSortingPanel[\s\S]*?isDesktop=\{isDesktop\}[\s\S]*?opcoesOrdenacao=\{opcoesOrdenacao\}[\s\S]*?ordenacao=\{ordenacao\}[\s\S]*?setOrdenacao=\{setOrdenacao\}[\s\S]*?setMostrarPainelOrdenacao=\{setMostrarPainelOrdenacao\}/);
  assert.match(painel, /style=\{sortingBackdropStyle\}/);
  assert.match(
    painel,
    /onClick=\{\(\) => setMostrarPainelOrdenacao\(false\)\}/,
  );
  assert.match(painel, /onClick=\{\(event\) => event\.stopPropagation\(\)\}/);
});

test("painel preserva variantes, seleção e ordem dos callbacks", () => {
  const require = createRequire(import.meta.url);
  const styles = new Proxy({}, { get: (_, name) => name });
  const compiled = ts.transpileModule(painel, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const sandboxModule = { exports: {} };
  runInNewContext(compiled, {
    module: sandboxModule,
    exports: sandboxModule.exports,
    require: (id) => id.startsWith("../lib/") ? styles : require(id),
  });

  const chamadas = [];
  const props = {
    isDesktop: false,
    opcoesOrdenacao: [
      { valor: "padrao", rotulo: "Padrão" },
      { valor: "recentes", rotulo: "Mais recentes" },
    ],
    ordenacao: "padrao",
    setOrdenacao: (valor) => chamadas.push(["ordenação", valor]),
    setMostrarPainelOrdenacao: (valor) => chamadas.push(["painel", valor]),
  };
  const arvore = sandboxModule.exports.SeguindoSortingPanel(props);
  const folha = arvore.props.children;
  assert.equal(arvore.props.style, "sortingBackdropStyle");
  assert.equal(folha.props.style, "sortingSheetStyle");
  assert.equal(folha.props.children[1].props.children, "Classificar por");
  const botoes = folha.props.children[2].props.children;
  assert.equal(botoes[0].props.style, "sortingOptionActiveStyle");
  assert.equal(botoes[0].props.children[1].props.children, "✓");
  assert.equal(botoes[1].props.style, "sortingOptionStyle");
  botoes[1].props.onClick();
  assert.deepEqual(chamadas, [["ordenação", "recentes"], ["painel", false]]);
  chamadas.length = 0;
  arvore.props.onClick();
  assert.deepEqual(chamadas, [["painel", false]]);
  let propagacaoInterrompida = false;
  folha.props.onClick({ stopPropagation() { propagacaoInterrompida = true; } });
  assert.equal(propagacaoInterrompida, true);
  assert.equal(sandboxModule.exports.SeguindoSortingPanel({ ...props, isDesktop: true }).props.children.props.style, "desktopSortingSheetStyle");
});
