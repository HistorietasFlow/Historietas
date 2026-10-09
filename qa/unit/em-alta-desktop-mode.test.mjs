import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/em-alta/hooks/use-em-alta-desktop-mode.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);

test("useEmAltaDesktopMode preserva o lifecycle responsivo com timer", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useEmAltaDesktopMode\(\)/);
  assert.match(hook, /const \[isDesktop, setIsDesktop\] = useState\(false\);/);
  assert.match(
    hook,
    /window\.matchMedia\("\(min-width: 1024px\)"\)/,
  );
  assert.match(
    hook,
    /const atualizarModoDesktop = \(\) => \{\s*setIsDesktop\(mediaQuery\.matches\);\s*\};/,
  );
  assert.match(
    hook,
    /const atualizarModoDesktopTimer = window\.setTimeout\(\s*atualizarModoDesktop,\s*0,\s*\);/,
  );
  assert.equal((hook.match(/atualizarModoDesktop\(\);/g) || []).length, 0);
  assert.doesNotMatch(hook, /window\.setTimeout\([^]*?atualizarModoDesktop\(\)/);
  assert.match(
    hook,
    /mediaQuery\.addEventListener\("change", atualizarModoDesktop\);/,
  );
  assert.match(
    hook,
    /window\.clearTimeout\(atualizarModoDesktopTimer\);\s*mediaQuery\.removeEventListener\("change", atualizarModoDesktop\);/,
  );
  assert.match(hook, /mediaQuery\.addListener\(atualizarModoDesktop\);/);
  assert.match(
    hook,
    /window\.clearTimeout\(atualizarModoDesktopTimer\);\s*mediaQuery\.removeListener\(atualizarModoDesktop\);/,
  );
  assert.match(hook, /useEffect\(\(\) => \{[^]*?\}, \[\]\);/);
  assert.match(hook, /return isDesktop;/);
  assert.doesNotMatch(hook, /return \{[^]*?setIsDesktop/);
});

test("Em Alta delega somente o modo desktop e preserva suas fronteiras", () => {
  assert.match(
    pagina,
    /import \{ useEmAltaDesktopMode \} from "\.\/hooks\/use-em-alta-desktop-mode";/,
  );
  assert.match(pagina, /const isDesktop = useEmAltaDesktopMode\(\);/);
  assert.doesNotMatch(
    pagina,
    /const \[isDesktop, setIsDesktop\] = useState\(false\);/,
  );
  assert.doesNotMatch(pagina, /setIsDesktop/);
  assert.doesNotMatch(
    pagina,
    /window\.matchMedia\("\(min-width: 1024px\)"\)/,
  );
  assert.doesNotMatch(pagina, /atualizarModoDesktopTimer/);
  assert.equal((pagina.match(/\bisDesktop\b/g) || []).length, 71);

  assert.match(pagina, /async function carregarRanking\(\)/);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
  assert.match(pagina, /localStorage\.getItem/);
  assert.match(pagina, /function EmAltaLanguageBridge\(\)/);
  assert.match(pagina, /function LoadingSpinner\(/);
  assert.match(pagina, /function RankingSection\(/);
  assert.match(pagina, /function AutoresEmAltaSection\(/);
});
