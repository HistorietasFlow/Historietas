import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const acao = readFileSync(
  new URL(
    "../../app/comunidade/components/community-comment-removal-action.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("removerComentarioComunidade preserva lock, identidade e preparacao", () => {
  assert.match(acao, /export async function removerComentarioComunidade\(/);
  assert.match(acao, /const chaveAcao = `remover-comentario:\$\{comentarioId\}`;/);
  assert.match(acao, /iniciarAcaoComunidade\(acoesComunidadeRef, chaveAcao\)/);
  assert.match(acao, /setErro\(""\);/);
  assert.match(acao, /if \(!exigirLogin\(\) \|\| !usuario\) \{/);
  assert.match(acao, /await obterUsuarioAutenticadoComunidadeAtual\(\)/);
  assert.match(acao, /const usuarioAutenticadoId = usuarioAutenticado\?\.id\?\.trim\(\) \|\| "";[\s\S]*?const usuarioEstadoId = usuario\.id\.trim\(\);/);
  assert.match(acao, /!usuarioAutenticadoId \|\|[\s\S]*?usuarioAutenticadoId !== usuarioEstadoId/);
  assert.match(acao, /setUsuario\(null\);[\s\S]*?setUsuarioEhAdmin\(false\);[\s\S]*?setPostMenuAbertoId\(null\);/);
  assert.match(acao, /prepararRemocaoComentarioComunidade\([\s\S]*?posts,[\s\S]*?postId,[\s\S]*?comentarioId,[\s\S]*?usuarioAutenticadoId/);
  assert.match(acao, /if \(!resultadoPreparacaoRemocaoComentario\.valido\) \{[\s\S]*?setErro\(resultadoPreparacaoRemocaoComentario\.erro\);/);
});

test("removerComentarioComunidade preserva consulta, autoria, confirmacao e remocao", () => {
  assert.match(acao, /await consultarComentarioParaRemocaoComunidade\(comentarioId\)/);
  assert.match(acao, /if \(!resultadoConsultaComentario\.sucesso\) \{[\s\S]*?formatarErroSupabase\([\s\S]*?"Erro ao conferir comentário"/);
  assert.match(acao, /if \(!comentarioBanco\) \{[\s\S]*?removerComentarioPostComunidade\(postsAtuais, postId, comentarioId\)[\s\S]*?Este comentário já não existe\./);
  assert.match(acao, /if \(comentarioBanco\.autor_id !== usuarioAutenticadoId\) \{[\s\S]*?Você só pode remover seus próprios comentários\./);
  assert.match(acao, /window\.confirm\([\s\S]*?traduzirTextoComunidade\("Remover este comentário\?", language\)/);
  assert.match(acao, /obterIdsComentarioComRespostasComunidade\([\s\S]*?comentariosDoPost,[\s\S]*?comentarioId/);
  assert.match(acao, /await removerComentarioSupabaseComunidade\([\s\S]*?comentarioId,[\s\S]*?usuarioAutenticadoId/);
  assert.match(acao, /if \(!resultadoRemocaoComentario\.sucesso\) \{[\s\S]*?"Erro ao remover comentário"/);
});

test("removerComentarioComunidade preserva permissão, reload, estado, feedback e cleanup", () => {
  assert.match(acao, /!Array\.isArray\(comentariosRemovidos\) \|\| comentariosRemovidos\.length === 0/);
  assert.match(acao, /O comentário não foi removido\. A conta atual não possui permissão para essa ação\.[\s\S]*?await carregarPostsComunidadeDaPagina\(false, 0, obraRelacionadaFiltro\);/);
  assert.match(acao, /removerComentariosPostComunidade\(postsAtuais, postId, idsParaRemover\)/);
  assert.match(acao, /emitirFeedbackAcao\(setFeedbackAcao, feedbackTimerRef, "Comentário removido\."\);/);
  assert.match(acao, /finally \{[\s\S]*?finalizarAcaoComunidade\(acoesComunidadeRef, chaveAcao\);/);
});

test("Comunidade delega somente removerComentario e preserva as demais acoes", () => {
  assert.match(
    pagina,
    /import \{ removerComentarioComunidade \} from "\.\/components\/community-comment-removal-action";/,
  );
  assert.match(
    pagina,
    /const removerComentario = \(postId: string, comentarioId: string\) =>[\s\S]*?removerComentarioComunidade\(\{[\s\S]*?setUsuarioEhAdmin,[\s\S]*?obraRelacionadaFiltro,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /async function removerComentario\(/);
  assert.doesNotMatch(pagina, /await removerComentarioSupabaseComunidade\(/);
  assert.match(pagina, /function denunciarConteudo\(/);
  assert.match(pagina, /function abrirComentariosPostComunidade\(/);
  assert.match(pagina, /atualizarVisibilidadePostComunidade\(\{/);
  assert.doesNotMatch(pagina, /async function atualizarVisibilidadePost\(/);
});
