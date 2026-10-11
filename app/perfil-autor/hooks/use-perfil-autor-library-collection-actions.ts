import type { ObraLocal } from "../types";
import {
  COMPLETED_STORAGE_KEY,
  FAVORITES_STORAGE_KEY,
  LIBRARY_FOLLOW_STORAGE_KEY,
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
  obrasSeguidasBiblioteca,
  usuarioIdLogado,
  avisarLoginNecessario,
  salvarObrasBibliotecaPerfil,
  setMensagemAcao,
  setObrasFavoritas,
  setObrasConcluidas,
  setObrasSeguidasBiblioteca,
  setVersaoSincronizacaoBiblioteca,
}: {
  obras: ObraLocal[];
  obrasFavoritas: string[];
  obrasConcluidas: string[];
  obrasSeguidasBiblioteca: string[];
  usuarioIdLogado: string;
  avisarLoginNecessario: (mensagem: string) => void;
  salvarObrasBibliotecaPerfil: (obras: ObraLocal[]) => void;
  setMensagemAcao: (mensagem: string) => void;
  setObrasFavoritas: (obras: string[]) => void;
  setObrasConcluidas: (obras: string[]) => void;
  setObrasSeguidasBiblioteca: (obras: string[]) => void;
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

  async function alternarSalvoCapituloBibliotecaPerfil(
    obraId: string,
    capituloId: string,
    ativo?: boolean,
  ) {
    setMensagemAcao("");

    const logado = await usuarioEstaLogado();

    if (!logado) {
      avisarLoginNecessario("Entre na sua conta para atualizar a Biblioteca.");
      return;
    }

    let proximoEstadoSalvo = false;

    const novasObras = obras.map((obra) => {
      if (obra.id !== obraId) {
        return obra;
      }

      return {
        ...obra,
        capitulos: obra.capitulos.map((capitulo) => {
          if (capitulo.id !== capituloId) {
            return capitulo;
          }

          proximoEstadoSalvo =
            typeof ativo === "boolean" ? ativo : !capitulo.salvo;

          return {
            ...capitulo,
            salvo: proximoEstadoSalvo,
          };
        }),
      };
    });

    salvarObrasBibliotecaPerfil(novasObras);

    void sincronizarTabelaUsuario(
      "salvos_capitulos",
      capituloId,
      proximoEstadoSalvo,
      "privado",
    );

    setMensagemAcao(
      proximoEstadoSalvo
        ? "Capítulo salvo na Biblioteca."
        : "Capítulo removido dos salvos.",
    );
  }

  async function alternarObraSeguindoBibliotecaPerfil(obra: ObraLocal, ativo?: boolean) {
    setMensagemAcao("");

    const logado = await usuarioEstaLogado();

    if (!logado) {
      avisarLoginNecessario("Entre na sua conta para atualizar a Biblioteca.");
      return;
    }

    const jaSegue = colecaoTemObraPerfilBiblioteca(obrasSeguidasBiblioteca, obra);
    const proximoEstadoSeguindo = typeof ativo === "boolean" ? ativo : !jaSegue;
    const listaAtualizada = proximoEstadoSeguindo
      ? Array.from(new Set([...obrasSeguidasBiblioteca, obra.id]))
      : removerObraDaColecaoPerfilBiblioteca(obrasSeguidasBiblioteca, obra);

    salvarListaIdsPerfilBiblioteca(
      LIBRARY_FOLLOW_STORAGE_KEY,
      usuarioIdLogado,
      listaAtualizada,
    );
    setObrasSeguidasBiblioteca(listaAtualizada);

    await sincronizarTabelaUsuario(
      "seguindo_obras",
      obra.id,
      proximoEstadoSeguindo,
      "publico",
    );
    setVersaoSincronizacaoBiblioteca((versaoAtual) => versaoAtual + 1);

    setMensagemAcao(
      proximoEstadoSeguindo
        ? "Obra adicionada ao Quero ler."
        : "Obra removida do Quero ler.",
    );
  }

  return {
    alternarFavoritoObra,
    alternarConcluidoObra,
    alternarSalvoCapituloBibliotecaPerfil,
    alternarObraSeguindoBibliotecaPerfil,
  };
}
