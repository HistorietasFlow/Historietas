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

test("Seguindo delega somente o modo desktop e preserva os consumidores", () => {
  assert.match(
    pagina,
    /import \{ useSeguindoDesktopMode \} from "\.\/hooks\/use-seguindo-desktop-mode";/,
  );
  assert.match(pagina, /const isDesktop = useSeguindoDesktopMode\(\);/);
  assert.doesNotMatch(
    pagina,
    /const \[isDesktop, setIsDesktop\] = useState\(false\);/,
  );
  assert.doesNotMatch(pagina, /setIsDesktop/);
  assert.doesNotMatch(
    pagina,
    /window\.matchMedia\("\(min-width: 1024px\)"\)/,
  );
  assert.match(pagina, /<SeguindoPageControls\s+isDesktop=\{isDesktop\}/);
  assert.match(controls, /<SeguindoHeader\s+isDesktop=\{isDesktop\}/);
  assert.match(controls, /<SeguindoSocialToolbar\s+isDesktop=\{isDesktop\}/);
  assert.match(controls, /<SeguindoSortingPanel\s+isDesktop=\{isDesktop\}/);
  assert.match(toolbar, /isDesktop \? desktopSocialToolbarStyle : socialToolbarStyle/);
  assert.match(painel, /isDesktop \? desktopSortingSheetStyle : sortingSheetStyle/);
  assert.match(
    pagina,
    /import \{ useSeguindoSortingSheetBodyLock \} from "\.\/hooks\/use-seguindo-sorting-sheet-body-lock";/,
  );
  assert.match(
    pagina,
    /useSeguindoSortingSheetBodyLock\(mostrarPainelOrdenacao\);/,
  );
  assert.match(
    pagina,
    /useSeguindoPageDiscoveryState\(\);/,
  );
  assert.match(pagina, /useSeguindoPageInitialSync\(\{/);
});
