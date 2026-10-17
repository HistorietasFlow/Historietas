import { carregarIdsColecaoUsuarioSupabaseEmAlta } from "./em-alta-collection-supabase-loader";
import {
  carregarListaIdsLocalEmAlta,
  COMPLETED_STORAGE_KEY,
  FAVORITES_STORAGE_KEY,
  salvarListaIdsLocalEmAlta,
} from "./em-alta-local-storage-utils";
import { normalizarListaIdsEmAlta } from "./em-alta-ranking-list-utils";

export async function carregarColecoesRankingEmAlta(userIdAtual: string) {
  const [favoritosSupabase, concluidasSupabase] = await Promise.all([
    carregarIdsColecaoUsuarioSupabaseEmAlta("favoritos", userIdAtual),
    carregarIdsColecaoUsuarioSupabaseEmAlta("concluidas", userIdAtual),
  ]);

  const obrasFavoritasNormalizadas = normalizarListaIdsEmAlta([
    ...carregarListaIdsLocalEmAlta(FAVORITES_STORAGE_KEY, userIdAtual),
    ...favoritosSupabase,
  ]);

  const obrasConcluidasNormalizadas = normalizarListaIdsEmAlta([
    ...carregarListaIdsLocalEmAlta(COMPLETED_STORAGE_KEY, userIdAtual),
    ...concluidasSupabase,
  ]);

  salvarListaIdsLocalEmAlta(
    FAVORITES_STORAGE_KEY,
    userIdAtual,
    obrasFavoritasNormalizadas,
  );
  salvarListaIdsLocalEmAlta(
    COMPLETED_STORAGE_KEY,
    userIdAtual,
    obrasConcluidasNormalizadas,
  );

  return {
    obrasFavoritasNormalizadas,
    obrasConcluidasNormalizadas,
  };
}
