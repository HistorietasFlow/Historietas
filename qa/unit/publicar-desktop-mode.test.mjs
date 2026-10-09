import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(new URL("../../app/publicar/hooks/use-publicar-desktop-mode.ts", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/publicar/page.tsx", import.meta.url), "utf8");

test("usePublicarDesktopMode preserva o lifecycle responsivo", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /useState\(false\)/);
  assert.match(hook, /window\.matchMedia\("\(min-width: 1024px\)"\)/);
  assert.match(hook, /setIsDesktop\(mediaQuery\.matches\)/);
  assert.match(hook, /window\.setTimeout\(\s*atualizarModoDesktop,\s*0\s*\)/);
  assert.match(hook, /addEventListener\("change", atualizarModoDesktop\)/);
  assert.match(hook, /removeEventListener\("change", atualizarModoDesktop\)/);
  assert.match(hook, /addListener\(atualizarModoDesktop\)/);
  assert.match(hook, /removeListener\(atualizarModoDesktop\)/);
  assert.equal((hook.match(/window\.clearTimeout\(atualizarModoDesktopTimer\)/g) || []).length, 2);
  assert.match(hook, /\}, \[\]\);/);
  assert.match(hook, /return isDesktop;/);
});

test("Publicar delega somente o modo desktop", () => {
  assert.match(pagina, /import \{ usePublicarDesktopMode \} from "\.\/hooks\/use-publicar-desktop-mode";/);
  assert.match(pagina, /const isDesktop = usePublicarDesktopMode\(\);/);
  assert.doesNotMatch(pagina, /setIsDesktop/);
  assert.doesNotMatch(pagina, /window\.matchMedia\("\(min-width: 1024px\)"\)/);
  assert.equal((pagina.match(/\bisDesktop\b/g) || []).length, 41);
  assert.match(pagina, /async function salvarObra/);
  assert.match(pagina, /supabase\.auth\.getUser/);
});
