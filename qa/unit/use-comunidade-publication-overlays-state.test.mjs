import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler(
  "../../app/comunidade/hooks/use-comunidade-publication-overlays-state.ts",
);
const pagina = ler("../../app/comunidade/page.tsx");

test("hook centraliza somente o estado dos overlays de publicação", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /import \{ useState \} from "react";/);
  assert.match(
    hook,
    /import type \{ DenunciaAlvoComunidade \} from "\.\.\/components\/community-report-target";/,
  );
  assert.match(hook, /export function useComunidadePublicationOverlaysState\(\)/);
  assert.match(
    hook,
    /postMenuAbertoId, setPostMenuAbertoId\] = useState<string \| null>\(null\)/,
  );
  assert.match(
    hook,
    /denunciaAlvo, setDenunciaAlvo\][\s\S]*?useState<DenunciaAlvoComunidade \| null>\(null\)/,
  );
  assert.match(
    hook,
    /comentariosPostId, setComentariosPostId\] = useState<string \| null>\(null\)/,
  );
  assert.match(hook, /function fecharMenuPublicacao\(\) \{\s*setPostMenuAbertoId\(null\);\s*\}/);
  assert.match(hook, /function fecharDenunciaPublicacao\(\) \{\s*setDenunciaAlvo\(null\);\s*\}/);
  assert.doesNotMatch(hook, /useEffect|useMemo|supabase|localStorage|router|return\s*\(\s*</);
});

test("página delega overlays e preserva lifecycles, navegação e ações", () => {
  assert.match(
    pagina,
    /import \{ useComunidadePublicationOverlaysState \} from "\.\/hooks\/use-comunidade-publication-overlays-state";/,
  );
  assert.match(pagina, /\} = useComunidadePublicationOverlaysState\(\);/);

  for (const estadoLocal of [
    "const [postMenuAbertoId, setPostMenuAbertoId]",
    "const [denunciaAlvo, setDenunciaAlvo]",
    "const [comentariosPostId, setComentariosPostId]",
  ]) {
    assert.equal(pagina.includes(estadoLocal), false, estadoLocal);
  }

  assert.match(
    pagina,
    /useComunidadeAuthAccountLifecycle\(\{[\s\S]*?setPostMenuAbertoId,[\s\S]*?setComentariosPostId,[\s\S]*?setDenunciaAlvo,[\s\S]*?\}\);/,
  );
  assert.match(pagina, /useComunidadeOverlayBodyLock\(\{[\s\S]*?bloqueioSecundario: postMenuAbertoId,/);
  assert.match(pagina, /useComunidadeOverlayBodyLock\(\{ bloqueioPrimario: comentariosPostId \}\);/);
  assert.match(
    pagina,
    /useComunidadeInitialUrlNavigation\(\{[\s\S]*?comentariosPostId,[\s\S]*?setComentariosPostId,[\s\S]*?\}\);/,
  );
  assert.match(pagina, /obterPostComentariosAbertoComunidade\(posts, comentariosPostId\)/);
  assert.match(pagina, /denunciarConteudoComunidade\([\s\S]*?setPostMenuAbertoId,[\s\S]*?setDenunciaAlvo/);
  assert.match(pagina, /abrirComentarios\([\s\S]*?setComentariosPostId,/);
  assert.match(pagina, /fecharComentarios\(\{ setComentariosPostId \}\)/);
  assert.match(pagina, /function fecharMenuOpcoesPostComunidade\(\) \{\s*fecharMenuPublicacao\(\);\s*\}/);
  assert.match(pagina, /onFechar: fecharDenunciaPublicacao,/);
});
