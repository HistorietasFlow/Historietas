import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const component = ler(
  "../../app/admin/problemas-tecnicos/components/admin-problemas-tecnicos-ticket-card.tsx",
);
const page = ler("../../app/admin/problemas-tecnicos/page.tsx");

test("card preserva a composição completa, estados e callbacks do chamado", () => {
  [
    "const aberto = chamadoAbertoId === problema.id",
    "const salvando = acaoEmAndamento === problema.id",
    "nomesUsuarios[problema.userId]",
    'pt: "Usuário"',
    "AdminProblemasTecnicosTicketSummary",
    "AdminProblemasTecnicosTicketInfoGrid",
    "AdminProblemasTecnicosTicketDescription",
    "AdminProblemasTecnicosTicketEnvironment",
    "AdminProblemasTecnicosTicketStatusControl",
    "AdminProblemasTecnicosTicketPriorityControl",
    "AdminProblemasTecnicosTicketLastReview",
    "alternarChamadoAberto(problema.id)",
    "atualizarChamado(",
    'pt: "Status do chamado atualizado."',
    'pt: "Prioridade do chamado atualizada."',
    'pt: "Observação interna salva."',
    "observacoes[problema.id] || \"\"",
    "setObservacoes((atuais) => ({",
    "maxLength={3000}",
    "/3000",
    "disabled={salvando}",
    'pt: "Salvando..."',
  ].forEach((contract) => assert.ok(component.includes(contract), contract));
  assert.doesNotMatch(component, /supabase|useState|useEffect|router|localStorage/);
});

test("página delega somente cada item filtrado ao card", () => {
  assert.match(
    page,
    /import \{ AdminProblemasTecnicosTicketCard \} from "\.\/components\/admin-problemas-tecnicos-ticket-card";/,
  );
  assert.match(page, /problemasFiltrados\.map\(\(problema\) => \(/);
  assert.match(page, /<AdminProblemasTecnicosTicketCard[\s\S]*?key=\{problema\.id\}/);
  assert.match(page, /chamadoAbertoId=\{chamadoAbertoId\}/);
  assert.match(page, /acaoEmAndamento=\{acaoEmAndamento\}/);
  assert.match(page, /setObservacoes=\{setObservacoes\}/);
  assert.match(page, /atualizarChamado=\{atualizarChamado\}/);
  assert.doesNotMatch(page, /const aberto = chamadoAbertoId === problema\.id/);
  assert.doesNotMatch(page, /const salvando = acaoEmAndamento === problema\.id/);
  assert.doesNotMatch(page, /<AdminProblemasTecnicosTicketSummary/);
  assert.doesNotMatch(page, /maxLength=\{3000\}/);
});
