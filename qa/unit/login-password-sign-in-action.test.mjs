import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/login/page.tsx", "utf8");
const source = readFileSync("app/login/actions/entrar-com-senha-login.ts", "utf8");

test("entrada por senha preserva ação e orquestração", () => {
  assert.match(source, /signInWithPassword\(\{\s*email: emailFinal,\s*password: senha,/);
  assert.match(source, /emailFinal/);
  assert.match(source, /senha/);
  assert.doesNotMatch(page, /signInWithPassword/);
  assert.match(page, /entrarComSenhaLogin\(\{\s*emailFinal,\s*senha,/);
  assert.match(page, /if \(error\)/);
  assert.match(page, /if \(!data\.user\)/);
  assert.match(page, /salvarProfile/);
  assert.match(page, /aguardarLogin\(1600\)/);
  assert.match(page, /sincronizarStorageUsuarioLogin/);
  assert.match(page, /router\.replace\(obterRedirectToAtual\("\/perfil-autor"\)\)/);
  assert.doesNotMatch(page, /from "..\/..\/lib\/supabase\/client"/);
  assert.doesNotMatch(source, /useState|useEffect|router|localStorage|<[A-Z][A-Za-z0-9]*/);
});
