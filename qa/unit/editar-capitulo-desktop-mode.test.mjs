import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hookSource = readFileSync(
  new URL(
    "../../app/editar-capitulo/hooks/useEditarCapituloDesktopMode.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-capitulo/page.tsx", import.meta.url),
  "utf8",
);

test("useEditarCapituloDesktopMode preserva o lifecycle responsivo postergado", () => {
  assert.match(hookSource, /export function useEditarCapituloDesktopMode\(\)/);
  assert.match(
    hookSource,
    /const \[isDesktop, setIsDesktop\] = useState\(false\);/,
  );
  assert.match(
    hookSource,
    /const mediaQuery = window\.matchMedia\("\(min-width: 1024px\)"\);/,
  );
  assert.match(
    hookSource,
    /const atualizarModoDesktop = \(\) => \{\s*setIsDesktop\(mediaQuery\.matches\);\s*\};/,
  );
  assert.match(
    hookSource,
    /const atualizarModoDesktopTimer = window\.setTimeout\(\s*atualizarModoDesktop,\s*0\s*\);/,
  );
  assert.match(
    hookSource,
    /if \(typeof mediaQuery\.addEventListener === "function"\) \{[\s\S]*?mediaQuery\.addEventListener\("change", atualizarModoDesktop\);/,
  );
  assert.match(
    hookSource,
    /window\.clearTimeout\(atualizarModoDesktopTimer\);[\s\S]*?mediaQuery\.removeEventListener\("change", atualizarModoDesktop\);/,
  );
  assert.match(hookSource, /mediaQuery\.addListener\(atualizarModoDesktop\);/);
  assert.match(
    hookSource,
    /window\.clearTimeout\(atualizarModoDesktopTimer\);[\s\S]*?mediaQuery\.removeListener\(atualizarModoDesktop\);/,
  );
  assert.match(hookSource, /\}, \[\]\);/);
  assert.match(hookSource, /return isDesktop;/);
  assert.doesNotMatch(hookSource, /supabase|localStorage|router|<\w+/);
});

test("Editar Capitulo delega somente o lifecycle desktop e mantem consumidores", () => {
  assert.match(
    pageSource,
    /import \{ useEditarCapituloDesktopMode \} from "\.\/hooks\/useEditarCapituloDesktopMode";/,
  );
  assert.match(
    pageSource,
    /const isDesktop = useEditarCapituloDesktopMode\(\);/,
  );
  assert.doesNotMatch(pageSource, /setIsDesktop/);
  assert.doesNotMatch(pageSource, /window\.matchMedia/);
  assert.equal((pageSource.match(/\bisDesktop\b/g) || []).length, 31);
  assert.match(pageSource, /isDesktop \? desktopContainerStyle : containerStyle/);
  assert.match(pageSource, /isDesktop \? desktopFormStyle : formStyle/);
  assert.match(pageSource, /isDesktop \? desktopPreviewPanelStyle : previewPanelStyle/);
});
