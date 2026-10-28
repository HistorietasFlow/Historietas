import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const page=readFileSync("app/admin/problemas-tecnicos/page.tsx","utf8");
const source=readFileSync("app/admin/problemas-tecnicos/components/admin-problemas-tecnicos-ticket-priority-control.tsx","utf8");
test("prioridade preserva contrato",()=>{["PrioridadeProblemaTecnico","PRIORIDADES_PROBLEMAS","PRIORIDADE_LABEL","Prioridade","Priority","disabled={salvando}","fieldStyle","fieldLabelStyle","fieldControlStyle"].forEach(x=>assert.ok(source.includes(x)));assert.doesNotMatch(source,/supabase|useState|useEffect|router|localStorage|atualizarChamado|textarea/);});
test("pagina mantem orquestracao",()=>["AdminProblemasTecnicosTicketPriorityControl","controlsGridStyle","AdminProblemasTecnicosTicketStatusControl","atualizarChamado","Prioridade do chamado atualizada."].forEach(x=>assert.ok(page.includes(x))));

test("pagina remove imports exclusivos do controle de prioridade",()=>{assert.doesNotMatch(page,/\bfieldControlStyle\b/);assert.doesNotMatch(page,/\bPRIORIDADE_LABEL\b/);assert.doesNotMatch(page,/\bPRIORIDADES_PROBLEMAS\b/);assert.doesNotMatch(page,/\bPrioridadeProblemaTecnico\b/);});
