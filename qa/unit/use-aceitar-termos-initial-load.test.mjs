import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/aceitar-termos/page.tsx", import.meta.url),
  "utf8",
);
const hookSource = readFileSync(
  new URL(
    "../../app/aceitar-termos/hooks/use-aceitar-termos-initial-load.ts",
    import.meta.url,
  ),
  "utf8",
);

test("lifecycle inicial de Aceitar Termos preserva autenticação, redirect e cleanup", () => {
  assert.match(hookSource, /export function useAceitarTermosInitialLoad\(/);
  assert.match(hookSource, /useEffect\(\(\) => \{/);
  assert.match(hookSource, /let ativo = true;/);
  assert.match(
    hookSource,
    /new URLSearchParams\(window\.location\.search\)/,
  );
  assert.match(
    hookSource,
    /obterRedirectToAceiteTermos\(params\.get\("redirectTo"\), "\/"\)/,
  );
  assert.match(hookSource, /setRedirectTo\(destino\);/);
  assert.match(hookSource, /supabase\.auth\.getUser\(\)/);
  assert.match(hookSource, /if \(!ativo\) \{\s*return;\s*\}/);
  assert.match(hookSource, /if \(error \|\| !data\.user\)/);
  assert.match(hookSource, /redirectTo: `\/aceitar-termos\?\$\{/);
  assert.match(hookSource, /router\.replace\(`\/login\?\$\{paramsLogin\.toString\(\)\}`\);/);
  assert.match(hookSource, /verificarAceiteTermosPublicacao\(\)/);
  assert.match(hookSource, /setJaAceito\(status\.aceito\);/);
  assert.match(
    hookSource,
    /setErro\(status\.erro && !status\.aceito \? status\.erro : ""\);/,
  );
  assert.match(hookSource, /setCarregando\(false\);/);
  assert.match(hookSource, /void carregar\(\);/);
  assert.match(hookSource, /return \(\) => \{\s*ativo = false;\s*\};/);
  assert.match(hookSource, /\}, \[router\]\);/);

  assert.ok(
    hookSource.indexOf("setRedirectTo(destino)") <
      hookSource.indexOf("supabase.auth.getUser()"),
  );
});

test("página delega apenas o lifecycle inicial ao hook", () => {
  assert.match(
    pageSource,
    /import \{ useAceitarTermosInitialLoad \} from "\.\/hooks\/use-aceitar-termos-initial-load";/,
  );
  assert.match(
    pageSource,
    /useAceitarTermosInitialLoad\(\{\s*router,\s*setRedirectTo,\s*setJaAceito,\s*setErro,\s*setCarregando,\s*\}\);/,
  );
  assert.doesNotMatch(pageSource, /useEffect\(/);
  assert.doesNotMatch(pageSource, /supabase\.auth\.getUser/);
  assert.doesNotMatch(pageSource, /obterRedirectToAceiteTermos/);
  assert.doesNotMatch(pageSource, /verificarAceiteTermosPublicacao/);
});
