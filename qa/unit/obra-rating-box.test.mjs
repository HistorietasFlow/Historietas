import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ratingBox = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-rating-box.tsx",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("rating box preserva layout, calculos e estrelas acessiveis", () => {
  for (const trecho of [
    "isDesktop ? desktopWorkRatingBoxStyle : workRatingBoxStyle",
    "workRatingHeaderStyle",
    "workRatingTitleStyle",
    "AVALIE ESTA OBRA",
    "workRatingStarsRowStyle",
    "NOTAS_AVALIACAO_OBRA.map",
    "obterPreenchimentoEstrela",
    "obterProximaNotaAvaliacao",
    "key={`avaliacao-obra-${estrela}`}",
    "onClick={() => void onAvaliar(proximaNota)}",
    "disabled={salvando}",
    "workRatingStarButtonStyle",
    "workRatingStarActiveStyle",
    'aria-hidden="true"',
    "workRatingStarVisualStyle",
    "workRatingStarBaseStyle",
    "workRatingStarFillStyle",
    "width: preenchimentoEstrela",
  ]) {
    assert.ok(ratingBox.includes(trecho), trecho);
  }

  assert.match(
    ratingBox,
    /preenchimentoEstrela === "0%"\s*\? workRatingStarButtonStyle\s*:\s*workRatingStarActiveStyle/,
  );
  assert.match(
    ratingBox,
    /\.toString\(\)\s*\.replace\("\.", ","\)\} estrela\$\{proximaNota === 1 \? "" : "s"\}/,
  );
  assert.equal((ratingBox.match(/★/g) || []).length, 2);
});

test("cliente preserva condicao, estado e avaliacao protegida", () => {
  for (const trecho of [
    "autenticacaoCarregada && !usuarioEhAutorDaObra",
    "avaliacaoObra",
    "async function avaliarObra(nota: number)",
    "identidadeAcao",
    "execucaoAvaliacaoEstaAtual",
    "salvarAvaliacaoRemotaObra",
    "registrarAtividadeDiarioObra",
    "removerAtividadeDiarioObra",
    "<ObraRatingBox",
    "minhaNota={avaliacaoObra.minhaNota}",
    "salvando={avaliacaoObra.salvando}",
    "onAvaliar={avaliarObra}",
  ]) {
    assert.ok(paginaObra.includes(trecho), trecho);
  }

  assert.doesNotMatch(
    paginaObra,
    /obterProximaNotaAvaliacao/,
  );
});
