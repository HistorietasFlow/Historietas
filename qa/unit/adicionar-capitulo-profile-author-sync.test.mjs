import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const source=readFileSync(new URL("../../app/adicionar-capitulo/actions/sincronizar-autor-obra-profile-adicionar-capitulo.ts",import.meta.url),"utf8");const page=readFileSync(new URL("../../app/adicionar-capitulo/page.tsx",import.meta.url),"utf8");
test("sync de autor preserva contrato",()=>{assert.match(source,/obraId\.trim\(\)/);assert.match(source,/userId\.trim\(\)/);assert.match(source,/nomeProfile\.trim\(\)/);assert.match(source,/\.from\("obras"\)/);assert.match(source,/atualizado_em: new Date\(\)\.toISOString\(\)/);assert.match(source,/\.eq\("id", obraIdLimpo\)/);assert.match(source,/\.eq\("user_id", usuarioId\)/);assert.doesNotMatch(page,/function sincronizarAutorObraProfileAdicionarCapitulo\(/);assert.match(page,/void sincronizarAutorObraProfileAdicionarCapitulo\(/);});
