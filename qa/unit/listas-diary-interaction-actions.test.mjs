import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(new URL("../../app/listas/page.tsx", import.meta.url), "utf8");
const hook = readFileSync(new URL("../../app/listas/hooks/use-listas-diary-interaction-actions.ts", import.meta.url), "utf8");
const persistencia = readFileSync(new URL("../../app/listas/lib/listas-diary-interaction-persistence.ts", import.meta.url), "utf8");

test("Listas delega as ações de interação do Diário sem reintroduzir mutações na página", () => {
  assert.match(pagina, /import \{ useListasDiaryInteractionActions \} from "\.\/hooks\/use-listas-diary-interaction-actions";/);
  assert.match(pagina, /useListasDiaryInteractionActions\(\{/);
  for (const nome of ["atualizarInteracaoAnotacaoListas", "alternarCurtidaAnotacaoListas", "atualizarComentarioAnotacaoListas", "iniciarRespostaComentarioAnotacaoListas", "cancelarRespostaComentarioAnotacaoListas", "alterarOrdenacaoComentariosAnotacaoListas", "alternarCurtidaComentarioAnotacaoListas", "enviarComentarioAnotacaoListas", "removerComentarioAnotacaoListas"]) {
    assert.match(hook, new RegExp(`function ${nome}\\(`));
    assert.doesNotMatch(pagina, new RegExp(`function ${nome}\\(`));
  }
  for (const tabela of ["diario_anotacao_curtidas", "diario_comentario_curtidas", "diario_anotacao_comentarios"]) assert.doesNotMatch(pagina, new RegExp(`\\.from\\("${tabela}"\\)`));
});

test("persistência preserva os contratos de curtidas e comentários", () => {
  assert.match(persistencia, /\.from\("diario_anotacao_curtidas"\)[\s\S]*?\.delete\(\)[\s\S]*?\.eq\("anotacao_id", anotacaoId\)[\s\S]*?\.eq\("user_id", userId\)/);
  assert.match(persistencia, /\.from\("diario_anotacao_curtidas"\)[\s\S]*?\.insert\(\{ anotacao_id: anotacaoId, user_id: userId \}\)/);
  assert.match(persistencia, /\.from\("diario_comentario_curtidas"\)[\s\S]*?\.delete\(\)[\s\S]*?\.eq\("comentario_id", comentarioId\)[\s\S]*?\.eq\("user_id", userId\)/);
  assert.match(persistencia, /\.from\("diario_comentario_curtidas"\)[\s\S]*?\.insert\(\{ comentario_id: comentarioId, user_id: userId \}\)/);
  assert.match(persistencia, /\.from\("diario_anotacao_comentarios"\)[\s\S]*?\.insert\(\{[\s\S]*?parent_id: parentId \|\| null,[\s\S]*?\}\)[\s\S]*?\.select\("id,anotacao_id,user_id,texto,parent_id,criado_em,atualizado_em"\)[\s\S]*?\.maybeSingle\(\)/);
  assert.match(persistencia, /\.from\("diario_anotacao_comentarios"\)[\s\S]*?\.delete\(\)[\s\S]*?\.eq\("id", comentarioId\)[\s\S]*?\.eq\("user_id", usuarioAtualId\)/);
  assert.doesNotMatch(persistencia, /\.upsert\(|\.rpc\(/);
});

test("hook preserva permissões, limites, atualizações locais e resets", () => {
  for (const texto of ["As curtidas estão desativadas nesta anotação.", "Você não tem permissão para comentar nesta anotação.", "Escreva um comentário antes de enviar.", "Não foi possível atualizar a curtida.", "Não foi possível enviar o comentário.", "Remover este comentário?"]) assert.match(hook, new RegExp(texto));
  assert.match(hook, /item\.anotacaoId\?\.trim\(\) \|\| ""/);
  assert.match(hook, /usuarioAtualId\.trim\(\)/);
  assert.match(hook, /texto\.slice\(0, diarioComentarioMaxLength\)/);
  assert.match(hook, /Math\.max\(\s*5,/);
  assert.match(hook, /Array\.from\(new Set\(\[\.\.\.itemComentario\.curtidas, userId\]\)\)/);
  assert.match(hook, /itemComentario\.parentId !== comentario\.id/);
  assert.match(hook, /setComentarioCurtindoId\(""\)/);
  assert.match(hook, /setComentarioRemovendoId\(""\)/);
  assert.doesNotMatch(hook, /supabase\.from\(|\.rpc\(|\.upsert\(/);
});
