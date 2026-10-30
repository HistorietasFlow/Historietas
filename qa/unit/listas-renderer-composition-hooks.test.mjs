import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/listas/page.tsx", "utf8");
const profileItemRenderer = readFileSync(
  "app/listas/hooks/use-listas-profile-item-renderer.tsx",
  "utf8",
);
const diaryCommentsRenderer = readFileSync(
  "app/listas/hooks/use-listas-diary-comments-renderer.tsx",
  "utf8",
);

test("Listas delega a composição do item de perfil sem mover seus estados e ações", () => {
  assert.match(page, /useListasProfileItemRenderer\(\{/);
  assert.doesNotMatch(page, /function renderizarItemObra\(/);
  assert.match(profileItemRenderer, /ItemObraLista/);
  assert.match(profileItemRenderer, /CategoriaPerfil/);
  assert.match(profileItemRenderer, /const obra = item\.obra;/);
  assert.match(profileItemRenderer, /const detalheVisivel =/);
  assert.match(profileItemRenderer, /<ListasRatingDetail/);
  assert.match(profileItemRenderer, /formatarLeituraMesAno/);
  assert.match(profileItemRenderer, /textoSecundarioItem/);
  assert.match(profileItemRenderer, /criarInteracaoAnotacaoListasVazia/);
  assert.match(profileItemRenderer, /obterPermissoesAnotacaoListas/);
  assert.match(profileItemRenderer, /historietas-list-row-highlight/);
  assert.match(profileItemRenderer, /criarCapaStyle/);
  assert.match(profileItemRenderer, /setAnotacoesAbertas/);
  assert.match(profileItemRenderer, /setAnotacoesSpoilerReveladas/);
  assert.match(profileItemRenderer, /showRating=\{item\.nota > 0/);
  assert.match(profileItemRenderer, /<ListasProfileWorkRenderer/);
  assert.doesNotMatch(profileItemRenderer, /supabase|useState|useCallback/);
});

test("Listas delega somente a composição do sheet de comentários do Diário", () => {
  assert.match(page, /useListasDiaryCommentsRenderer\(\{/);
  assert.doesNotMatch(page, /function renderizarComentariosDiarioSheet\(/);
  assert.match(diaryCommentsRenderer, /if \(!item\) \{\s*return null;/);
  assert.match(diaryCommentsRenderer, /obterPermissoesAnotacaoListas/);
  assert.match(diaryCommentsRenderer, /DIARIO_COMENTARIO_MAX_LENGTH/);
  assert.match(diaryCommentsRenderer, /<ListasDiaryCommentsPanel/);
  assert.match(diaryCommentsRenderer, /comentarioCurtindoId/);
  assert.match(diaryCommentsRenderer, /comentarioRemovendoId/);
  assert.match(diaryCommentsRenderer, /event\.preventDefault\(\)/);
  assert.match(diaryCommentsRenderer, /onHandleTouchStart/);
  assert.match(diaryCommentsRenderer, /onHandleTouchMove/);
  assert.match(diaryCommentsRenderer, /onHandleTouchEnd/);
  assert.match(diaryCommentsRenderer, /onHandleTouchCancel/);
  assert.match(diaryCommentsRenderer, /setMenuOrdenacaoComentariosDiarioAberto/);
  assert.match(diaryCommentsRenderer, /respostasVisiveisComentariosDiario/);
  assert.doesNotMatch(diaryCommentsRenderer, /supabase|useState|useCallback/);
});
