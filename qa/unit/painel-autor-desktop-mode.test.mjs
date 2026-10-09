import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const hook = await readFile(
  "app/painel-autor/hooks/use-painel-autor-desktop-mode.ts",
  "utf8",
);
const pagina = await readFile("app/painel-autor/page.tsx", "utf8");

test("usePainelAutorDesktopMode preserva o lifecycle responsivo síncrono", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function usePainelAutorDesktopMode\(\)/);
  assert.match(hook, /useState\(false\)/);
  assert.match(hook, /function atualizarLayoutDesktop\(\)/);
  assert.match(hook, /setIsDesktop\(window\.innerWidth >= 1024\)/);
  assert.match(hook, /atualizarLayoutDesktop\(\);/);
  assert.doesNotMatch(hook, /setTimeout/);
  assert.match(
    hook,
    /window\.addEventListener\("resize", atualizarLayoutDesktop\)/,
  );
  assert.match(
    hook,
    /window\.removeEventListener\("resize", atualizarLayoutDesktop\)/,
  );
  assert.match(hook, /\}, \[\]\);/);
  assert.match(hook, /return isDesktop;/);
});

test("Painel do Autor delega somente o modo desktop", () => {
  assert.match(
    pagina,
    /import \{ usePainelAutorDesktopMode \} from "\.\/hooks\/use-painel-autor-desktop-mode";/,
  );
  assert.match(pagina, /const isDesktop = usePainelAutorDesktopMode\(\);/);
  assert.doesNotMatch(pagina, /const \[isDesktop, setIsDesktop\] = useState\(false\)/);
  assert.doesNotMatch(pagina, /setIsDesktop\(/);
  assert.doesNotMatch(pagina, /window\.innerWidth >= 1024/);
  assert.doesNotMatch(pagina, /addEventListener\("resize", atualizarLayoutDesktop\)/);
  assert.equal((pagina.match(/\bisDesktop\b/g) || []).length, 25);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
  assert.match(pagina, /function PainelAutorLanguageBridge\(\)/);
});
