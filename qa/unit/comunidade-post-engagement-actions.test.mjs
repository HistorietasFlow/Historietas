import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const acoes = readFileSync(
  new URL(
    "../../app/comunidade/components/community-post-engagement-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("as acoes de engajamento preservam lock, guardas, sincronizacao e notificacao da curtida", () => {
  assert.match(acoes, /export function useComunidadePostEngagementActions\(/);
  assert.match(acoes, /const chaveAcao = `curtir-post:\$\{postId\}`;/);
  assert.match(acoes, /iniciarAcaoComunidade\(acoesComunidadeRef, chaveAcao\)/);
  assert.match(acoes, /setPostCurtindoId\(postId\);[\s\S]*?setErro\(""\);/);
  assert.match(acoes, /if \(!exigirLogin\(\) \|\| !usuario\) \{/);
  assert.match(acoes, /const jaCurtiu = Boolean\(postAtual\?\.curtidas\.includes\(usuario\.id\)\);/);
  assert.match(
    acoes,
    /await sincronizarCurtidaPostSupabaseComunidade\([\s\S]*?postId,[\s\S]*?usuario\.id,[\s\S]*?jaCurtiu/,
  );
  assert.match(
    acoes,
    /resultadoSincronizacaoCurtida\.etapa === "remocao"[\s\S]*?"Erro ao atualizar curtida"[\s\S]*?"Erro ao curtir"/,
  );
  assert.match(
    acoes,
    /if \(!jaCurtiu\) \{[\s\S]*?criarNotificacaoComunidadeSupabase\([\s\S]*?comunidade-curtida-post:\$\{postId\}:\$\{usuario\.id\}/,
  );
  assert.match(acoes, /atualizarCurtidaPostComunidade\([\s\S]*?postsAtuais,[\s\S]*?postId,[\s\S]*?usuario\.id,[\s\S]*?jaCurtiu/);
  assert.match(acoes, /finalizarAcaoComunidade\(acoesComunidadeRef, chaveAcao\);[\s\S]*?setPostCurtindoId/);
});

test("as acoes de engajamento preservam salvos, compartilhamento, enquete e spoiler", () => {
  assert.match(acoes, /function salvarPostComunidade\(postId: string\) \{[\s\S]*?alternarPostSalvo\([\s\S]*?postsSalvosIds,[\s\S]*?setPostsSalvosIds,[\s\S]*?feedbackTimerRef/);
  assert.match(acoes, /function compartilharPostComunidade\(post: PostComunidade\) \{[\s\S]*?compartilharPublicacao\([\s\S]*?setPostCompartilhandoId,[\s\S]*?setFeedbackAcao,[\s\S]*?setErro/);
  assert.match(acoes, /function votarEnquetePostComunidade\(postId: string, opcao: string\) \{[\s\S]*?votarEnquete\([\s\S]*?votandoEnqueteId,[\s\S]*?votosEnquetes,[\s\S]*?setResultadosEnquetes,[\s\S]*?setVotosEnquetes/);
  assert.match(acoes, /function alternarSpoilerPostComunidade\(postId: string\) \{[\s\S]*?alternarSpoilerRevelado\([\s\S]*?setSpoilersReveladosIds/);
});

test("Comunidade delega somente as acoes de engajamento ao modulo dedicado", () => {
  assert.match(
    pagina,
    /import \{ useComunidadePostEngagementActions \} from "\.\/components\/community-post-engagement-actions";/,
  );
  assert.match(
    pagina,
    /useComunidadePostEngagementActions\(\{[\s\S]*?acoesComunidadeRef,[\s\S]*?postsSalvosIds,[\s\S]*?votosEnquetes,[\s\S]*?setSpoilersReveladosIds,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /async function alternarCurtida\(/);
  assert.doesNotMatch(pagina, /function salvarPostComunidade\(/);
  assert.doesNotMatch(pagina, /function compartilharPostComunidade\(/);
  assert.doesNotMatch(pagina, /function votarEnquetePostComunidade\(/);
  assert.doesNotMatch(pagina, /function alternarSpoilerPostComunidade\(/);
  assert.match(pagina, /async function comentarPost\(/);
  assert.match(pagina, /function denunciarPostComunidade\(/);
});
