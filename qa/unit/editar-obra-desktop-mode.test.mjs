import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hookSource = readFileSync(
  new URL(
    "../../app/editar-obra/hooks/useEditarObraDesktopMode.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const previewSource = readFileSync(
  new URL(
    "../../app/editar-obra/components/EditarObraPreview.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("useEditarObraDesktopMode preserva o lifecycle responsivo postergado", () => {
  assert.match(hookSource, /export function useEditarObraDesktopMode\(\)/);
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
    /mediaQuery\.addEventListener\("change", atualizarModoDesktop\);/,
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
  assert.match(hookSource, /return isDesktop;/);
});

test("Editar Obra delega somente o lifecycle desktop e mantém seus consumidores", () => {
  assert.match(
    pageSource,
    /import \{ useEditarObraDesktopMode \} from "\.\/hooks\/useEditarObraDesktopMode";/,
  );
  assert.match(pageSource, /const isDesktop = useEditarObraDesktopMode\(\);/);
  assert.doesNotMatch(pageSource, /setIsDesktop/);
  assert.doesNotMatch(pageSource, /window\.matchMedia/);
  assert.match(pageSource, /isDesktop \? desktopContainerStyle : containerStyle/);
  assert.match(pageSource, /isDesktop \? desktopFormStyle : formStyle/);
  assert.match(pageSource, /<EditarObraPreview[\s\S]*?isDesktop=\{isDesktop\}/);
  assert.match(
    previewSource,
    /<aside style=\{isDesktop \? desktopPreviewPanelStyle : previewPanelStyle\}>/,
  );
  assert.match(
    previewSource,
    /<article style=\{isDesktop \? desktopPreviewCardStyle : previewCardStyle\}>/,
  );
});
