import type { ObraLocal } from "../types";
import {
  COMPLETED_STORAGE_KEY,
  FAVORITES_STORAGE_KEY,
} from "../constants";
import {
  colecaoTemObraPerfilBiblioteca,
  removerObraDaColecaoPerfilBiblioteca,
} from "../lib/library-normalizers";
import { usuarioEstaLogado } from "../lib/profile-auth-session-utils";
import { salvarListaIdsPerfilBiblioteca } from "../lib/profile-local-storage-utils";
import { sincronizarTabelaUsuario } from "../lib/profile-user-collections-sync";

export function usePerfilAutorLibraryCollectionActions({
  obras,
  obrasFavoritas,
  obrasConcluidas,
  usuarioIdLogado,
  avisarLoginNecessario,
  setMensagemAcao,
  setObrasFavoritas,
  setObrasConcluidas,
  setVersaoSincronizacaoBiblioteca,
}: {
  obras: ObraLocal[];
  obrasFavoritas: string[];
  obrasConcluidas: string[];
  usuarioIdLogado: string;
  avisarLoginNecessario: (mensagem: string) => void;
  setMensagemAcao: (mensagem: string) => void;
  setObrasFavoritas: (obras: string[]) => void;
  setObrasConcluidas: (obras: string[]) => void;
  setVersaoSincronizacaoBiblioteca: (
    atualizar: (versaoAtual: number) => number,
  ) => void;
}) {
  async function alternarFavoritoObra(obraId: string) {
    setMensagemAcao("");

    const logado = await usuarioEstaLogado();

    if (!logado) {
      avisarLoginNecessario("Entre na sua conta para adicionar obras à lista.");
      return;
    }

    const obraAlvo = obras.find((obra) => obra.id === obraId) || null;
    const jaFavorita = obraAlvo
      ? colecaoTemObraPerfilBiblioteca(obrasFavoritas, obraAlvo)
      : obrasFavoritas.includes(obraId);
    const proximoEstadoFavorito = !jaFavorita;

    const novasObrasFavoritas = obraAlvo
      ? proximoEstadoFavorito
        ? Array.from(new Set([...obrasFavoritas, obraAlvo.id]))
        : removerObraDaColecaoPerfilBiblioteca(obrasFavoritas, obraAlvo)
      : proximoEstadoFavorito
        ? Array.from(new Set([...obrasFavoritas, obraId]))
        : obrasFavoritas.filter((id) => id !== obraId);

    salvarListaIdsPerfilBiblioteca(
      FAVORITES_STORAGE_KEY,
      usuarioIdLogado,
      novasObrasFavoritas,
    );

    setObrasFavoritas(novasObrasFavoritas);
    await sincronizarTabelaUsuario(
      "favoritos",
      obraId,
      proximoEstadoFavorito,
      "parcial",
    );
    setVersaoSincronizacaoBiblioteca((versaoAtual) => versaoAtual + 1);
  }

  async function alternarConcluidoObra(obraId: string) {
    setMensagemAcao("");

    const logado = await usuarioEstaLogado();

    if (!logado) {
      avisarLoginNecessario("Entre na sua conta para concluir obras.");
      return;
    }

    const obraAlvo = obras.find((obra) => obra.id === obraId) || null;
    const jaConcluida = obraAlvo
      ? colecaoTemObraPerfilBiblioteca(obrasConcluidas, obraAlvo)
      : obrasConcluidas.includes(obraId);
    const proximoEstadoConcluido = !jaConcluida;

    const novasObrasConcluidas = obraAlvo
      ? proximoEstadoConcluido
        ? Array.from(new Set([...obrasConcluidas, obraAlvo.id]))
        : removerObraDaColecaoPerfilBiblioteca(obrasConcluidas, obraAlvo)
      : proximoEstadoConcluido
        ? Array.from(new Set([...obrasConcluidas, obraId]))
        : obrasConcluidas.filter((id) => id !== obraId);

    salvarListaIdsPerfilBiblioteca(
      COMPLETED_STORAGE_KEY,
      usuarioIdLogado,
      novasObrasConcluidas,
    );

    setObrasConcluidas(novasObrasConcluidas);
    await sincronizarTabelaUsuario(
      "concluidas",
      obraId,
      proximoEstadoConcluido,
      "parcial",
    );
    setVersaoSincronizacaoBiblioteca((versaoAtual) => versaoAtual + 1);
  }

  return {
    alternarFavoritoObra,
    alternarConcluidoObra,
  };
}
