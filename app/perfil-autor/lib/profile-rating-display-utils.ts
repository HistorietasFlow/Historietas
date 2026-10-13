import type {
  AutorPerfil,
  AvaliacaoAutorPublica,
  AvaliacaoDiarioPublica,
} from "../types";

export function obterEstadoAvaliacaoPerfilAutor({
  perfilParaMostrar,
  podeEditarPerfil,
  avaliacaoAutor,
  avaliacaoDiario,
}: {
  perfilParaMostrar: AutorPerfil | null;
  podeEditarPerfil: boolean;
  avaliacaoAutor: AvaliacaoAutorPublica;
  avaliacaoDiario: AvaliacaoDiarioPublica;
}) {
  const autorPodeReceberAvaliacao = Boolean(
    perfilParaMostrar && perfilParaMostrar.obras.length > 0,
  );
  const perfilUsaAvaliacaoDiario = Boolean(
    perfilParaMostrar && perfilParaMostrar.obras.length === 0,
  );
  const avaliacaoDiarioPrivada = Boolean(
    perfilUsaAvaliacaoDiario &&
      avaliacaoDiario.carregado &&
      !avaliacaoDiario.mostrar,
  );
  const avaliacaoDiarioResumoVisivel = Boolean(
    perfilUsaAvaliacaoDiario &&
      (avaliacaoDiarioPrivada ||
        podeEditarPerfil ||
        avaliacaoDiario.visivel),
  );

  return {
    autorPodeReceberAvaliacao,
    perfilUsaAvaliacaoDiario,
    avaliacaoDiarioPrivada,
    avaliacaoDiarioResumoVisivel,
    avaliacaoResumoPerfilVisivel:
      autorPodeReceberAvaliacao || avaliacaoDiarioResumoVisivel,
    avaliacaoResumoPerfil: autorPodeReceberAvaliacao
      ? avaliacaoAutor
      : avaliacaoDiario,
    avaliacaoResumoEhDiario: !autorPodeReceberAvaliacao,
  };
}


export function obterVisibilidadeAcoesAvaliacaoPerfilAutor({
  autenticacaoCarregada,
  autorPodeReceberAvaliacao,
  perfilUsaAvaliacaoDiario,
  podeEditarPerfil,
  avaliacaoDiarioVisivel,
  avaliacaoDiarioPodeAvaliar,
}: {
  autenticacaoCarregada: boolean;
  autorPodeReceberAvaliacao: boolean;
  perfilUsaAvaliacaoDiario: boolean;
  podeEditarPerfil: boolean;
  avaliacaoDiarioVisivel: boolean;
  avaliacaoDiarioPodeAvaliar: boolean;
}) {
  return {
    avaliacaoAutorAcaoVisivel:
      autenticacaoCarregada &&
      autorPodeReceberAvaliacao &&
      !podeEditarPerfil,
    avaliacaoDiarioAcaoVisivel:
      autenticacaoCarregada &&
      perfilUsaAvaliacaoDiario &&
      !podeEditarPerfil &&
      avaliacaoDiarioVisivel &&
      avaliacaoDiarioPodeAvaliar,
  };
}
