import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-desktop-mode.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const visualizacao = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-page-view.ts",
    import.meta.url,
  ),
  "utf8",
);
const contexto = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-page-context.ts",
    import.meta.url,
  ),
  "utf8",
);
const painel = readFileSync(
  new URL("../../app/seguindo/components/seguindo-sorting-panel.tsx", import.meta.url),
  "utf8",
);
const toolbar = readFileSync(
  new URL("../../app/seguindo/components/seguindo-social-toolbar.tsx", import.meta.url),
  "utf8",
);
const controls = readFileSync(
  new URL("../../app/seguindo/components/seguindo-page-controls.tsx", import.meta.url),
  "utf8",
);
const carregado = readFileSync(
  new URL(
    "../../app/seguindo/components/seguindo-page-loaded-state.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("useSeguindoDesktopMode preserva o lifecycle responsivo de Seguindo", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useSeguindoDesktopMode\(\)/);
  assert.match(hook, /const \[isDesktop, setIsDesktop\] = useState\(false\);/);
  assert.match(
    hook,
    /const mediaQuery = window\.matchMedia\("\(min-width: 1024px\)"\);/,
  );
  assert.match(
    hook,
    /const atualizarModoDesktop = \(\) => \{\s*setIsDesktop\(mediaQuery\.matches\);\s*\};/,
  );
  assert.match(
    hook,
    /const atualizarModoDesktopTimer = window\.setTimeout\(\s*atualizarModoDesktop,\s*0\s*\);/,
  );
  assert.doesNotMatch(hook, /atualizarModoDesktop\(\);/);
  assert.match(
    hook,
    /mediaQuery\.addEventListener\("change", atualizarModoDesktop\);[\s\S]*?window\.clearTimeout\(atualizarModoDesktopTimer\);[\s\S]*?mediaQuery\.removeEventListener\("change", atualizarModoDesktop\);/,
  );
  assert.match(hook, /mediaQuery\.addListener\(atualizarModoDesktop\);/);
  assert.match(
    hook,
    /mediaQuery\.addListener\(atualizarModoDesktop\);[\s\S]*?window\.clearTimeout\(atualizarModoDesktopTimer\);[\s\S]*?mediaQuery\.removeListener\(atualizarModoDesktop\);/,
  );
  assert.match(hook, /\}, \[\]\);/);
  assert.match(hook, /return isDesktop;/);
});

test("Seguindo delega o modo desktop pelo contexto e preserva os consumidores", () => {
  assert.match(
    contexto,
    /import \{ useSeguindoDesktopMode \} from "\.\/use-seguindo-desktop-mode";/,
  );
  assert.match(contexto, /const isDesktop = useSeguindoDesktopMode\(\);/);
  assert.match(pagina, /useSeguindoPageContext\(\s*mostrarPainelOrdenacao,?\s*\)/);
  assert.doesNotMatch(
    pagina,
    /const \[isDesktop, setIsDesktop\] = useState\(false\);/,
  );
  assert.doesNotMatch(pagina, /setIsDesktop/);
  assert.doesNotMatch(
    pagina,
    /window\.matchMedia\("\(min-width: 1024px\)"\)/,
  );
  assert.match(pagina, /<SeguindoPageLoadedState\s+isDesktop=\{isDesktop\}/);
  assert.match(carregado, /<SeguindoPageControls \{\.\.\.controls\} \/>/);
  assert.match(controls, /<SeguindoHeader\s+isDesktop=\{isDesktop\}/);
  assert.match(controls, /<SeguindoSocialToolbar\s+isDesktop=\{isDesktop\}/);
  assert.match(controls, /<SeguindoSortingPanel\s+isDesktop=\{isDesktop\}/);
  assert.match(toolbar, /isDesktop \? desktopSocialToolbarStyle : socialToolbarStyle/);
  assert.match(painel, /isDesktop \? desktopSortingSheetStyle : sortingSheetStyle/);
  assert.match(
    visualizacao,
    /import \{ useSeguindoSortingSheetBodyLock \} from "\.\/use-seguindo-sorting-sheet-body-lock";/,
  );
  assert.match(
    visualizacao,
    /useSeguindoSortingSheetBodyLock\(mostrarPainelOrdenacao\);/,
  );
  assert.match(contexto, /useSeguindoPageView\(mostrarPainelOrdenacao\);/);
  assert.match(
    pagina,
    /useSeguindoPageState\(\);/,
  );
  assert.match(pagina, /useSeguindoPageInitialSync\(\{/);
});
