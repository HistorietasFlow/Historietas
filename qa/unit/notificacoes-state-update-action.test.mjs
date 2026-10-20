import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const action = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-state-update-action.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);

test("atualizador de Notificações preserva normalização, contagem e persistência", () => {
  for (const contrato of [
    "export function criarAtualizadorNotificacoes",
    "return function atualizarNotificacoes(novasNotificacoes: NotificacaoLocal[])",
    "mesclarNotificacoes(\n      [],\n      novasNotificacoes",
    "prepararNotificacaoTexto(notificacao)",
    "setNotificacoes(notificacoesNormalizadas)",
    "notificacoesNormalizadas.filter((notificacao) => !notificacao.lida).length",
    "salvarNotificacoes(notificacoesNormalizadas, usuarioNotificacoesId)",
  ]) {
    assert.ok(action.includes(contrato), "contrato ausente: " + contrato);
  }

  assert.match(pagina, /from "\.\/lib\/notificacoes-state-update-action"/);
  assert.match(pagina, /const atualizarNotificacoes = criarAtualizadorNotificacoes\(/);
  assert.doesNotMatch(pagina, /function atualizarNotificacoes\(/);
  assert.doesNotMatch(action, /supabase|React|use[A-Z]|JSX/);
});
