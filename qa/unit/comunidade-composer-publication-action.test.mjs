import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const acao = readFileSync(
  new URL(
    "../../app/comunidade/components/community-composer-publication-action.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("publicarPostComunidade preserva guards, validação e persistência da publicação", () => {
  assert.match(acao, /export async function publicarPostComunidade\(/);
  assert.match(acao, /const chaveAcao = "publicar-post";/);
  assert.match(acao, /iniciarAcaoComunidade\(acoesComunidadeRef, chaveAcao\)/);
  assert.match(acao, /if \(!exigirLogin\(\) \|\| !usuario\) \{/);
  assert.match(acao, /await garantirAceiteAntesDePublicarComunidade\(\)/);
  assert.match(
    acao,
    /const usuarioAutenticadoId = usuarioAutenticado\?\.id\?\.trim\(\) \|\| "";[\s\S]*?const usuarioEstadoId = usuario\.id\.trim\(\);[\s\S]*?!usuarioAutenticadoId \|\|[\s\S]*?usuarioAutenticadoId !== usuarioEstadoId/,
  );
  assert.match(acao, /normalizarVisibilidadePostComunidade\(visibilidadePost\)/);
  assert.match(acao, /validarConteudoPublicacaoComunidade\([\s\S]*?textoLimpo,[\s\S]*?tipoPublicacaoPost/);
  assert.match(acao, /prepararDadosInsercaoPostComunidade\(\{/);
  assert.match(acao, /await inserirPostSupabaseComunidade\(dadosPostBanco\)/);
  assert.match(acao, /await consultarPostCriadoComunidade\([\s\S]*?usuarioAutenticadoId,[\s\S]*?textoPostBanco/);
  assert.match(acao, /await carregarPostsComunidadeDaPagina\(false, 0, obraRelacionadaFiltro\)/);
});

test("publicarPostComunidade preserva Diário, limpeza e finalização do lock", () => {
  assert.match(
    acao,
    /novoPost &&[\s\S]*?!publicacaoEhEnquete &&[\s\S]*?tipoPublicacaoPost === "Review"/,
  );
  assert.match(
    acao,
    /reviewsDiarioSincronizadasRef\.current\.add\(novoPost\.id\);[\s\S]*?await registrarReviewComunidadeNoDiario\(\{[\s\S]*?visibilidade: novoPost\.visibilidade/,
  );
  assert.match(acao, /reviewsDiarioSincronizadasRef\.current\.delete\(novoPost\.id\);/);
  assert.match(
    acao,
    /textoPostRef\.current\.value = "";[\s\S]*?obraRelacionadaRef\.current\.value = "";[\s\S]*?setObraRelacionadaBusca\(""\);[\s\S]*?setCapituloRelacionadoPost\(""\);[\s\S]*?setSugestoesObrasAbertas\(false\);[\s\S]*?setCategoriaPost\("Geral"\);[\s\S]*?setTipoPublicacaoPost\("Discussão"\);[\s\S]*?setVisibilidadePost\("publico"\);[\s\S]*?setTemSpoilerPost\(false\);[\s\S]*?setComposerAberto\(false\);/,
  );
  assert.match(acao, /finalizarAcaoComunidade\(acoesComunidadeRef, chaveAcao\);[\s\S]*?setPublicandoPost\(false\);/);
});

test("Comunidade delega somente a ação de publicação ao módulo dedicado", () => {
  assert.match(
    pagina,
    /import \{ publicarPostComunidade \} from "\.\/components\/community-composer-publication-action";/,
  );
  assert.match(
    pagina,
    /const publicarPost = \(event: FormEvent<HTMLFormElement>\) =>[\s\S]*?publicarPostComunidade\(\{[\s\S]*?acoesComunidadeRef,[\s\S]*?garantirAceiteAntesDePublicarComunidade,[\s\S]*?carregarPostsComunidadeDaPagina,[\s\S]*?reviewsDiarioSincronizadasRef,[\s\S]*?feedbackTimerRef,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /async function publicarPost\(/);
  assert.doesNotMatch(pagina, /await inserirPostSupabaseComunidade\(/);
  assert.match(pagina, /useComunidadePostEngagementActions\(\{/);
  assert.match(pagina, /async function comentarPost\(/);
});
