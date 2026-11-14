import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const fonte=readFileSync(new URL("../../app/em-alta/hooks/use-em-alta-auth-session.ts",import.meta.url),"utf8");
const pagina=readFileSync(new URL("../../app/em-alta/page.tsx",import.meta.url),"utf8");
test("sessão observa mudanças e cancela identificação inicial obsoleta",()=>{
  assert.match(fonte,/auth\.getUser\(\)/);
  assert.match(fonte,/auth\.onAuthStateChange/);
  assert.match(fonte,/identidadeSessaoRef\.current\.versao === versao/);
  assert.match(fonte,/subscription\.unsubscribe\(\)/);
  assert.doesNotMatch(fonte,/auth\.(signIn|signOut|setSession|updateUser)|\.from\(|localStorage/);
});
test("ação de sessão não confirma para outra conta e a página repassa versão",()=>{
  assert.match(fonte,/identidadeSessaoRef\.current !== esperada/);
  assert.match(fonte,/usuarioId === esperada.usuarioId/);
  assert.match(pagina,/identidadeSessaoRef, autenticacaoCarregada, versaoIdentidade/);
  assert.match(pagina,/useEmAltaRankingCollectionActions\(/);
});
