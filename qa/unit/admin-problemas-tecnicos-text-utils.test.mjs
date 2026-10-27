import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const page=readFileSync("app/admin/problemas-tecnicos/page.tsx","utf8");
const source=readFileSync("app/admin/problemas-tecnicos/lib/admin-problemas-tecnicos-text-utils.ts","utf8");
test("textos e cores de problemas técnicos permanecem no módulo puro",()=>{
  ["STATUS_LABEL","PRIORIDADE_LABEL","CATEGORIA_LABEL","traduzir","corStatus","corPrioridade"].forEach(item=>assert.ok(source.includes(item),item));
  ["#F59E0B","#60A5FA","#C084FC","#4ADE80","#A1A1AA","#FB7185","#94A3B8"].forEach(cor=>assert.ok(source.includes(cor),cor));
  assert.doesNotMatch(source,/useState|useEffect|supabase|fetch\(|router|localStorage/);
  assert.match(page,/admin-problemas-tecnicos-text-utils/);
  assert.doesNotMatch(page,/function corStatus|function corPrioridade|function traduzir/);
});
