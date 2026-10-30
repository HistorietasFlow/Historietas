import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/listas/page.tsx", "utf8");
const comentario = await readFile(
  "app/listas/components/listas-diary-comment.tsx",
  "utf8",
);
const thread = await readFile(
  "app/listas/components/listas-diary-comment-thread.tsx",
  "utf8",
);
const sheet = await readFile(
  "app/listas/components/listas-diary-comments-sheet.tsx",
  "utf8",
);
const painel = await readFile(
  "app/listas/components/listas-diary-comments-panel.tsx",
  "utf8",
);
const controles = await readFile(
  "app/listas/hooks/use-listas-diary-comments-controls.ts",
  "utf8",
);
const diaryCommentsRenderer = await readFile(
  "app/listas/hooks/use-listas-diary-comments-renderer.tsx",
  "utf8",
);

test("Listas delega a apresentação do sheet de comentários do Diário", () => {
  assert.match(pagina, /import \{ useListasDiaryCommentsRenderer \} from "\.\/hooks\/use-listas-diary-comments-renderer"/);
  assert.match(pagina, /\} =\s*useListasDiaryCommentsRenderer\(\{/);
  assert.match(diaryCommentsRenderer, /<ListasDiaryCommentsPanel\b/);
  assert.match(painel, /<ListasDiaryCommentsSheet\b/);

  assert.doesNotMatch(pagina, /createPortal\(/);
  assert.doesNotMatch(pagina, /<article\s+key=\{comentario\.id\}/);
});

test("página mantém domínio, cálculos, estados, refs e mutações dos comentários", () => {
  for (const contrato of [
    "comentariosDiarioItem",
    "interacoesAnotacoes",
    "obterPermissoesAnotacaoListas",
    "respostasVisiveisComentariosDiario",
    "DIARIO_COMENTARIO_MAX_LENGTH",
    "iniciarRespostaComentarioAnotacaoListas",
    "removerComentarioAnotacaoListas",
    "abrirDenunciaDiario",
    "alternarCurtidaComentarioAnotacaoListas",
    "alterarOrdenacaoComentariosAnotacaoListas",
    "atualizarComentarioAnotacaoListas",
    "enviarComentarioAnotacaoListas",
  ]) {
    assert.match(pagina, new RegExp(`\\b${contrato}\\b`));
  }

  assert.match(painel, /respostas\.length, \(atuais\[comentario\.id\] \|\| 0\) \+ 5/);
  assert.match(controles, /"Os comentários desta anotação não estão disponíveis\."/);
  assert.match(controles, /translate3d\(0, \$\{deslocamento\}px, 0\)/);
  assert.match(controles, /\}, 350\)/);
  assert.doesNotMatch(painel, /supabase/);
  assert.doesNotMatch(controles, /supabase/);
});

test("comentário preserva perfil, ações, denúncia, curtida e contador", () => {
  assert.match(comentario, /export function ListasDiaryComment/);
  assert.match(comentario, /Abrir perfil de \$\{comentario\.autorNome\}/);
  assert.match(comentario, /data-historietas-user-content="true"/);
  assert.match(comentario, /Responder/);
  assert.match(comentario, /Removendo\.\.\./);
  assert.match(comentario, /Denunciar/);
  assert.match(comentario, /aria-pressed=\{comentarioCurtiu\}/);
  assert.match(comentario, /Remover curtida do comentário/);
  assert.match(comentario, /Curtir comentário/);
  assert.match(comentario, /comentario\.curtidas\.length/);
  assert.doesNotMatch(comentario, /supabase/);
});

test("thread preserva respostas em blocos, expansão e recolhimento", () => {
  assert.match(thread, /export function ListasDiaryCommentThread/);
  assert.match(thread, /Ver \$\{quantidadeRespostas\}/);
  assert.match(thread, /Ver mais \$\{quantidadeRespostasOcultas\}/);
  assert.match(thread, /Ocultar respostas/);
  assert.match(thread, /onExpandReplies/);
  assert.match(thread, /onShowMoreReplies/);
  assert.match(thread, /onCollapseReplies/);
  assert.doesNotMatch(thread, /supabase/);
});

test("sheet preserva portal, diálogo, handle, ordenação, estados e composer", () => {
  assert.match(sheet, /export function ListasDiaryCommentsSheet/);
  assert.match(sheet, /createPortal\(/);
  assert.match(sheet, /document\.body/);
  assert.match(sheet, /role="dialog"/);
  assert.match(sheet, /aria-modal="true"/);
  assert.match(sheet, /data-comments-sheet-handle="true"/);
  assert.match(sheet, /onTouchStart=\{onHandleTouchStart\}/);
  assert.match(sheet, /onKeyDown=\{onHandleKeyDown\}/);
  assert.match(sheet, /Recolher comentários/);
  assert.match(sheet, /Expandir comentários/);
  assert.match(sheet, /Relevantes/);
  assert.match(sheet, /Recentes/);
  assert.match(sheet, /Carregando comentários\.\.\./);
  assert.match(sheet, /Sem comentários ainda/);
  assert.match(sheet, /Respondendo a/);
  assert.match(sheet, /Adicionar menção/);
  assert.match(sheet, /Enviar comentário/);
  assert.match(sheet, /maxLength=\{maxLength\}/);
  assert.match(sheet, /quickReactions\.map/);
  assert.doesNotMatch(sheet, /supabase/);
});
