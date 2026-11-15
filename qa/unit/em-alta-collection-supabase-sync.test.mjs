import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
// Mantém os cenários executáveis de resiliência no gate pretest:session existente.
import "./em-alta-resilience.test.mjs";
const fonte=readFileSync(new URL("../../app/em-alta/lib/em-alta-collection-supabase-sync.ts",import.meta.url),"utf8");
test("inclusão mantém conflito único e visibilidade existente sem delete prévio",()=>{
  assert.match(fonte,/onConflict: "user_id,obra_id", ignoreDuplicates: true/);
  assert.match(fonte,/visibilidade: "parcial"/);
  assert.match(fonte,/if \(!ativo\)[\s\S]*\.delete\(\)/);
  assert.doesNotMatch(fonte,/\.insert\(|\.rpc\(|\.update\(/);
});
test("sincronização é vinculada à conta esperada e serializada por obra/coleção",()=>{
  assert.match(fonte,/data\.user\?\.id !== userId/);
  assert.match(fonte,/JSON\.stringify\(\[tabela, userId, obraId\]\)/);
  assert.match(fonte,/anterior\.then/);
  assert.match(fonte,/if \(filas\.get\(chave\)\?\.tarefa === tarefa\) filas\.delete\(chave\)/);
});
