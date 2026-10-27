import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/admin/exclusoes-conta/page.tsx", "utf8");
const component = readFileSync("app/admin/exclusoes-conta/components/admin-exclusoes-conta-request-card.tsx", "utf8");

test("card de solicitações preserva a apresentação e os controles", () => {
  assert.match(component, /SolicitacaoExclusao/);
  ["STATUS_SOLICITACOES", "STATUS_LABEL", "corStatus", "origemTraduzida", "formatarData"].forEach((item) => assert.ok(component.includes(item), item));
  assert.ok(component.includes("▲"));
  assert.ok(component.includes("▼"));
  assert.ok(component.includes("Nenhum motivo informado."));
  assert.match(component, /solicitacao\.processadaEm &&/);
  assert.match(component, /solicitacao\.userAgent &&/);
  assert.match(component, /statusAtual === "concluida" && solicitacao\.status !== "concluida"/);
  assert.match(component, /maxLength=\{4000\}/);
  assert.match(component, /observacaoAtual\.length\}\/4000/);
  assert.ok(component.includes("Alterações não salvas"));
  assert.match(component, /disabled=\{salvando \|\| !alterado\}/);
  assert.doesNotMatch(component, /fetch\(|useState|useEffect|supabase|router|localStorage/);
});

test("página mantém o map e a orquestração do card", () => {
  assert.match(page, /AdminExclusoesContaRequestCard/);
  assert.match(page, /solicitacoesFiltradas\.map/);
  ["const aberta", "const salvando", "const statusAtual", "const observacaoAtual", "const alterado", "setAbertaId", "setStatusRascunho", "setObservacoes", "salvarSolicitacao"].forEach((item) => assert.ok(page.includes(item), item));
  assert.doesNotMatch(page, /<article key=\{solicitacao\.id\} style=\{cardStyle\}>/);
});
