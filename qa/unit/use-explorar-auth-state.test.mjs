import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (caminho) =>
  readFileSync(new URL(caminho, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler("../../app/explorar/hooks/use-explorar-auth-state.ts");
const hookEstado = ler("../../app/explorar/hooks/use-explorar-auth-login-state.ts");
const pagina = ler("../../app/explorar/page.tsx");

test("hook de autenticação preserva consulta, assinatura e limpeza", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /useEffect\(\(\) => \{/);
  assert.match(hook, /let componenteAtivo = true;/);
  assert.match(hook, /let versaoIdentidade = 0;/);
  assert.match(hook, /const versaoConsulta = versaoIdentidade;/);
  assert.match(hook, /supabase\.auth\.getUser\(\)/);
  assert.match(hook, /const userId = data\.user\?\.id \|\| "";/);
  assert.match(hook, /setUsuarioIdExplorar\(userId\);/);
  assert.match(hook, /setUsuarioLogado\(Boolean\(userId\)\);/);
  assert.match(hook, /\} catch \{/);
  assert.match(hook, /setUsuarioLogado\(false\);/);
  assert.match(hook, /supabase\.auth\.onAuthStateChange/);
  assert.match(hook, /versaoIdentidade \+= 1;/);
  assert.match(hook, /if \(session\?\.user\) \{\s*setMensagemLogin\(""\);\s*return;\s*\}\s*setFiltroColecao\("todos"\);/);
  assert.match(hook, /componenteAtivo = false;\s*subscription\.unsubscribe\(\);/);
  assert.match(hook, /\}, \[\s*setUsuarioIdExplorar,\s*setUsuarioLogado,\s*setMensagemLogin,\s*setFiltroColecao,\s*\]\);/);
});

test("página mantém estados e delega somente o lifecycle de autenticação", () => {
  assert.match(pagina, /import \{ useExplorarAuthState \} from "\.\/hooks\/use-explorar-auth-state";/);
  assert.match(hookEstado, /usuarioLogado, setUsuarioLogado\] = useState\(false\)/);
  assert.match(hookEstado, /usuarioIdExplorar, setUsuarioIdExplorar\] = useState\(""\)/);
  assert.match(hookEstado, /mensagemLogin, setMensagemLogin\] = useState\(""\)/);
  assert.doesNotMatch(hookEstado, /useEffect|supabase|return\s*\(\s*</);
  assert.match(pagina, /import \{ useExplorarAuthLoginState \} from "\.\/hooks\/use-explorar-auth-login-state";/);
  assert.match(pagina, /\} = useExplorarAuthLoginState\(\);/);
  assert.doesNotMatch(pagina, /const \[usuarioLogado, setUsuarioLogado\]/);
  assert.doesNotMatch(pagina, /const \[mensagemLogin, setMensagemLogin\]/);
  assert.match(pagina, /useExplorarAuthState\(\{\s*setUsuarioIdExplorar,\s*setUsuarioLogado,\s*setMensagemLogin,\s*setFiltroColecao,\s*\}\);/);
  assert.doesNotMatch(pagina, /supabase\.auth\.getUser|supabase\.auth\.onAuthStateChange|async function verificarUsuarioLogado/);
});
