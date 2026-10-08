import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/perfil-autor/hooks/use-perfil-autor-action-message.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

test("usePerfilAutorActionMessage preserva estado e expiração da mensagem", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function usePerfilAutorActionMessage\(\)/);
  assert.match(
    hook,
    /const \[mensagemAcao, setMensagemAcao\] = useState\(""\);/,
  );
  assert.match(hook, /if \(!mensagemAcao\) \{\s*return;\s*\}/);
  assert.match(
    hook,
    /window\.setTimeout\(\(\) => \{\s*setMensagemAcao\(""\);\s*\}, 3000\)/,
  );
  assert.match(hook, /window\.clearTimeout\(timerMensagemAcao\)/);
  assert.match(hook, /\}, \[mensagemAcao\]\);/);
  assert.match(hook, /return \{\s*mensagemAcao,\s*setMensagemAcao,\s*\};/);
});

test("Perfil de Autor mantém mensagens de domínio e toast na página", () => {
  assert.match(
    pagina,
    /import \{ usePerfilAutorActionMessage \} from "\.\/hooks\/use-perfil-autor-action-message";/,
  );
  assert.match(
    pagina,
    /const \{ mensagemAcao, setMensagemAcao \} =\s*usePerfilAutorActionMessage\(\);/,
  );
  assert.doesNotMatch(
    pagina,
    /const \[mensagemAcao, setMensagemAcao\] = useState\(""\);/,
  );
  assert.doesNotMatch(pagina, /timerMensagemAcao/);
  assert.match(pagina, /setMensagemAcao\(""\);/);
  assert.match(
    pagina,
    /setMensagemAcao\("Entre para curtir o TOP 5 deste perfil\."\);/,
  );
  assert.match(pagina, /<ProfileActionToast message=\{mensagemAcao\} \/>/);
});
