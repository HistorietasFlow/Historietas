import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/admin/comunidade/hooks/use-admin-comunidade-desktop-mode.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/admin/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("useAdminComunidadeDesktopMode preserva o lifecycle responsivo síncrono", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useAdminComunidadeDesktopMode\(\)/);
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

test("Admin Comunidade delega apenas o modo desktop e mantém fronteiras sensíveis", () => {
  assert.match(
    pagina,
    /import \{ useAdminComunidadeDesktopMode \} from "\.\/hooks\/use-admin-comunidade-desktop-mode";/,
  );
  assert.match(pagina, /const isDesktop = useAdminComunidadeDesktopMode\(\);/);
  assert.doesNotMatch(
    pagina,
    /const \[isDesktop, setIsDesktop\] = useState\(false\);/,
  );
  assert.doesNotMatch(pagina, /setIsDesktop/);
  assert.doesNotMatch(
    pagina,
    /window\.matchMedia\("\(min-width: 1024px\)"\)/,
  );
  assert.equal((pagina.match(/\bisDesktop\b/g) || []).length, 16);
  assert.match(pagina, /async function iniciarModeracao\(\)/);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
  assert.match(pagina, /supabase\s*\.from\("comunidade_denuncias"\)/);
  assert.match(pagina, /setMenuDenunciaAbertoId\(""\)/);
});
