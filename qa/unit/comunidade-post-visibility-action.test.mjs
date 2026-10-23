import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const acao = readFileSync(
  new URL(
    "../../app/comunidade/components/community-post-visibility-action.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("atualizarVisibilidadePostComunidade preserva lock, guardas e normalizacao", () => {
  assert.match(acao, /export async function atualizarVisibilidadePostComunidade\(/);
  assert.match(acao, /const chaveAcao = `visibilidade-post:\$\{post\.id\}`;/);
  assert.match(acao, /iniciarAcaoComunidade\(acoesComunidadeRef, chaveAcao\)/);
  assert.match(acao, /setPostVisibilidadeAtualizandoId\(post\.id\);/);
  assert.match(acao, /setErro\(""\);/);
  assert.match(acao, /if \(!exigirLogin\(\) \|\| !usuario\) \{/);
  assert.match(acao, /if \(post\.autorId\.trim\(\) !== usuario\.id\.trim\(\)\) \{/);
  assert.match(
    acao,
    /const visibilidadeSegura = normalizarVisibilidadePostComunidade\([\s\S]*?novaVisibilidade/,
  );
  assert.match(acao, /if \(post\.visibilidade === visibilidadeSegura\) \{/);
});

test("atualizarVisibilidadePostComunidade preserva protecao da review e Supabase", () => {
  assert.match(
    acao,
    /post\.tipoPublicacao === "Review" && visibilidadeSegura !== "publico"/,
  );
  assert.match(
    acao,
    /await registrarReviewComunidadeNoDiario\(\{[\s\S]*?userId: usuario\.id,[\s\S]*?postId: post\.id,[\s\S]*?sugestoesObras: obrasRelacionadasSugestoes,[\s\S]*?visibilidade: visibilidadeSegura/,
  );
  assert.match(
    acao,
    /if \(!reviewSincronizada\) \{[\s\S]*?Não foi possível atualizar a privacidade da review no Diário\./,
  );
  assert.match(
    acao,
    /await atualizarVisibilidadePostSupabaseComunidade\([\s\S]*?post\.id,[\s\S]*?usuario\.id,[\s\S]*?visibilidadeSegura/,
  );
  assert.match(
    acao,
    /!resultadoAtualizacaoVisibilidade\.sucesso \|\|[\s\S]*?!resultadoAtualizacaoVisibilidade\.data/,
  );
  assert.match(
    acao,
    /reviewsDiarioSincronizadasRef\.current\.delete\(post\.id\);/,
  );
  assert.match(
    acao,
    /reviewsDiarioSincronizadasRef\.current\.add\(post\.id\);/,
  );
});

test("atualizarVisibilidadePostComunidade preserva estado, menu, feedback e cleanup", () => {
  assert.match(
    acao,
    /atualizarVisibilidadePostNoEstadoComunidade\([\s\S]*?postsAtuais,[\s\S]*?post\.id,[\s\S]*?visibilidadeSegura/,
  );
  assert.match(acao, /setPostMenuAbertoId\(null\);/);
  assert.match(
    acao,
    /emitirFeedbackAcao\(setFeedbackAcao, feedbackTimerRef, "Visibilidade da publicação atualizada\."\);/,
  );
  assert.match(
    acao,
    /finally \{[\s\S]*?finalizarAcaoComunidade\(acoesComunidadeRef, chaveAcao\);[\s\S]*?setPostVisibilidadeAtualizandoId\(\(postAtualId\) =>[\s\S]*?postAtualId === post\.id \? null : postAtualId/,
  );
});

test("Comunidade delega somente atualizarVisibilidadePost ao modulo", () => {
  assert.match(
    pagina,
    /import \{ atualizarVisibilidadePostComunidade \} from "\.\/components\/community-post-visibility-action";/,
  );
  assert.match(
    pagina,
    /const atualizarVisibilidadePost = \([\s\S]*?\) =>[\s\S]*?atualizarVisibilidadePostComunidade\(\{[\s\S]*?post,[\s\S]*?novaVisibilidade,[\s\S]*?reviewsDiarioSincronizadasRef,[\s\S]*?feedbackTimerRef,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /async function atualizarVisibilidadePost\(/);
  assert.doesNotMatch(pagina, /await atualizarVisibilidadePostSupabaseComunidade\(/);
  assert.match(pagina, /async function alternarFixadoPost\(/);
  assert.match(pagina, /async function removerPost\(/);
});
