import { useMemo } from "react";
import type { ObraLocal, ObraRanking } from "../lib/em-alta-models";
import { calcularRankingAutores } from "../lib/em-alta-author-ranking-utils";
import { calcularRankingObrasLocais } from "../lib/em-alta-local-ranking-utils";
import { criarVisaoRankingEmAlta } from "../lib/em-alta-ranking-view-utils";

type UseEmAltaRankingDerivedDataParams = {
  avaliacoesLocaisRegistradas: Record<string, number>;
  obrasLocais: ObraLocal[];
  visualizacoesRegistradas: Record<string, number>;
};

export function useEmAltaRankingDerivedData({
  avaliacoesLocaisRegistradas,
  obrasLocais,
  visualizacoesRegistradas,
}: UseEmAltaRankingDerivedDataParams) {
  const ranking = useMemo<ObraRanking[]>(
    () =>
      calcularRankingObrasLocais(
        obrasLocais,
        avaliacoesLocaisRegistradas,
        visualizacoesRegistradas,
      ),
    [avaliacoesLocaisRegistradas, obrasLocais, visualizacoesRegistradas],
  );

  const rankingAutores = useMemo(
    () => calcularRankingAutores(ranking),
    [ranking],
  );

  const {
    rankingGeral,
    rankingMaisLidas,
    rankingMaisCurtidas,
    rankingMaisComentadas,
    rankingMaisSalvas,
    rankingMaisRecentes,
    rankingMaisCapitulos,
    rankingTemAtividadeReal,
    rankingParaCatalogoInicial,
  } = useMemo(() => criarVisaoRankingEmAlta(ranking), [ranking]);

  return {
    ranking,
    rankingAutores,
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
