import type { ObraLocal } from "../types";
import {
  obterDadosCurtidaTopFivePerfilAutor,
  obterMensagemTopFiveVazioPerfilAutor,
  obterObrasDestaquePerfilAutor,
  obterVisibilidadeDestaquesPerfilAutor,
} from "./profile-work-display-utils";

export function obterEstadoVisualDestaquesPerfilAutor({
  topFiveObraIds,
  obras,
  obrasPerfil,
  perfilPertenceAoUsuario,
  obrasPerfilVisivel,
  podeEditarPerfil,
  mostrarDestaquesAutor,
  mostrarDestaquesVisitante,
  topFiveCurtidoPorMim,
  topFiveCurtidasTotal,
  perfilNome,
}: {
  topFiveObraIds: string[];
  obras: ObraLocal[];
  obrasPerfil: ObraLocal[];
  perfilPertenceAoUsuario: boolean;
  obrasPerfilVisivel: boolean;
  podeEditarPerfil: boolean;
  mostrarDestaquesAutor: boolean;
  mostrarDestaquesVisitante: boolean;
  topFiveCurtidoPorMim: boolean;
  topFiveCurtidasTotal: number;
  perfilNome: string;
}) {
  const obrasEmDestaque = obterObrasDestaquePerfilAutor({
    topFiveObraIds,
    obras,
    obrasPerfil,
    perfilPertenceAoUsuario,
  });
  const totalObrasEmDestaque = obrasEmDestaque.length;

  const {
    temObrasEmDestaque,
    exibirSecaoDestaques,
  } = obterVisibilidadeDestaquesPerfilAutor({
      obrasPerfilVisivel,
      podeEditarPerfil,
      mostrarDestaquesAutor,
      mostrarDestaquesVisitante,
      totalObrasEmDestaque,
    });

  const dadosCurtidaTopFive = obterDadosCurtidaTopFivePerfilAutor({
    curtido: topFiveCurtidoPorMim,
    totalCurtidas: topFiveCurtidasTotal,
  });
  const mensagemTopFiveVazio = obterMensagemTopFiveVazioPerfilAutor({
    podeEditarPerfil,
    nomePerfil: perfilNome,
  });

  return {
    obrasEmDestaque,
    totalObrasEmDestaque,
    temObrasEmDestaque,
    exibirSecaoDestaques,
    dadosCurtidaTopFive,
    mensagemTopFiveVazio,
  };
}
