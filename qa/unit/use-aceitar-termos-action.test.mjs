import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/aceitar-termos/page.tsx", import.meta.url),
  "utf8",
);
const hookSource = readFileSync(
  new URL(
    "../../app/aceitar-termos/hooks/use-aceitar-termos-action.ts",
    import.meta.url,
  ),
  "utf8",
);

test("ação de aceitar preserva guards, falha e navegação", () => {
  assert.match(hookSource, /export function useAceitarTermosAction\(/);
  assert.match(hookSource, /async function aceitar\(\)/);
  assert.match(hookSource, /if \(salvando\) \{\s*return;\s*\}/);
  assert.match(
    hookSource,
    /if \(!confirmouTermos \|\| !confirmouPrivacidade\)/,
  );
  assert.match(hookSource, /setErro\(t\("erroMarcar"\)\);/);
  assert.match(hookSource, /const resultado = await registrarAceiteTermosPublicacao\(\);/);
  assert.match(hookSource, /if \(!resultado\.aceito\)/);
  assert.match(hookSource, /setErro\(resultado\.erro \|\| t\("erroLogin"\)\);/);
  assert.match(hookSource, /setSalvando\(false\);/);
  assert.match(hookSource, /router\.replace\(redirectTo\);\s*router\.refresh\(\);/);
  assert.match(hookSource, /return \{ aceitar \};/);

  assert.ok(
    hookSource.indexOf("setSalvando(true)") < hookSource.indexOf('setErro("")'),
  );
  assert.ok(
    hookSource.indexOf("router.replace(redirectTo)") <
      hookSource.indexOf("router.refresh()"),
  );
});

test("página preserva o callback de botão e delega a ação", () => {
  assert.match(
    pageSource,
    /import \{ useAceitarTermosAction \} from "\.\/hooks\/use-aceitar-termos-action";/,
  );
  assert.match(
    pageSource,
    /const \{ aceitar \} = useAceitarTermosAction\(\{[\s\S]*?setSalvando,\s*\}\);/,
  );
  assert.match(pageSource, /onClick=\{\(\) => void aceitar\(\)\}/);
  assert.doesNotMatch(pageSource, /async function aceitar\(\)/);
  assert.doesNotMatch(pageSource, /registrarAceiteTermosPublicacao/);
});
