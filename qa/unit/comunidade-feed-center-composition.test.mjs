import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const composicao = readFileSync(
  new URL(
    "../../app/comunidade/components/community-feed-center-composition.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("a composicao central preserva busca, cabecalho de publicacoes e feed", () => {
  assert.match(composicao, /exibirResultadosBusca: boolean/);
  assert.match(composicao, /<CommunityUserSearchResults \{\.\.\.userSearchProps\} \/>/);
  assert.match(
    composicao,
    /<CommunitySearchResultsTitle>\s*Publicações\s*<\/CommunitySearchResultsTitle>/,
  );
  assert.match(composicao, /\{contagemPublicacoes\}/);
  assert.match(composicao, /<CommunityFeedPostsSection \{\.\.\.feedProps\} \/>/);
});

test("a composicao central permanece estritamente visual", () => {
  assert.doesNotMatch(composicao, /supabase\./);
  assert.doesNotMatch(composicao, /obterEstadoApresentacaoPostComunidade/);
  assert.doesNotMatch(composicao, /criarAcoesPostComunidade/);
  assert.doesNotMatch(composicao, /removerPost/);
  assert.doesNotMatch(composicao, /use[A-Z]\w*\(/);
});

test("a pagina continua orquestrando busca, contagem, posts e acoes", () => {
  assert.match(
    pagina,
    /import \{ CommunityFeedCenterComposition \} from "\.\/components\/community-feed-center-composition";/,
  );
  assert.match(pagina, /exibirResultadosBusca=\{deveExibirResultadosBuscaComunidade\(/);
  assert.match(pagina, /contagemPublicacoes=\{traduzirContagemResultadosComunidade\(/);
  assert.match(pagina, /const renderizarPostComunidade = \(post: PostComunidade\) => \{/);
  assert.match(pagina, /obterEstadoApresentacaoPostComunidade\(\{/);
  assert.match(pagina, /criarAcoesPostComunidade\(\{/);
  assert.match(pagina, /onRemover: removerPost/);
  assert.match(pagina, /removerPostComunidade\(\{/);
  assert.doesNotMatch(pagina, /async function removerPost\(/);
  assert.match(pagina, /renderizarPost: renderizarPostComunidade/);
  assert.match(pagina, /onCarregarMais: carregarMaisPostsComunidadeDaPagina/);
  assert.doesNotMatch(pagina, /<CommunityUserSearchResults/);
  assert.doesNotMatch(pagina, /<CommunitySearchResultsHeader>/);
  assert.doesNotMatch(pagina, /<CommunityFeedPostsSection/);
});
