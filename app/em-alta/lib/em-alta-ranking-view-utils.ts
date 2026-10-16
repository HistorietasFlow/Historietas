import type { ObraRanking } from "./em-alta-models";
import {
  pegarTopRanking,
  rankingTemInteracaoReal,
} from "./em-alta-ranking-list-utils";

export function criarVisaoRankingEmAlta(ranking: ObraRanking[]) {
  const rankingGeral = pegarTopRanking(ranking, "geral");
  const rankingMaisLidas = pegarTopRanking(ranking, "lidas");
  const rankingMaisCurtidas = pegarTopRanking(ranking, "curtidas");
  const rankingMaisComentadas = pegarTopRanking(ranking, "comentadas");
  const rankingMaisSalvas = pegarTopRanking(ranking, "salvas");
  const rankingMaisRecentes = pegarTopRanking(ranking, "recentes");
  const rankingMaisCapitulos = pegarTopRanking(ranking, "capitulos");
  const rankingTemAtividadeReal = ranking.some((obra) =>
    rankingTemInteracaoReal(obra),
  );
  const rankingParaCatalogoInicial =
    rankingMaisRecentes.length > 0 ? rankingMaisRecentes : rankingGeral;

  return {
    rankingGeral,
    rankingMaisLidas,
    rankingMaisCurtidas,
    rankingMaisComentadas,
    rankingMaisSalvas,
    rankingMaisRecentes,
    rankingMaisCapitulos,
    rankingTemAtividadeReal,
    rankingParaCatalogoInicial,
  };
}
