import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/login/page.tsx", "utf8");
const source = readFileSync(
  "app/login/hooks/useLoginExistingSessionRedirect.ts",
  "utf8",
);

test("hook preserva o redirecionamento de sessão existente", () => {
  assert.match(source, /supabase\.auth\.getUser\(\)/);
  assert.match(source, /componenteAtivo && data\.user/);
  assert.match(source, /salvarProfile\(\s*data\.user\.id,\s*"",\s*data\.user\.email \|\| "",\s*data\.user\.user_metadata,/);
  assert.match(source, /setErro\(t\("profileSyncWarning"\)\)/);
  assert.match(source, /aguardarLogin\(1600\)/);
  assert.match(source, /sincronizarStorageUsuarioLogin\(data\.user\.id\)/);
  assert.match(source, /router\.replace\(obterRedirectToAtual\("\/perfil-autor"\)\)/);
  assert.match(source, /router\.replace[\s\S]*router\.refresh\(\)/);
  assert.match(source, /componenteAtivo = false/);
  assert.match(source, /catch \{\s*\/\/ A página de login deve continuar acessível/);
});

test("página delega somente o lifecycle de sessão existente", () => {
  assert.doesNotMatch(page, /async function redirecionarUsuarioJaLogado/);
  assert.match(page, /useLoginExistingSessionRedirect\(\{ router, salvarProfile, t, setErro \}\)/);
  assert.match(page, /const salvarProfile = useCallback/);
  assert.match(page, /async function enviarFormulario/);
  assert.doesNotMatch(source, /localStorage|<[A-Z][A-Za-z0-9]*/);
});
