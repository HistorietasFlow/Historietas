import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import "./notificacoes-supabase-sync.test.mjs";
import "./notificacoes-supabase-state-loader.test.mjs";
import "./notificacoes-supabase-work-loader.test.mjs";
import "./notificacoes-supabase-support-loaders.test.mjs";
import "./notificacoes-supabase-direct-loader.test.mjs";
import "./notificacoes-supabase-diary-loader.test.mjs";
import "./notificacoes-supabase-community-loader.test.mjs";
import "./use-notificacoes-initial-load.test.mjs";
import "./notificacoes-filter-options.test.mjs";
import "./notificacoes-view-state-utils.test.mjs";
import "./notificacoes-local-actions-utils.test.mjs";
import "./notificacoes-follow-request-utils.test.mjs";
import "./notificacoes-mutation-actions.test.mjs";

const helpers = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-local-state-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url), "utf8");

test("estado local de notificações preserva isolamento, fallbacks e evento", () => {
  for (const contrato of [
    "export function carregarObras",
    'typeof window === "undefined" || !userIdLimpo',
    "JSON.parse(dados)",
    "normalizarObra(obra, index)",
    "export function carregarNotificacoes",
    "mesclarNotificacoes(",
    "normalizarNotificacao(notificacao, index)",
    "export function salvarNotificacoes",
    'new Event("historietas:notificacoes-atualizadas")',
    "export function carregarIdsNotificacoesApagadas",
    "export function registrarNotificacoesApagadas",
    "Array.from(idsAtuais).slice(-500)",
    "export function filtrarNotificacoesApagadas",
    "export function prepararNotificacaoTexto",
  ]) {
    assert.ok(helpers.includes(contrato), "contrato ausente: " + contrato);
  }

  assert.match(pagina, /from "\.\/lib\/notificacoes-local-state-utils"/);
  for (const helper of [
    "carregarObras",
    "carregarNotificacoes",
    "salvarNotificacoes",
    "carregarIdsNotificacoesApagadas",
    "registrarNotificacoesApagadas",
    "filtrarNotificacoesApagadas",
    "prepararNotificacaoTexto",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
  }
  assert.doesNotMatch(helpers, /React|use[A-Z]|supabase/);
});
