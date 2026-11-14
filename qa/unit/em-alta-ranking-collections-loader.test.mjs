import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const fonte=readFileSync(new URL("../../app/em-alta/lib/em-alta-ranking-collections-loader.ts",import.meta.url),"utf8");
test("snapshot diferencia vazio confirmado de falha e protege cache por versão",()=>{
  assert.match(fonte,/Promise\.allSettled/);
  assert.match(fonte,/resultados\[0\]\.status === "fulfilled" \? resultados\[0\]\.value : localFavoritas/);
  assert.match(fonte,/resultados\[1\]\.status === "fulfilled" \? resultados\[1\]\.value : localConcluidas/);
  assert.match(fonte,/if \(!obsoletas\)/);
  assert.match(fonte,/versao !== obterVersaoColecoesEmAlta/);
});
test("coleções aguardam gravações anteriores e não executam mutações remotas",()=>{
  assert.match(fonte,/await aguardarColecoesEmAlta\(userIdAtual\)/);
  assert.doesNotMatch(fonte,/supabase\.from|\.insert\(|\.upsert\(|\.delete\(/);
});
