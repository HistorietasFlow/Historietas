import { carregarIdsColecaoUsuarioSupabaseEmAlta } from "./em-alta-collection-supabase-loader";
import { carregarListaIdsLocalEmAlta, COMPLETED_STORAGE_KEY, FAVORITES_STORAGE_KEY, salvarListaIdsLocalEmAlta } from "./em-alta-local-storage-utils";
import { normalizarListaIdsEmAlta } from "./em-alta-ranking-list-utils";
import { aguardarColecoesEmAlta, obterVersaoColecoesEmAlta } from "./em-alta-collection-supabase-sync";

export async function carregarColecoesRankingEmAlta(userIdAtual: string, execucaoEstaAtual: () => boolean = () => true) {
  await aguardarColecoesEmAlta(userIdAtual);
  const versao = obterVersaoColecoesEmAlta(userIdAtual);
  const localFavoritas = carregarListaIdsLocalEmAlta(FAVORITES_STORAGE_KEY, userIdAtual);
  const localConcluidas = carregarListaIdsLocalEmAlta(COMPLETED_STORAGE_KEY, userIdAtual);
  const resultados = await Promise.allSettled([
    carregarIdsColecaoUsuarioSupabaseEmAlta("favoritos", userIdAtual),
    carregarIdsColecaoUsuarioSupabaseEmAlta("concluidas", userIdAtual),
  ]);
  const obrasFavoritasNormalizadas = normalizarListaIdsEmAlta(resultados[0].status === "fulfilled" ? resultados[0].value : localFavoritas);
  const obrasConcluidasNormalizadas = normalizarListaIdsEmAlta(resultados[1].status === "fulfilled" ? resultados[1].value : localConcluidas);
  const obsoletas = !execucaoEstaAtual() || versao !== obterVersaoColecoesEmAlta(userIdAtual);
  if (!obsoletas) {
    if (resultados[0].status === "fulfilled") salvarListaIdsLocalEmAlta(FAVORITES_STORAGE_KEY, userIdAtual, obrasFavoritasNormalizadas);
    if (resultados[1].status === "fulfilled") salvarListaIdsLocalEmAlta(COMPLETED_STORAGE_KEY, userIdAtual, obrasConcluidasNormalizadas);
  }
  return { obrasFavoritasNormalizadas, obrasConcluidasNormalizadas, obsoletas,
    falhaTemporaria: resultados.some(resultado => resultado.status === "rejected"), versao };
}
