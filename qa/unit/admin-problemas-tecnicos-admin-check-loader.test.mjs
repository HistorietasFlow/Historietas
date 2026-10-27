import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const page=readFileSync("app/admin/problemas-tecnicos/page.tsx","utf8");
const source=readFileSync("app/admin/problemas-tecnicos/loaders/verificar-administrador-problemas-tecnicos.ts","utf8");
test("loader preserva RPC principal, fallback e erro principal",()=>{
  assert.match(source,/rpc\("usuario_e_admin"\)/);
  assert.match(source,/rpc\("suporte_usuario_e_admin"\)/);
  assert.match(source,/if \(!erroPrincipal\)[\s\S]*?respostaPrincipal === true/);
  assert.match(source,/if \(erroSuporte\)[\s\S]*?throw erroPrincipal/);
  assert.match(source,/respostaSuporte === true/);
  assert.doesNotMatch(source,/useState|useEffect|router|localStorage|</);
  assert.match(page,/verificarAdministradorProblemasTecnicos/);
  assert.match(page,/supabase\.auth\.getUser\(\)/);
  assert.match(page,/setUsuarioId|setEhAdmin/);
});
