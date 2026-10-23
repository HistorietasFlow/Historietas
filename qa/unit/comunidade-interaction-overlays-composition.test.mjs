import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const composicao = readFileSync(new URL("../../app/comunidade/components/community-interaction-overlays-composition.tsx", import.meta.url), "utf8");
const pagina = readFileSync(new URL("../../app/comunidade/page.tsx", import.meta.url), "utf8");

test("a composição de overlays preserva comentários, denúncia e feedback", () => {
  assert.match(composicao, /import DenunciaModal from "\.\.\/\.\.\/\.\.\/components\/DenunciaModal"/);
  assert.match(composicao, /import \{ ComentariosSheet \} from "\.\/community-comments-sheet"/);
  assert.match(composicao, /import \{ CommunityActionFeedbackToast \} from "\.\/community-action-feedback-toast"/);
  assert.match(composicao, /key=\{comentariosSheetProps\.post\?\.id \|\| "comentarios-fechados"\}/);
  assert.match(composicao, /<ComentariosSheet[\s\S]*?\{\.\.\.comentariosSheetProps\}/);
  assert.match(composicao, /<DenunciaModal \{\.\.\.denunciaModalProps\} \/>/);
  assert.match(composicao, /\{feedbackAcao && \([\s\S]*?<CommunityActionFeedbackToast>/);
  assert.doesNotMatch(composicao, /supabase\./);
  assert.doesNotMatch(composicao, /use[A-Z]\w*\(/);
});

test("a página mantém callbacks e decisões dos overlays", () => {
  assert.match(pagina, /import \{ CommunityInteractionOverlaysComposition \} from "\.\/components\/community-interaction-overlays-composition"/);
  assert.match(pagina, /<CommunityInteractionOverlaysComposition[\s\S]*?comentariosSheetProps=\{\{/);
  assert.match(pagina, /post: postComentariosAberto,/);
  assert.match(pagina, /onFechar: \(\) => fecharComentarios\(\{ setComentariosPostId \}\)/);
  assert.match(pagina, /onEnviar: comentarPost,/);
  assert.match(pagina, /onCurtirComentario: alternarCurtidaComentario,/);
  assert.match(pagina, /onRemoverComentario: removerComentario,/);
  assert.match(pagina, /denunciarConteudo\("comentario", comentarioId\)/);
  assert.match(pagina, /denunciaModalProps=\{\{[\s\S]*?onFechar: \(\) => setDenunciaAlvo\(null\)/);
  assert.match(pagina, /emitirFeedbackAcao\([\s\S]*?"Denúncia enviada para análise\.",/);
  assert.match(pagina, /feedbackAcao=\{feedbackAcao\}/);
  assert.doesNotMatch(pagina, /<ComentariosSheet\s/);
  assert.doesNotMatch(pagina, /<DenunciaModal\s/);
  assert.doesNotMatch(pagina, /<CommunityActionFeedbackToast\s/);
});
