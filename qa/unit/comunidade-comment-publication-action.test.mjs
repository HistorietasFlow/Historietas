import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const acao = readFileSync(
  new URL(
    "../../app/comunidade/components/community-comment-publication-action.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/comunidade/page.tsx", import.meta.url), "utf8");

test("comentarPostComunidade preserva lock, guardas e insercao do comentario", () => {
  assert.match(acao, /export async function comentarPostComunidade\(/);
  assert.match(acao, /const chaveAcao = `comentar-post:\$\{postId\}`;/);
  assert.match(acao, /iniciarAcaoComunidade\(acoesComunidadeRef, chaveAcao\)/);
  assert.match(acao, /setErro\(""\);/);
  assert.match(acao, /if \(!exigirLogin\(\) \|\| !usuario\) \{[\s\S]*?return false;/);
  assert.match(acao, /const textoComentario = textoRecebido\.trim\(\);/);
  assert.match(acao, /textoComentario\.length < 1[\s\S]*?Escreva um comentário antes de enviar\./);
  assert.match(acao, /await obterNomeSeguroUsuarioComunidade\(usuario\)/);
  assert.match(acao, /prepararInsercaoComentarioComunidade\(\{[\s\S]*?posts,[\s\S]*?postId,[\s\S]*?textoComentario,[\s\S]*?comentarioPaiId,[\s\S]*?usuarioId: usuario\.id,[\s\S]*?autorNomeSeguro/);
  assert.match(acao, /if \(!resultadoPreparacaoComentario\.valido\) \{[\s\S]*?setErro\(resultadoPreparacaoComentario\.erro\);/);
  assert.match(acao, /await inserirComentarioSupabaseComunidade\(dadosComentarioBanco\)/);
  assert.match(acao, /if \(!resultadoInsercaoComentario\.sucesso\) \{[\s\S]*?formatarErroSupabase\([\s\S]*?"Erro ao comentar"/);
  assert.match(acao, /if \(!data\) \{[\s\S]*?Supabase não retornou o comentário criado\./);
  assert.match(acao, /mapearComentarioCriadoComunidade\(\{[\s\S]*?comentarioCriado: data as SupabaseComentarioRow,[\s\S]*?usuarioAvatar: usuario\.avatar/);
});

test("comentarPostComunidade preserva notificacao raiz, estado, feedback, retorno e cleanup", () => {
  assert.match(acao, /if \(!comentarioPaiIdLimpo && postAtual\?\.autorId\) \{[\s\S]*?tipo: "comunidade-comentario-post",[\s\S]*?link: `\/comunidade\?post=\$\{encodeURIComponent\(postId\)\}`,[\s\S]*?notificacaoId: `comunidade-comentario-post:\$\{postId\}:\$\{novoComentario\.id\}`/);
  assert.match(acao, /adicionarComentarioPostComunidade\(postsAtuais, postId, novoComentario\)/);
  assert.match(acao, /emitirFeedbackAcao\(setFeedbackAcao, feedbackTimerRef, "Comentário enviado\."\);/);
  assert.match(acao, /emitirFeedbackAcao[\s\S]*?return true;/);
  assert.match(acao, /finally \{[\s\S]*?finalizarAcaoComunidade\(acoesComunidadeRef, chaveAcao\);/);
});

test("Comunidade delega somente comentarPost e preserva as outras acoes de comentario na pagina", () => {
  assert.match(pagina, /import \{ comentarPostComunidade \} from "\.\/components\/community-comment-publication-action";/);
  assert.match(pagina, /const comentarPost = \([\s\S]*?\) =>[\s\S]*?comentarPostComunidade\(\{[\s\S]*?acoesComunidadeRef,[\s\S]*?feedbackTimerRef,[\s\S]*?\}\);/);
  assert.doesNotMatch(pagina, /async function comentarPost\(/);
  assert.doesNotMatch(pagina, /await inserirComentarioSupabaseComunidade\(/);
  assert.match(pagina, /removerComentarioComunidade\(\{/);
  assert.doesNotMatch(pagina, /async function removerComentario\(/);
  assert.match(pagina, /alternarCurtidaComentarioComunidade\(\{/);
  assert.doesNotMatch(pagina, /async function alternarCurtidaComentario\(/);
  assert.match(pagina, /function abrirComentariosPostComunidade\(/);
  assert.match(pagina, /onFechar=\{\(\) => fecharComentarios\(\{ setComentariosPostId \}\)\}/);
});
