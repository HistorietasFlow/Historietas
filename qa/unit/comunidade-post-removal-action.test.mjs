import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const actionPath = new URL(
  "../../app/comunidade/components/community-post-removal-action.ts",
  import.meta.url,
);
const actionSource = readFileSync(actionPath, "utf8");
const pageSource = readFileSync(
  new URL("../../app/comunidade/page.tsx", import.meta.url),
  "utf8",
);

function assertInOrder(...trechos) {
  let indiceAnterior = -1;

  for (const trecho of trechos) {
    const indiceAtual = actionSource.indexOf(trecho);
    assert.notEqual(indiceAtual, -1, `não encontrou: ${trecho}`);
    assert.ok(indiceAtual > indiceAnterior, `ordem incorreta: ${trecho}`);
    indiceAnterior = indiceAtual;
  }
}

test("removerPostComunidade preserva lock, estado inicial e guard de login", () => {
  assert.equal(existsSync(actionPath), true);
  assert.match(actionSource, /export async function removerPostComunidade/);
  assert.match(actionSource, /const chaveAcao = `remover-post:\$\{postId\}`;/);
  assert.match(
    actionSource,
    /if \(!iniciarAcaoComunidade\(acoesComunidadeRef, chaveAcao\)\) \{\s*return;/,
  );
  assert.match(actionSource, /setPostRemovendoId\(postId\);\s*setErro\(""\);/);
  assert.match(actionSource, /if \(!exigirLogin\(\) \|\| !usuario\) \{/);
  assertInOrder(
    "iniciarAcaoComunidade(acoesComunidadeRef, chaveAcao)",
    "setPostRemovendoId(postId)",
    "if (!exigirLogin() || !usuario)",
  );
});

test("removerPostComunidade preserva identidade, acesso atual e consulta do post", () => {
  assert.match(actionSource, /await obterUsuarioAutenticadoComunidadeAtual\(\)/);
  assert.match(actionSource, /const usuarioAutenticadoId = usuarioAutenticado\?\.id\?\.trim\(\) \|\| "";/);
  assert.match(actionSource, /const usuarioEstadoId = usuario\.id\.trim\(\);/);
  assert.match(
    actionSource,
    /!usuarioAutenticadoId \|\|\s*usuarioAutenticadoId !== usuarioEstadoId/,
  );
  assert.match(
    actionSource,
    /setUsuario\(null\);\s*setUsuarioEhAdmin\(false\);\s*setPostMenuAbertoId\(null\);\s*setErro\(\s*"Sua conta mudou\. Aguarde a Comunidade atualizar antes de tentar novamente\."/,
  );
  assert.match(actionSource, /await consultarUsuarioEhAdminComunidade\(\)/);
  assert.match(actionSource, /await consultarPostParaRemocaoComunidade\(postId\)/);
  assert.match(actionSource, /"Erro ao conferir publicação"/);
  assertInOrder(
    "await obterUsuarioAutenticadoComunidadeAtual()",
    "await consultarUsuarioEhAdminComunidade()",
    "await consultarPostParaRemocaoComunidade(postId)",
  );
});

test("removerPostComunidade preserva post inexistente, autorização e confirmação", () => {
  assert.match(
    actionSource,
    /if \(!postBanco\) \{[\s\S]*?removerPostDoEstadoComunidade\(postsAtuais, postId\)[\s\S]*?setPostMenuAbertoId\(null\);[\s\S]*?"Esta publicação já não existe\."/,
  );
  assert.match(actionSource, /const autorPostId = postBanco\.autor_id\?\.trim\(\) \|\| "";/);
  assert.match(
    actionSource,
    /!usuarioAtualEhAdmin &&\s*autorPostId !== usuarioAutenticadoId/,
  );
  assert.match(actionSource, /"Você só pode remover suas próprias publicações\."/);
  assert.match(
    actionSource,
    /window\.confirm\(\s*traduzirTextoComunidade\("Remover esta publicação\?", language\)/,
  );
  assertInOrder(
    "await consultarPostParaRemocaoComunidade(postId)",
    "if (!postBanco)",
    "if (\n      !usuarioAtualEhAdmin",
    "window.confirm(",
  );
});

test("removerPostComunidade preserva delete confirmado e o branch sem linha removida", () => {
  assert.match(
    actionSource,
    /await removerPostSupabaseComunidade\(\s*postId,\s*usuarioAutenticadoId,\s*usuarioAtualEhAdmin/,
  );
  assert.match(actionSource, /"Erro ao remover publicação"/);
  assert.match(actionSource, /const postsRemovidos = resultadoRemocaoPost\.postsRemovidos;/);
  assert.match(
    actionSource,
    /!Array\.isArray\(postsRemovidos\) \|\| postsRemovidos\.length === 0/,
  );
  assert.match(
    actionSource,
    /"A publicação não foi removida\. A conta atual não possui permissão para essa ação\."/,
  );
  assert.match(
    actionSource,
    /await carregarPostsComunidadeDaPagina\(false, 0, obraRelacionadaFiltro\);/,
  );
  assertInOrder(
    "window.confirm(",
    "await removerPostSupabaseComunidade(",
    "if (!resultadoRemocaoPost.sucesso)",
    "if (!Array.isArray(postsRemovidos) || postsRemovidos.length === 0)",
  );
});

test("removerPostComunidade preserva Diário, estado local, salvos, feedback e reload", () => {
  assert.match(actionSource, /postRemovido\.tipo_publicacao === "Review"/);
  assert.match(
    actionSource,
    /await removerReviewComunidadeDoDiario\(\{\s*userId: postRemovido\.autor_id \|\| autorPostId,\s*postId,/,
  );
  assert.match(actionSource, /reviewsDiarioSincronizadasRef\.current\.delete\(postId\);/);
  assert.match(actionSource, /setUsuarioEhAdmin\(usuarioAtualEhAdmin\);/);
  assert.match(actionSource, /removerPostDoEstadoComunidade\(postsAtuais, postId\)/);
  assert.match(actionSource, /removerPostSalvoDoEstadoComunidade\(\s*postsSalvosIds,\s*postId/);
  assert.match(
    actionSource,
    /salvarJsonUsuarioComunidade\(\s*CHAVE_POSTS_SALVOS_COMUNIDADE,\s*usuarioAutenticadoId,\s*postsSalvosAtualizados/,
  );
  assert.match(
    actionSource,
    /emitirFeedbackAcao\(setFeedbackAcao, feedbackTimerRef, "Publicação removida\."\);/,
  );
  assert.match(
    actionSource,
    /await removerReviewComunidadeDoDiario\([\s\S]*?reviewsDiarioSincronizadasRef\.current\.delete\(postId\);[\s\S]*?setPosts\(\(postsAtuais\) =>\s*removerPostDoEstadoComunidade\(postsAtuais, postId\)[\s\S]*?setPostsSalvosIds\(postsSalvosAtualizados\);[\s\S]*?salvarJsonUsuarioComunidade\([\s\S]*?emitirFeedbackAcao\(setFeedbackAcao, feedbackTimerRef, "Publicação removida\."\);[\s\S]*?await carregarPostsComunidadeDaPagina\(false, 0, obraRelacionadaFiltro\);/,
  );
});

test("removerPostComunidade preserva cleanup condicional no finally", () => {
  assert.match(
    actionSource,
    /finally \{\s*finalizarAcaoComunidade\(acoesComunidadeRef, chaveAcao\);\s*setPostRemovendoId\(\(postAtualId\) =>\s*postAtualId === postId \? null : postAtualId/,
  );
  assert.doesNotMatch(actionSource, /supabase\./);
  assert.doesNotMatch(
    actionSource,
    /useState\(|useEffect\(|useMemo\(|return\s*\(\s*</,
  );
});

test("Comunidade delega removerPost e mantém callbacks e JSX na página", () => {
  assert.match(
    pageSource,
    /import \{ removerPostComunidade \} from "\.\/components\/community-post-removal-action";/,
  );
  assert.match(
    pageSource,
    /const removerPost = \(postId: string\) =>\s*removerPostComunidade\(\{[\s\S]*?postId,[\s\S]*?acoesComunidadeRef,[\s\S]*?setPostRemovendoId,[\s\S]*?obraRelacionadaFiltro,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pageSource, /async function removerPost\(/);
  assert.match(pageSource, /onRemover: removerPost/);
});
