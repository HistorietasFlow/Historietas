import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const page=readFileSync("app/admin/problemas-tecnicos/page.tsx","utf8");
const card=readFileSync("app/admin/problemas-tecnicos/components/admin-problemas-tecnicos-ticket-card.tsx","utf8");
const source=readFileSync("app/admin/problemas-tecnicos/components/admin-problemas-tecnicos-ticket-info-grid.tsx","utf8");
test("grid preserva informacoes basicas",()=>{
  ["ProblemaTecnico","nomeUsuario","Usuário","E-mail","problema.emailContato || \"—\"","Criado em","Atualizado em","formatarData","detailGridStyle"].forEach((item)=>assert.ok(source.includes(item)));
  assert.doesNotMatch(source,/supabase|useState|useEffect|router|localStorage|select|textarea|atualizarChamado|setObservacoes/);
});
test("card mantem detalhes e controles",()=>{
  ["AdminProblemasTecnicosTicketInfoGrid","{aberto && (","detailsStyle","controlsGridStyle","atualizarChamado","setObservacoes"].forEach((item)=>assert.ok(card.includes(item)));
  assert.doesNotMatch(page,/AdminProblemasTecnicosTicketInfoGrid/);
});
