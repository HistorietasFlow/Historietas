import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-desktop-mode.ts",
    import.meta.url,
  ),
  "utf8",
);
const cliente = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("hook preserva estado inicial, breakpoint e atualizacao inicial agendada", () => {
  assert.match(hook, /export function useObraDesktopMode\(\)/);
  assert.match(hook, /useState\(false\)/);
  assert.match(hook, /window\.matchMedia\("\(min-width: 1024px\)"\)/);
  assert.match(hook, /setIsDesktop\(mediaQuery\.matches\);/);
  assert.match(
    hook,
    /window\.setTimeout\(\s*atualizarModoDesktop,\s*0,\s*\)/,
  );
  assert.match(hook, /return isDesktop;/);
});

test("hook preserva inscricao moderna e fallback legado com cleanup do timer", () => {
  assert.match(
    hook,
    /mediaQuery\.addEventListener\("change", atualizarModoDesktop\);/,
  );
  assert.match(
    hook,
    /mediaQuery\.removeEventListener\("change", atualizarModoDesktop\);/,
  );
  assert.match(hook, /mediaQuery\.addListener\(atualizarModoDesktop\);/);
  assert.match(hook, /mediaQuery\.removeListener\(atualizarModoDesktop\);/);
  assert.equal(
    (hook.match(/window\.clearTimeout\(atualizarModoDesktopTimer\);/g) || [])
      .length,
    2,
  );
});

test("cliente delega somente a deteccao de desktop ao hook e preserva consumidores", () => {
  assert.match(
    cliente,
    /import \{ useObraDesktopMode \} from "\.\/hooks\/use-obra-desktop-mode";/,
  );
  assert.match(cliente, /const isDesktop = useObraDesktopMode\(\);/);
  assert.doesNotMatch(cliente, /const \[isDesktop, setIsDesktop\] = useState/);
  assert.doesNotMatch(cliente, /window\.matchMedia\("\(min-width: 1024px\)"\)/);
  assert.match(cliente, /<ObraHeroHeader[\s\S]*?isDesktop=\{isDesktop\}/);
  assert.match(cliente, /<ObraCommentsSheet[\s\S]*?isDesktop=\{isDesktop\}/);
});
