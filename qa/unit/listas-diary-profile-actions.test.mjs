import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync("app/listas/page.tsx", "utf8");
const hook = readFileSync("app/listas/hooks/use-listas-diary-profile-actions.ts", "utf8");
const persistencia = readFileSync("app/listas/lib/listas-diary-rating-persistence.ts", "utf8");

test("Listas delega avaliação e denúncia do Diário", () => {
  assert.match(pagina, /useListasDiaryProfileActions\(\{/);
  assert.doesNotMatch(pagina, /function abrirDenunciaDiario\(/);
  assert.doesNotMatch(pagina, /function salvarAvaliacaoDiarioPerfil\(/);
  assert.match(hook, /novaNota <= 0 \? 0/);
  assert.match(hook, /Math\.max\(0\.5, Math\.min\(5, Math\.round\(novaNota \* 2\) \/ 2\)\)/);
  assert.match(hook, /tipo === "comentario_diario"\) fecharComentariosDiario\(\)/);
  assert.match(hook, /"Conteúdo do Diário"/);
  assert.match(hook, /"Você não pode denunciar seu próprio conteúdo\."/);
});

test("persistência preserva os RPCs e payloads", () => {
  assert.match(persistencia, /"salvar_avaliacao_diario"/);
  assert.match(persistencia, /"remover_avaliacao_diario"/);
  assert.match(persistencia, /p_diario_user_id: perfilUserId, p_nota: nota/);
  assert.match(persistencia, /supabase\.rpc\(nomeRpc, parametros\)/);
  assert.doesNotMatch(persistencia, /\.from\(|\.insert\(|\.update\(|\.delete\(/);
});
