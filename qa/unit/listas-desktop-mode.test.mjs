import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/listas/hooks/use-listas-desktop-mode.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/listas/page.tsx", import.meta.url),
  "utf8",
);

const workMenuActions = readFileSync(
  new URL(
    "../../app/listas/hooks/use-listas-work-menu-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const diaryAnnotationActions = readFileSync(
  new URL(
    "../../app/listas/hooks/use-listas-diary-annotation-actions.ts",
    import.meta.url,
  ),
  "utf8",
);

test("useListasDesktopMode preserva o lifecycle responsivo de Listas", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useListasDesktopMode\(\)/);
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
    /const timer = window\.setTimeout\(atualizarModoDesktop, 0\);/,
  );
  assert.doesNotMatch(hook, /atualizarModoDesktop\(\);/);
  assert.match(
    hook,
    /mediaQuery\.addEventListener\("change", atualizarModoDesktop\);[\s\S]*?window\.clearTimeout\(timer\);[\s\S]*?mediaQuery\.removeEventListener\("change", atualizarModoDesktop\);/,
  );
  assert.match(hook, /mediaQuery\.addListener\(atualizarModoDesktop\);/);
  assert.match(
    hook,
    /mediaQuery\.addListener\(atualizarModoDesktop\);[\s\S]*?window\.clearTimeout\(timer\);[\s\S]*?mediaQuery\.removeListener\(atualizarModoDesktop\);/,
  );
  assert.match(hook, /\}, \[\]\);/);
  assert.match(hook, /return isDesktop;/);
});

test("Listas delega apenas o modo desktop e preserva consumidores responsivos", () => {
  assert.match(
    pagina,
    /import \{ useListasDesktopMode \} from "\.\/hooks\/use-listas-desktop-mode";/,
  );
  assert.match(pagina, /const isDesktop = useListasDesktopMode\(\);/);
  assert.doesNotMatch(pagina, /setIsDesktop/);
  assert.doesNotMatch(
    pagina,
    /window\.matchMedia\("\(min-width: 1024px\)"\)/,
  );
  assert.equal((pagina.match(/\bisDesktop\b/g) || []).length, 7);
  assert.match(
    readFileSync(
      new URL("../../app/listas/hooks/use-listas-diary-comments-controls.ts", import.meta.url),
      "utf8",
    ),
    /function iniciarArrasteComentariosDiario[\s\S]*?if \(isDesktop\)/,
  );
  assert.match(
    pagina,
    /const abasCategoriasPerfilAtualStyle = isDesktop \? desktopTabsStyle : tabsStyle;/,
  );
  assert.match(
    pagina,
    /const secaoResultadosAtualStyle = isDesktop\s*\? desktopListSectionStyle\s*:\s*listSectionStyle;/,
  );
  assert.match(
    pagina,
    /import \{ useListasWorkMenuActions \} from "\.\/hooks\/use-listas-work-menu-actions";/,
  );
  assert.match(workMenuActions, /await supabase\.auth\.getUser\(\)/);
  assert.match(
    pagina,
    /import \{ useListasDiaryAnnotationActions \} from "\.\/hooks\/use-listas-diary-annotation-actions";/,
  );
  assert.match(diaryAnnotationActions, /async function salvarAnotacaoListas\(/);
  assert.match(pagina, /useListasDiaryInteractionActions\(\{/);
  assert.doesNotMatch(pagina, /async function enviarComentarioAnotacaoListas\(/);
  assert.match(pagina, /useListasDiaryCommentsRenderer\(\{/);
  assert.match(
    readFileSync(
      new URL("../../app/listas/hooks/use-listas-diary-comments-renderer.tsx", import.meta.url),
      "utf8",
    ),
    /<ListasDiaryCommentsPanel[\s\S]*?isDesktop=\{isDesktop\}/,
  );
});
