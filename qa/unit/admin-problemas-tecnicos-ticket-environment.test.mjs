import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const page=readFileSync("app/admin/problemas-tecnicos/page.tsx","utf8");
const source=readFileSync("app/admin/problemas-tecnicos/components/admin-problemas-tecnicos-ticket-environment.tsx","utf8");
test("ambiente preserva contrato visual",()=>{
  ["ProblemaTecnico","paginaUrl","navegador","dispositivo","return null","startsWith(\"/\")","Link","href={problema.paginaUrl}","Página","Dispositivo","Navegador","environmentStyle","environmentRowStyle","environmentValueStyle","environmentValueLinkStyle"].forEach((item)=>assert.ok(source.includes(item)));
  assert.doesNotMatch(source,/supabase|useState|useEffect|router|localStorage|select|textarea|atualizarChamado|setObservacoes/);
});
test("pagina mantem controles",()=>["AdminProblemasTecnicosTicketEnvironment","{aberto && (","controlsGridStyle","atualizarChamado"].forEach((item)=>assert.ok(page.includes(item))));
