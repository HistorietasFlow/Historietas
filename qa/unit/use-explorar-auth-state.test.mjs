import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (caminho) =>
  readFileSync(new URL(caminho, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const hook = ler("../../app/explorar/hooks/use-explorar-auth-state.ts");
const pagina = ler("../../app/explorar/page.tsx");

test("hook de autenticação preserva consulta, assinatura e limpeza", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /useEffect\(\(\) => \{/);
  assert.match(hook, /let componenteAtivo = true;/);
  assert.match(hook, /supabase\.auth\.getUser\(\)/);
  assert.match(hook, /const userId = data\.user\?\.id \|\| "";/);
  assert.match(hook, /setUsuarioLogado\(Boolean\(userId\)\);/);
  assert.match(hook, /\} catch \{/);
  assert.match(hook, /setUsuarioLogado\(false\);/);
  assert.match(hook, /supabase\.auth\.onAuthStateChange/);
  assert.match(hook, /if \(session\?\.user\) \{\s*setMensagemLogin\(""\);\s*return;\s*\}\s*setFiltroColecao\("todos"\);/);
  assert.match(hook, /componenteAtivo = false;\s*subscription\.unsubscribe\(\);/);
  assert.match(hook, /\}, \[\s*setUsuarioLogado,\s*setMensagemLogin,\s*setFiltroColecao,\s*\]\);/);
});

test("página mantém estados e delega somente o lifecycle de autenticação", () => {
  assert.match(pagina, /import \{ useExplorarAuthState \} from "\.\/hooks\/use-explorar-auth-state";/);
  assert.match(pagina, /const \[usuarioLogado, setUsuarioLogado\] = useState\(false\);/);
  assert.match(pagina, /const \[mensagemLogin, setMensagemLogin\] = useState\(""\);/);
  assert.match(pagina, /useExplorarAuthState\(\{\s*setUsuarioLogado,\s*setMensagemLogin,\s*setFiltroColecao,\s*\}\);/);
  assert.doesNotMatch(pagina, /supabase\.auth\.getUser|supabase\.auth\.onAuthStateChange|async function verificarUsuarioLogado/);
});
