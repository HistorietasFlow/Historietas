import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/explorar/hooks/use-explorar-desktop-mode.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);

test("useExplorarDesktopMode preserva o lifecycle responsivo síncrono", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useExplorarDesktopMode\(\)/);
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
    /setIsDesktop\(mediaQuery\.matches\);\s*\};\s*atualizarModoDesktop\(\);/,
  );
  assert.doesNotMatch(hook, /window\.setTimeout/);
  assert.match(
    hook,
    /mediaQuery\.addEventListener\("change", atualizarModoDesktop\);[\s\S]*?mediaQuery\.removeEventListener\("change", atualizarModoDesktop\);/,
  );
  assert.match(hook, /mediaQuery\.addListener\(atualizarModoDesktop\);/);
  assert.match(
    hook,
    /mediaQuery\.addListener\(atualizarModoDesktop\);[\s\S]*?mediaQuery\.removeListener\(atualizarModoDesktop\);/,
  );
  assert.match(hook, /\}, \[\]\);/);
  assert.match(hook, /return isDesktop;/);
});

test("Explorar delega apenas o modo desktop e mantém as fronteiras sensíveis", () => {
  assert.match(
    pagina,
    /import \{ useExplorarDesktopMode \} from "\.\/hooks\/use-explorar-desktop-mode";/,
  );
  assert.match(pagina, /const isDesktop = useExplorarDesktopMode\(\);/);
  assert.doesNotMatch(
    pagina,
    /const \[isDesktop, setIsDesktop\] = useState\(false\);/,
  );
  assert.doesNotMatch(pagina, /setIsDesktop/);
  assert.doesNotMatch(
    pagina,
    /window\.matchMedia\("\(min-width: 1024px\)"\)/,
  );
  assert.equal((pagina.match(/\bisDesktop\b/g) || []).length, 76);
  assert.match(
    pagina,
    /useEffect\(\(\) => \{[\s\S]*?mostrarFiltrosAvancados[\s\S]*?document\.body\.style\.overflow = "hidden";[\s\S]*?document\.documentElement\.style\.overflow = "hidden";/,
  );
  assert.match(pagina, /async function carregarExplorar\(\)/);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
  assert.match(pagina, /listarSelecaoCatalogo/);
  assert.match(pagina, /localStorage\.getItem/);
});
