import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/admin/problemas-tecnicos/page.tsx", "utf8");
const source = readFileSync("app/admin/problemas-tecnicos/components/admin-problemas-tecnicos-ticket-summary.tsx", "utf8");

test("resumo visual preserva o contrato do card", () => {
  ["admin-tech-card-summary", "aria-expanded={aberto}", "corStatus", "corPrioridade", "STATUS_LABEL", "PRIORIDADE_LABEL", "CATEGORIA_LABEL", "problema.titulo", "problema.descricao", "nomeUsuario", "formatarData(problema.criadoEm)", "▲", "▼"].forEach((item) => assert.ok(source.includes(item)));
  assert.doesNotMatch(source, /supabase|useState|useEffect|router|localStorage|atualizarChamado|setObservacoes/);
});

test("pagina preserva a orquestracao do card", () => {
  assert.match(page, /AdminProblemasTecnicosTicketSummary/);
  assert.match(page, /problemasFiltrados\.map/);
  assert.match(page, /<article key=\{problema\.id\}/);
  assert.match(page, /const aberto = chamadoAbertoId === problema\.id/);
  assert.match(page, /const salvando = acaoEmAndamento === problema\.id/);
  assert.match(page, /const nomeUsuario/);
  assert.match(page, /\{aberto && \(/);
  assert.match(page, /alternarChamadoAberto\(problema\.id\)/);
  assert.match(page, /setObservacoes/);
  assert.match(page, /atualizarChamado/);
});
