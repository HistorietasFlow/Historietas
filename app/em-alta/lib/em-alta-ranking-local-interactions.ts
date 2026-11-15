import {
  criarStorageKeyUsuarioEmAlta,
  RATED_WORKS_STORAGE_KEY,
  VIEWED_WORKS_STORAGE_KEY,
} from "./em-alta-local-storage-utils";
import {
  normalizarAvaliacoesLocaisRanking,
  normalizarVisualizacoesRanking,
} from "./em-alta-ranking-data-utils";

function lerInteracao(chave: string) {
  if (!chave) return {};
  try {
    const texto = localStorage.getItem(chave);
    return texto ? JSON.parse(texto) : {};
  } catch { return {}; }
}

export function carregarInteracoesLocaisRankingEmAlta(userId: string) {
  const chaveVisualizacoesUsuario = userId
    ? criarStorageKeyUsuarioEmAlta(VIEWED_WORKS_STORAGE_KEY, userId)
    : "";
  const visualizacoesJson = lerInteracao(chaveVisualizacoesUsuario);
  const visualizacoesNormalizadas =
    normalizarVisualizacoesRanking(visualizacoesJson);

  const chaveAvaliacoesUsuario = userId
    ? criarStorageKeyUsuarioEmAlta(RATED_WORKS_STORAGE_KEY, userId)
    : "";
  const avaliacoesLocaisJson = lerInteracao(chaveAvaliacoesUsuario);
  const avaliacoesLocaisNormalizadas =
    normalizarAvaliacoesLocaisRanking(avaliacoesLocaisJson);

  return {
    visualizacoesNormalizadas,
    avaliacoesLocaisNormalizadas,
  };
}
