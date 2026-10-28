import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const page=readFileSync("app/admin/problemas-tecnicos/page.tsx","utf8");
const source=readFileSync("app/admin/problemas-tecnicos/components/admin-problemas-tecnicos-ticket-status-control.tsx","utf8");
test("controle preserva status",()=>{["StatusProblemaTecnico","STATUS_PROBLEMAS","STATUS_LABEL","Status","Estado","disabled={salvando}","fieldStyle","fieldLabelStyle","fieldControlStyle"].forEach(x=>assert.ok(source.includes(x)));assert.doesNotMatch(source,/supabase|useState|useEffect|router|localStorage|atualizarChamado|textarea/);});
test("pagina mantem mutation e prioridade",()=>["AdminProblemasTecnicosTicketStatusControl","controlsGridStyle","Prioridade","atualizarChamado","Status do chamado atualizado."].forEach(x=>assert.ok(page.includes(x))));
