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
  assert.equal((submitActionSource.match(/finalizarLogin\(data\.user\.id\)/g) || []).length, 2);
  assert.match(submitActionSource, /fluxo\.current\.redirecionado = true;[\s\S]*finalizarAutenticacaoLogin\(\{ userId, router \}\)/);
  assert.match(page, /salvarProfile/);
  assert.match(submitActionSource, /registrarAceiteTermosPublicacao/);
  assert.doesNotMatch(submitActionSource, /aguardarLogin|1600/);
  assert.match(submitActionSource, /prepararContinuacao\(data\.user\.id\)/);
});
