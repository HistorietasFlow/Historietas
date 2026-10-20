import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const helpers = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-profile-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url), "utf8");

test("helpers de perfil preservam aliases, limites e fallback", () => {
  for (const contrato of [
    "export type PerfilNotificacao",
    "export function normalizarPerfilNotificacao",
    "row.user_id",
    "row.id",
    "row.nome_usuario",
    "row.username",
    "row.display_name",
    "row.apelido",
    "row.avatar_url",
    "row.photo_url",
    "nome: nome.slice(0, 80)",
    "export function obterPerfilNotificacao",
    'nome: nomeFallback.trim() || "Usuário"',
  ]) {
    assert.ok(helpers.includes(contrato), "contrato ausente: " + contrato);
  }

  assert.match(pagina, /from "\.\/lib\/notificacoes-profile-utils"/);
  assert.doesNotMatch(pagina, /type PerfilNotificacao =/);
  assert.doesNotMatch(pagina, /function normalizarPerfilNotificacao/);
  assert.doesNotMatch(pagina, /function obterPerfilNotificacao/);
  assert.doesNotMatch(helpers, /React|use[A-Z]|supabase|localStorage/);
});
