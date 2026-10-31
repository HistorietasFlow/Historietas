import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const page=readFileSync("app/admin/problemas-tecnicos/page.tsx","utf8");
const source=readFileSync("app/admin/problemas-tecnicos/components/admin-problemas-tecnicos-ticket-description.tsx","utf8");
test("descricao preserva a secao visual",()=>{
  ["ProblemaTecnico","Descrição informada","Reported description","Descripción informada","problema.descricao","contentBoxStyle","detailLabelStyle","fullDescriptionStyle"].forEach((item)=>assert.ok(source.includes(item)));
  assert.doesNotMatch(source,/supabase|useState|useEffect|router|localStorage|formatarData|select|textarea|atualizarChamado|setObservacoes/);
});
test("pagina mantem a orquestracao expandida",()=>{
  ["AdminProblemasTecnicosTicketDescription","{aberto && (","AdminProblemasTecnicosTicketInfoGrid","controlsGridStyle","atualizarChamado"].forEach((item)=>assert.ok(page.includes(item)));
});
