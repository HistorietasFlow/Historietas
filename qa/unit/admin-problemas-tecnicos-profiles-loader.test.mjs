import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const page=readFileSync("app/admin/problemas-tecnicos/page.tsx","utf8");
const source=readFileSync("app/admin/problemas-tecnicos/loaders/buscar-perfis-problemas-tecnicos-admin.ts","utf8");
test("loader de perfis preserva duas consultas paralelas",()=>{
  assert.match(source,/Promise\.all/);
  assert.equal((source.match(/\.from\("profiles"\)/g)||[]).length,2);
  assert.equal((source.match(/\.select\("id,user_id,nome,username"\)/g)||[]).length,2);
  assert.match(source,/\.in\("user_id", ids\)/);assert.match(source,/\.in\("id", ids\)/);
  assert.equal((source.match(/\.limit\(1000\)/g)||[]).length,2);
  assert.doesNotMatch(source,/useState|useEffect|router|localStorage|</);
  assert.match(page,/buscarPerfisProblemasTecnicosAdmin/);
  assert.match(page,/new Set\(userIds\.map\(\(id\) => id\.trim\(\)\)\.filter\(Boolean\)\)/);
  assert.match(page,/porUserId\.error/);assert.match(page,/porId\.error/);assert.match(page,/setNomesUsuarios/);
});
