import {
  criarStorageKeyUsuarioEmAlta,
  RATED_WORKS_STORAGE_KEY,
  VIEWED_WORKS_STORAGE_KEY,
} from "./em-alta-local-storage-utils";
import {
  normalizarAvaliacoesLocaisRanking,
  normalizarVisualizacoesRanking,
} from "./em-alta-ranking-data-utils";

export function carregarInteracoesLocaisRankingEmAlta(userId: string) {
  const chaveVisualizacoesUsuario = userId
    ? criarStorageKeyUsuarioEmAlta(VIEWED_WORKS_STORAGE_KEY, userId)
    : "";
  const visualizacoesTexto = chaveVisualizacoesUsuario
    ? localStorage.getItem(chaveVisualizacoesUsuario)
    : null;
  const visualizacoesJson = visualizacoesTexto
    ? JSON.parse(visualizacoesTexto)
    : {};
  const visualizacoesNormalizadas =
    normalizarVisualizacoesRanking(visualizacoesJson);

  const chaveAvaliacoesUsuario = userId
    ? criarStorageKeyUsuarioEmAlta(RATED_WORKS_STORAGE_KEY, userId)
    : "";
  const avaliacoesLocaisTexto = chaveAvaliacoesUsuario
    ? localStorage.getItem(chaveAvaliacoesUsuario)
    : null;
  const avaliacoesLocaisJson = avaliacoesLocaisTexto
    ? JSON.parse(avaliacoesLocaisTexto)
    : {};
  const avaliacoesLocaisNormalizadas =
    normalizarAvaliacoesLocaisRanking(avaliacoesLocaisJson);

  return {
    visualizacoesNormalizadas,
    avaliacoesLocaisNormalizadas,
  };
}
