import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const resumoAvaliacao = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-rating-summary.tsx",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("resumo preserva média, estrelas, total e acessibilidade", () => {
  for (const trecho of [
    "media: number;",
    "total: number;",
    "ratingSummaryStyle",
    "ratingNumberStyle",
    "ratingStarsStyle",
    "formatarMediaAvaliacao(media)",
    "aria-label={`Média ${formatarMediaAvaliacao(media)} de 5`}",
    "NOTAS_AVALIACAO_OBRA.map",
    "key={`media-obra-${estrela}`}",
    "ratingTopStarVisualStyle",
    'aria-hidden="true"',
    "ratingTopStarBaseStyle",
    "ratingTopStarFillStyle",
    "width: obterPreenchimentoEstrela(estrela, media)",
    "ratingTotalStyle",
    "formatarTotalAvaliacoes(total)",
  ]) {
    assert.ok(resumoAvaliacao.includes(trecho), trecho);
  }

  assert.equal((resumoAvaliacao.match(/★/g) || []).length, 2);
});

test("cliente preserva a variável, o estado e a posição do resumo no hero", () => {
  const resumo = paginaObra.indexOf("const resumoAvaliacaoCabecalho = (");
  const heroHeader = paginaObra.indexOf("<ObraHeroHeader", resumo);

  assert.ok(resumo >= 0);
  assert.ok(heroHeader > resumo);
  for (const trecho of [
    "<ObraRatingSummary",
    "media={avaliacaoObra.media}",
    "total={avaliacaoObra.total}",
    "const [avaliacaoObra, setAvaliacaoObra]",
    "async function avaliarObra",
    "{resumoAvaliacaoCabecalho}",
    "<ObraHeroHeader",
    "resumoAvaliacao={resumoAvaliacaoCabecalho}",
  ]) {
    assert.ok(paginaObra.includes(trecho), trecho);
  }
});
