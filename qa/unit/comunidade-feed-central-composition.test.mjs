import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const composicao = readFileSync(
  new URL(
    "../../app/comunidade/components/community-feed-central-composition.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("a composicao central preserva busca de usuarios e resultados de publicacoes", () => {
  assert.match(
    composicao,
    /const exibirResultadosBusca = deveExibirResultadosBuscaComunidade\([\s\S]*?termoBuscaNormalizado/,
  );
  assert.match(composicao, /<CommunityUserSearchResults[\s\S]*?onAlternarSeguir=\{onAlternarSeguir\}/);
  assert.match(composicao, /<CommunitySearchResultsTitle>Publicações<\/CommunitySearchResultsTitle>/);
  assert.match(
    composicao,
    /traduzirContagemResultadosComunidade\([\s\S]*?postsVisiveis\.length,[\s\S]*?"publicacoes",[\s\S]*?idioma/,
  );
});

test("a composicao central delega a apresentacao da lista e paginação do feed", () => {
  assert.match(composicao, /<CommunityFeedPostsSection[\s\S]*?desktop=\{desktop\}/);
  assert.match(composicao, /carregandoFeed=\{carregandoFeed\}/);
  assert.match(composicao, /renderizarPost=\{renderizarPost\}/);
  assert.match(composicao, /onCarregarMais=\{onCarregarMais\}/);
  assert.doesNotMatch(composicao, /supabase\./);
  assert.doesNotMatch(composicao, /use[A-Z]\w*\(/);
});

test("a pagina preserva a orquestracao de posts e callbacks", () => {
  assert.match(
    pagina,
    /import \{ CommunityFeedCentralComposition \} from "\.\/components\/community-feed-central-composition";/,
  );
  assert.match(pagina, /<CommunityFeedCentralComposition[\s\S]*?onAlternarSeguir=\{alternarSeguirUsuarioBusca\}/);
  assert.match(pagina, /renderizarPost=\{\(post\) => \{[\s\S]*?obterEstadoApresentacaoPostComunidade\(/);
  assert.match(pagina, /criarAcoesPostComunidade\(/);
  assert.match(pagina, /onRemover: removerPost/);
  assert.match(pagina, /onCarregarMais=\{carregarMaisPostsComunidadeDaPagina\}/);
  assert.doesNotMatch(pagina, /<CommunityUserSearchResults/);
  assert.doesNotMatch(pagina, /<CommunityFeedPostsSection/);
});
