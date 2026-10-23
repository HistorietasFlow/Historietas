import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const acao = readFileSync(
  new URL(
    "../../app/comunidade/components/community-comment-like-action.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("alternarCurtidaComentarioComunidade preserva lock, guarda e sincronizacao", () => {
  assert.match(acao, /export async function alternarCurtidaComentarioComunidade\(/);
  assert.match(acao, /const chaveAcao = `curtir-comentario:\$\{comentarioId\}`;/);
  assert.match(acao, /iniciarAcaoComunidade\(acoesComunidadeRef, chaveAcao\)/);
  assert.match(acao, /setErro\(""\);/);
  assert.match(acao, /if \(!exigirLogin\(\) \|\| !usuario\) \{/);
  assert.match(acao, /posts\.find\(\(post\) => post\.id === postId\)/);
  assert.match(acao, /comentarios\.find\([\s\S]*?comentario\.id === comentarioId/);
  assert.match(acao, /const jaCurtiu = Boolean\(comentarioAtual\?\.curtidas\.includes\(usuario\.id\)\);/);
  assert.match(acao, /await sincronizarCurtidaComentarioSupabaseComunidade\([\s\S]*?comentarioId,[\s\S]*?usuario\.id,[\s\S]*?jaCurtiu/);
  assert.match(acao, /resultadoSincronizacaoCurtida\.etapa === "remocao"[\s\S]*?Erro ao atualizar curtida do comentário[\s\S]*?Erro ao curtir comentário/);
});

test("alternarCurtidaComentarioComunidade preserva notificacao, estado, feedback, reload e cleanup", () => {
  assert.match(
    acao,
    /if \(!jaCurtiu\) \{[\s\S]*?destinatarioId: comentarioAtual\.autorId,[\s\S]*?tipo: "comunidade-curtida-comentario",[\s\S]*?titulo: "Nova curtida no seu comentário",[\s\S]*?mensagem: `\$\{usuario\.nome\} curtiu seu comentário na Comunidade\.`[\s\S]*?link: `\/comunidade\?post=\$\{encodeURIComponent\(postId\)\}`,[\s\S]*?notificacaoId: `comunidade-curtida-comentario:\$\{comentarioId\}:\$\{usuario\.id\}`/,
  );
  assert.match(acao, /atualizarCurtidaComentarioComunidade\([\s\S]*?postsAtuais,[\s\S]*?postId,[\s\S]*?comentarioId,[\s\S]*?usuario\.id,[\s\S]*?jaCurtiu/);
  assert.match(acao, /jaCurtiu \? "Curtida do comentário removida\." : "Comentário curtido\."/);
  assert.match(acao, /await carregarPostsComunidadeDaPagina\(\);/);
  assert.match(acao, /finally \{[\s\S]*?finalizarAcaoComunidade\(acoesComunidadeRef, chaveAcao\);/);
});

test("Comunidade delega somente a curtida de comentario e preserva as demais acoes", () => {
  assert.match(
    pagina,
    /import \{ alternarCurtidaComentarioComunidade \} from "\.\/components\/community-comment-like-action";/,
  );
  assert.match(
    pagina,
    /const alternarCurtidaComentario = \(postId: string, comentarioId: string\) =>[\s\S]*?alternarCurtidaComentarioComunidade\(\{[\s\S]*?acoesComunidadeRef,[\s\S]*?carregarPostsComunidadeDaPagina,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /async function alternarCurtidaComentario\(/);
  assert.doesNotMatch(pagina, /await sincronizarCurtidaComentarioSupabaseComunidade\(/);
  assert.match(pagina, /removerComentarioComunidade\(\{/);
  assert.doesNotMatch(pagina, /async function removerComentario\(/);
  assert.match(pagina, /denunciarConteudoComunidade\(\{/);
  assert.doesNotMatch(pagina, /function denunciarConteudo\(/);
  assert.match(pagina, /function abrirComentariosPostComunidade\(/);
});
