import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/login/page.tsx", "utf8");
const source = readFileSync("app/login/actions/finalizar-autenticacao-login.ts", "utf8");
const submitActionSource = readFileSync(
  "app/login/hooks/useLoginSubmitAction.ts",
  "utf8",
);

test("finalização preserva storage e redirect ordenados", () => {
  assert.match(source, /sincronizarStorageUsuarioLogin\(userId\)[\s\S]*router\.replace\(obterRedirectToAtual\("\/perfil-autor"\)\)[\s\S]*router\.refresh\(\)/);
  assert.doesNotMatch(source, /try|catch|useState|useEffect|supabase|<[A-Z][A-Za-z0-9]*/);
  assert.doesNotMatch(page, /sincronizarStorageUsuarioLogin\(/);
  assert.doesNotMatch(page, /router\.replace\(obterRedirectToAtual\("\/perfil-autor"\)\)/);
  assert.equal((submitActionSource.match(/finalizarAutenticacaoLogin\(\{ userId: data\.user\.id, router \}\)/g) || []).length, 2);
  assert.match(page, /salvarProfile/);
  assert.match(submitActionSource, /registrarAceiteTermosPublicacao/);
  assert.match(submitActionSource, /aguardarLogin\(1600\)/);
});
