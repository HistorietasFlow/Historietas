import type {
  AutorPerfil,
  AvaliacaoAutorPublica,
  AvaliacaoDiarioPublica,
} from "../types";
import {
  obterEstadoAvaliacaoPerfilAutor,
  obterVisibilidadeAcoesAvaliacaoPerfilAutor,
} from "./profile-rating-display-utils";

export function obterEstadoVisualAvaliacaoPerfilAutor({
  perfilParaMostrar,
  podeEditarPerfil,
  avaliacaoAutor,
  avaliacaoDiario,
  autenticacaoCarregada,
}: {
  perfilParaMostrar: AutorPerfil | null;
  podeEditarPerfil: boolean;
  avaliacaoAutor: AvaliacaoAutorPublica;
  avaliacaoDiario: AvaliacaoDiarioPublica;
  autenticacaoCarregada: boolean;
}) {
  const {
    autorPodeReceberAvaliacao,
    perfilUsaAvaliacaoDiario,
    avaliacaoDiarioPrivada,
    avaliacaoResumoPerfilVisivel,
    avaliacaoResumoPerfil,
    avaliacaoResumoEhDiario,
  } = obterEstadoAvaliacaoPerfilAutor({
    perfilParaMostrar,
    podeEditarPerfil,
    avaliacaoAutor,
    avaliacaoDiario,
  });
  const {
    avaliacaoAutorAcaoVisivel,
    avaliacaoDiarioAcaoVisivel,
  } = obterVisibilidadeAcoesAvaliacaoPerfilAutor({
    autenticacaoCarregada,
    autorPodeReceberAvaliacao,
    perfilUsaAvaliacaoDiario,
    podeEditarPerfil,
    avaliacaoDiarioVisivel: avaliacaoDiario.visivel,
    avaliacaoDiarioPodeAvaliar: avaliacaoDiario.podeAvaliar,
  });

  return {
    autorPodeReceberAvaliacao,
    perfilUsaAvaliacaoDiario,
    avaliacaoDiarioPrivada,
    avaliacaoResumoPerfilVisivel,
    avaliacaoResumoPerfil,
    avaliacaoResumoEhDiario,
    avaliacaoAutorAcaoVisivel,
    avaliacaoDiarioAcaoVisivel,
  };
}
