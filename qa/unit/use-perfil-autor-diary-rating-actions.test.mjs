import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../../app/perfil-autor/hooks/use-perfil-autor-diary-rating-actions.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);

test("Perfil de Autor delega a avaliação do Diário para o hook", () => {
  assert.match(pagina, /usePerfilAutorDiaryRatingActions/);
  assert.doesNotMatch(pagina, /async function avaliarDiarioPerfil\(/);
  assert.match(source, /async function avaliarDiarioPerfil\(nota: number\)/);
});

test("preserva identidade, RPCs e rollback do Diário", () => {
  assert.match(source, /supabase\.auth\.getUser\(\)/);
  assert.match(source, /execucaoCarregamentoPerfilAutorEstaAtual\(/);
  assert.match(source, /"salvar_avaliacao_diario"/);
  assert.match(source, /"remover_avaliacao_diario"/);
  assert.match(source, /supabase\.rpc\(nomeRpc, parametros\)/);
  assert.match(source, /normalizarAvaliacaoDiarioPerfil\(/);
  assert.match(source, /avaliacaoAnterior = avaliacaoDiario/);
});
