import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/perfil-autor/page.tsx", import.meta.url),
  "utf8",
);
const ratingViewStateSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-rating-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);
const highlightsViewStateSource = readFileSync(
  new URL(
    "../../app/perfil-autor/lib/profile-highlights-view-state.ts",
    import.meta.url,
  ),
  "utf8",
);

test("estado visual das avaliações preserva a composição e a ordem", () => {
  assert.match(
    ratingViewStateSource,
    /export function obterEstadoVisualAvaliacaoPerfilAutor/,
  );
  assert.match(
    ratingViewStateSource,
    /obterEstadoAvaliacaoPerfilAutor\(\{[\s\S]*?\}\);[\s\S]*?obterVisibilidadeAcoesAvaliacaoPerfilAutor\(\{/,
  );
  for (const campo of [
    "autorPodeReceberAvaliacao",
    "perfilUsaAvaliacaoDiario",
    "avaliacaoDiarioPrivada",
    "avaliacaoResumoPerfilVisivel",
    "avaliacaoResumoPerfil",
    "avaliacaoResumoEhDiario",
    "avaliacaoAutorAcaoVisivel",
    "avaliacaoDiarioAcaoVisivel",
  ]) {
    assert.match(ratingViewStateSource, new RegExp(`\\b${campo}\\b`));
  }
  assert.match(
    ratingViewStateSource,
    /avaliacaoDiarioVisivel: avaliacaoDiario\.visivel/,
  );
  assert.match(
    ratingViewStateSource,
    /avaliacaoDiarioPodeAvaliar: avaliacaoDiario\.podeAvaliar/,
  );
  assert.doesNotMatch(
    ratingViewStateSource,
    /useState|useEffect|supabase|localStorage|<\w+/,
  );
});

test("estado visual dos destaques preserva a composição e a ordem", () => {
  assert.match(
    highlightsViewStateSource,
    /export function obterEstadoVisualDestaquesPerfilAutor/,
  );
  assert.match(
    highlightsViewStateSource,
    /obterObrasDestaquePerfilAutor\([\s\S]*?obrasEmDestaque\.length[\s\S]*?obterVisibilidadeDestaquesPerfilAutor\([\s\S]*?obterDadosCurtidaTopFivePerfilAutor\([\s\S]*?obterMensagemTopFiveVazioPerfilAutor\(/,
  );
  for (const campo of [
    "obrasEmDestaque",
    "totalObrasEmDestaque",
    "temObrasEmDestaque",
    "exibirSecaoDestaques",
    "dadosCurtidaTopFive",
    "mensagemTopFiveVazio",
  ]) {
    assert.match(highlightsViewStateSource, new RegExp(`\\b${campo}\\b`));
  }
  assert.doesNotMatch(
    highlightsViewStateSource,
    /useState|useEffect|supabase|localStorage|<\w+/,
  );
});

test("página delega os estados derivados e mantém ações e JSX", () => {
  assert.match(
    pagina,
    /import \{ obterEstadoVisualAvaliacaoPerfilAutor \} from "\.\/lib\/profile-rating-view-state";/,
  );
  assert.match(
    pagina,
    /import \{ obterEstadoVisualDestaquesPerfilAutor \} from "\.\/lib\/profile-highlights-view-state";/,
  );
  assert.equal(
    (pagina.match(/obterEstadoVisualAvaliacaoPerfilAutor\(\{/g) || []).length,
    1,
  );
  assert.equal(
    (pagina.match(/obterEstadoVisualDestaquesPerfilAutor\(\{/g) || []).length,
    1,
  );
  assert.match(
    pagina,
    /const botaoCurtidaTopFive = temObrasEmDestaque \? \([\s\S]*?<ProfileHighlightsLikeButton/,
  );
  assert.match(
    pagina,
    /usePerfilAutorTopFiveLikeActions\(/,
  );
  assert.match(
    pagina,
    /<ProfileRatingsPanel[\s\S]*?avaliacaoAutorAcaoVisivel=\{avaliacaoAutorAcaoVisivel\}[\s\S]*?avaliacaoDiarioAcaoVisivel=\{avaliacaoDiarioAcaoVisivel\}/,
  );
});
