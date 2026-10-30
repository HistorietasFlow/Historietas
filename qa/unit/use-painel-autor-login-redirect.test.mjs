import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hookSource = readFileSync(
  new URL(
    "../../app/painel-autor/hooks/use-painel-autor-login-redirect.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);

test("usePainelAutorLoginRedirect preserva o lifecycle e a dependência de redirect", () => {
  assert.match(hookSource, /^"use client";/);
  assert.match(hookSource, /useEffect\(\(\) => \{/);
  assert.match(hookSource, /!verificandoUsuario/);
  assert.match(hookSource, /!usuarioIdLogado/);
  assert.match(hookSource, /router\.replace\([\s\S]*?criarLoginHrefPainelAutor\(\)/);
  assert.match(
    hookSource,
    /\}, \[\s*router,\s*usuarioIdLogado,\s*verificandoUsuario,?\s*\]\);/,
  );
  assert.doesNotMatch(hookSource, /router\.push/);
});

test("página monta o hook sem manter o effect de redirecionamento", () => {
  assert.match(
    pageSource,
    /import \{ usePainelAutorLoginRedirect \} from "\.\/hooks\/use-painel-autor-login-redirect";/,
  );
  assert.match(
    pageSource,
    /usePainelAutorLoginRedirect\(\{[\s\S]*?router,[\s\S]*?usuarioIdLogado,[\s\S]*?verificandoUsuario,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(
    pageSource,
    /useEffect\(\(\) => \{[\s\S]*?!verificandoUsuario[\s\S]*?!usuarioIdLogado[\s\S]*?router\.replace/,
  );
});
