import { supabase } from "../../../lib/supabase/client";
import { idObraSupabaseValido } from "../../../lib/utils";
import type { AbaBibliotecaPerfil, ItemBibliotecaPerfil, ObraLocal } from "../types";
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
  abaBibliotecaPerfil,
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
  abaBibliotecaPerfil: AbaBibliotecaPerfil;
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

  async function removerHistoricoLeituraBibliotecaPerfil(obra: ObraLocal) {
    setMensagemAcao("");

    const logado = await usuarioEstaLogado();

    if (!logado) {
      avisarLoginNecessario("Entre na sua conta para limpar o histórico.");
      return;
    }

    const novasObras = obras.map((obraAtual) => {
      if (obraAtual.id !== obra.id) {
        return obraAtual;
      }

      return {
        ...obraAtual,
        ultimoCapituloLidoId: "",
        ultimaLeituraEm: "",
        progressoLeitura: 0,
        capitulos: obraAtual.capitulos.map((capitulo) => ({
          ...capitulo,
          lido: false,
          lidoEm: "",
        })),
      };
    });

    salvarObrasBibliotecaPerfil(novasObras);

    try {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id || usuarioIdLogado;

      if (userId && idObraSupabaseValido(obra.id)) {
        await Promise.all([
          supabase
            .from("progresso_leitura")
            .delete()
            .eq("user_id", userId)
            .eq("obra_id", obra.id),
          supabase
            .from("diario_atividades")
            .delete()
            .eq("user_id", userId)
            .eq("obra_id", obra.id)
            .in("tipo", ["comecou_ler", "leu_capitulo"]),
        ]);
      }
    } catch (error) {
      console.warn("Não consegui limpar o histórico remoto da obra:", error);
    }

    setVersaoSincronizacaoBiblioteca((versaoAtual) => versaoAtual + 1);
    setMensagemAcao("Histórico de leitura removido.");
  }

  async function removerItemBibliotecaPerfil(item: ItemBibliotecaPerfil) {
    if (
      item.capitulo?.salvo &&
      (abaBibliotecaPerfil === "tudo" || abaBibliotecaPerfil === "salvos")
    ) {
      await alternarSalvoCapituloBibliotecaPerfil(
        item.obra.id,
        item.capitulo.id,
        false,
      );
      return;
    }

    if (
      abaBibliotecaPerfil === "tudo" &&
      item.tipoDiario === "quero_ler" &&
      colecaoTemObraPerfilBiblioteca(obrasSeguidasBiblioteca, item.obra)
    ) {
      await alternarObraSeguindoBibliotecaPerfil(item.obra, false);
      return;
    }

    if (
      abaBibliotecaPerfil === "tudo" &&
      item.tipoDiario === "favorita" &&
      colecaoTemObraPerfilBiblioteca(obrasFavoritas, item.obra)
    ) {
      await alternarFavoritoObra(item.obra.id);
      return;
    }

    if (
      abaBibliotecaPerfil === "tudo" &&
      item.tipoDiario === "concluida" &&
      colecaoTemObraPerfilBiblioteca(obrasConcluidas, item.obra)
    ) {
      await alternarConcluidoObra(item.obra.id);
      return;
    }

    if (abaBibliotecaPerfil === "quero-ler") {
      await alternarObraSeguindoBibliotecaPerfil(item.obra, false);
      return;
    }

    if (abaBibliotecaPerfil === "favoritas") {
      if (colecaoTemObraPerfilBiblioteca(obrasFavoritas, item.obra)) {
        await alternarFavoritoObra(item.obra.id);
      }
      return;
    }

    if (abaBibliotecaPerfil === "concluidas") {
      if (colecaoTemObraPerfilBiblioteca(obrasConcluidas, item.obra)) {
        await alternarConcluidoObra(item.obra.id);
      }
      return;
    }

    if (abaBibliotecaPerfil === "salvos" && item.capitulo) {
      await alternarSalvoCapituloBibliotecaPerfil(
        item.obra.id,
        item.capitulo.id,
        false,
      );
      return;
    }

    await removerHistoricoLeituraBibliotecaPerfil(item.obra);
  }

  return {
    alternarFavoritoObra,
    alternarConcluidoObra,
    alternarSalvoCapituloBibliotecaPerfil,
    alternarObraSeguindoBibliotecaPerfil,
    removerItemBibliotecaPerfil,
  };
}
