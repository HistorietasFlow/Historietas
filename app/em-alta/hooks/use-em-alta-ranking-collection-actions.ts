import type { ObraRanking } from "../lib/em-alta-models";
import {
  adicionarRankingObraNaLista,
  listaTemRankingObra,
  normalizarListaIdsEmAlta,
  removerRankingObraDaLista,
} from "../lib/em-alta-ranking-list-utils";
import {
  COMPLETED_STORAGE_KEY,
  FAVORITES_STORAGE_KEY,
  salvarListaIdsLocalEmAlta,
} from "../lib/em-alta-local-storage-utils";
import { sincronizarColecaoRankingSupabase } from "../lib/em-alta-collection-supabase-sync";
import { registrarColecaoRankingNoDiario } from "../lib/em-alta-diary-activity";

export function useEmAltaRankingCollectionActions({
  ranking,
  obrasFavoritas,
  obrasConcluidas,
  usuarioLogadoId,
  usuarioTemSessaoAtiva,
  avisarLoginRanking,
  setObrasFavoritas,
  setObrasConcluidas,
}: {
  ranking: ObraRanking[];
  obrasFavoritas: string[];
  obrasConcluidas: string[];
  usuarioLogadoId: string;
  usuarioTemSessaoAtiva: () => Promise<boolean>;
  avisarLoginRanking: () => void;
  setObrasFavoritas: (obrasFavoritas: string[]) => void;
  setObrasConcluidas: (obrasConcluidas: string[]) => void;
}) {
  async function alternarFavorito(obraId: string) {
    const logado = await usuarioTemSessaoAtiva();

    if (!logado) {
      avisarLoginRanking();
      return;
    }

    const obraRanking =
      ranking.find((obra) => {
        return obra.storageId === obraId || obra.id === obraId;
      }) || null;

    const obraVaiFicarFavorita = obraRanking
      ? !listaTemRankingObra(obraRanking, obrasFavoritas)
      : !obrasFavoritas.includes(obraId);

    const novasObrasFavoritas = obraRanking
      ? obraVaiFicarFavorita
        ? adicionarRankingObraNaLista(obraRanking, obrasFavoritas)
        : removerRankingObraDaLista(obraRanking, obrasFavoritas)
      : obraVaiFicarFavorita
        ? normalizarListaIdsEmAlta([...obrasFavoritas, obraId])
        : obrasFavoritas.filter((id) => id !== obraId);

    salvarListaIdsLocalEmAlta(
      FAVORITES_STORAGE_KEY,
      usuarioLogadoId,
      novasObrasFavoritas,
    );

    setObrasFavoritas(novasObrasFavoritas);

    void sincronizarColecaoRankingSupabase(
      "favoritos",
      obraRanking,
      obraVaiFicarFavorita,
    );

    if (obraVaiFicarFavorita) {
      void registrarColecaoRankingNoDiario("favoritou_obra", obraRanking);
    }
  }

  async function alternarConcluido(obraId: string) {
    const logado = await usuarioTemSessaoAtiva();

    if (!logado) {
      avisarLoginRanking();
      return;
    }

    const obraRanking =
      ranking.find((obra) => {
        return obra.storageId === obraId || obra.id === obraId;
      }) || null;

    const obraVaiFicarConcluida = obraRanking
      ? !listaTemRankingObra(obraRanking, obrasConcluidas)
      : !obrasConcluidas.includes(obraId);

    const novasObrasConcluidas = obraRanking
      ? obraVaiFicarConcluida
        ? adicionarRankingObraNaLista(obraRanking, obrasConcluidas)
        : removerRankingObraDaLista(obraRanking, obrasConcluidas)
      : obraVaiFicarConcluida
        ? normalizarListaIdsEmAlta([...obrasConcluidas, obraId])
        : obrasConcluidas.filter((id) => id !== obraId);

    salvarListaIdsLocalEmAlta(
      COMPLETED_STORAGE_KEY,
      usuarioLogadoId,
      novasObrasConcluidas,
    );

    setObrasConcluidas(novasObrasConcluidas);

    void sincronizarColecaoRankingSupabase(
      "concluidas",
      obraRanking,
      obraVaiFicarConcluida,
    );

    if (obraVaiFicarConcluida) {
      void registrarColecaoRankingNoDiario("concluiu_obra", obraRanking);
    }
  }

  return { alternarFavorito, alternarConcluido };
}
