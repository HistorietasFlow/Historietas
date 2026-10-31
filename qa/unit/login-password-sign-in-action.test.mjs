import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/login/page.tsx", "utf8");
const source = readFileSync("app/login/actions/entrar-com-senha-login.ts", "utf8");
const submitActionSource = readFileSync(
  "app/login/hooks/useLoginSubmitAction.ts",
  "utf8",
);

test("entrada por senha preserva ação e orquestração", () => {
  assert.match(source, /signInWithPassword\(\{\s*email: emailFinal,\s*password: senha,/);
  assert.match(source, /emailFinal/);
  assert.match(source, /senha/);
  assert.doesNotMatch(page, /signInWithPassword/);
  assert.match(page, /useLoginSubmitAction/);
  assert.match(submitActionSource, /entrarComSenhaLogin\(\{\s*emailFinal,\s*senha,/);
  assert.match(submitActionSource, /if \(error\)/);
  assert.match(submitActionSource, /if \(!data\.user\)/);
  assert.match(submitActionSource, /salvarProfile/);
  assert.match(submitActionSource, /aguardarLogin\(1600\)/);
  assert.match(submitActionSource, /finalizarAutenticacaoLogin\(\{ userId: data\.user\.id, router \}\)/);
  assert.doesNotMatch(page, /from "..\/..\/lib\/supabase\/client"/);
  assert.doesNotMatch(source, /useState|useEffect|router|localStorage|<[A-Z][A-Za-z0-9]*/);
});
