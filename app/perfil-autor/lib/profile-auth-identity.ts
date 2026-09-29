export type IdentidadeAutenticadaPerfilAutor = {
  usuarioId: string;
  versao: number;
};

type ResultadoAtualizacaoIdentidadePerfilAutor = {
  identidade: IdentidadeAutenticadaPerfilAutor;
  mudou: boolean;
};

type ExecucaoAutenticacaoPerfilAutor = {
  cancelada: boolean;
  versaoEsperada: number;
  versaoAtual: number;
};

type ExecucaoCarregamentoPerfilAutor = {
  cancelada: boolean;
  identidadeEsperada: IdentidadeAutenticadaPerfilAutor;
  identidadeAtual: IdentidadeAutenticadaPerfilAutor;
};

export function atualizarIdentidadeAutenticadaPerfilAutor(
  identidadeAtual: IdentidadeAutenticadaPerfilAutor,
  usuarioId: string,
): ResultadoAtualizacaoIdentidadePerfilAutor {
  if (identidadeAtual.usuarioId === usuarioId) {
    return {
      identidade: identidadeAtual,
      mudou: false,
    };
  }

  return {
    identidade: {
      usuarioId,
      versao: identidadeAtual.versao + 1,
    },
    mudou: true,
  };
}

export function execucaoAutenticacaoPerfilAutorEstaAtual({
  cancelada,
  versaoEsperada,
  versaoAtual,
}: ExecucaoAutenticacaoPerfilAutor) {
  return !cancelada && versaoEsperada === versaoAtual;
}

export function execucaoCarregamentoPerfilAutorEstaAtual({
  cancelada,
  identidadeEsperada,
  identidadeAtual,
}: ExecucaoCarregamentoPerfilAutor) {
  return (
    !cancelada &&
    identidadeEsperada.versao === identidadeAtual.versao &&
    identidadeEsperada.usuarioId === identidadeAtual.usuarioId
  );
}
