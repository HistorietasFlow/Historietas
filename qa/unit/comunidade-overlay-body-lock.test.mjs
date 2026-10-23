import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/comunidade/hooks/use-comunidade-overlay-body-lock.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("useComunidadeOverlayBodyLock preserva lock, overscroll e foco do composer", () => {
  assert.match(hook, /^"use client";/);
  assert.match(
    hook,
    /export function useComunidadeOverlayBodyLock\(\{[\s\S]*?\}: UseComunidadeOverlayBodyLockOptions\)/,
  );
  assert.match(
    hook,
    /if \(!bloqueioPrimario && !bloqueioSecundario\) \{\s*return;\s*\}/,
  );
  assert.match(hook, /document\.body\.style\.getPropertyValue\("overflow"\)/);
  assert.match(
    hook,
    /document\.documentElement\.style\.getPropertyValue\(\s*"overscroll-behavior"\s*\)/,
  );
  assert.match(hook, /document\.body\.style\.setProperty\("overflow", "hidden"\)/);
  assert.match(
    hook,
    /document\.documentElement\.style\.setProperty\("overscroll-behavior", "none"\)/,
  );
  assert.match(
    hook,
    /focoComposerRef\.current\?\.focus\(\);\s*\}, 80\)/,
  );
  assert.match(hook, /window\.clearTimeout\(focoTimer\);/);
  assert.match(hook, /document\.body\.style\.removeProperty\("overflow"\)/);
  assert.match(
    hook,
    /document\.documentElement\.style\.removeProperty\("overscroll-behavior"\)/,
  );
  assert.match(
    hook,
    /\}, \[bloqueioPrimario, bloqueioSecundario, focoComposerRef\]\);/,
  );
});

test("Comunidade delega os tres lifecycles de overlay sem alterar seus gatilhos", () => {
  assert.match(
    pagina,
    /import \{ useComunidadeOverlayBodyLock \} from "\.\/hooks\/use-comunidade-overlay-body-lock";/,
  );
  assert.match(
    pagina,
    /useComunidadeOverlayBodyLock\(\{\s*bloqueioPrimario: menuAcoesRapidasComunidadeAberto,\s*bloqueioSecundario: postMenuAbertoId,\s*\}\);/,
  );
  assert.match(
    pagina,
    /useComunidadeOverlayBodyLock\(\{ bloqueioPrimario: comentariosPostId \}\);/,
  );
  assert.match(
    pagina,
    /useComunidadeOverlayBodyLock\(\{\s*bloqueioPrimario: composerAberto,\s*focoComposerRef: textoPostRef,\s*\}\);/,
  );
  assert.doesNotMatch(pagina, /document\.body\.style\.setProperty\("overflow", "hidden"\)/);
  assert.doesNotMatch(
    pagina,
    /document\.documentElement\.style\.setProperty\("overscroll-behavior", "none"\)/,
  );
  assert.match(pagina, /CommunityPostComposer/);
  assert.match(pagina, /ComentariosSheet/);
});
