export type IdentidadeAutenticadaObra = {
  usuarioId: string;
  versao: number;
};

type ResultadoAtualizacaoIdentidadeObra = {
  identidade: IdentidadeAutenticadaObra;
  mudou: boolean;
};

type ExecucaoAutenticacaoObra = {
  cancelada: boolean;
  versaoEsperada: number;
  versaoAtual: number;
};

type ExecucaoIdentidadeObra = {
  cancelada: boolean;
  identidadeEsperada: IdentidadeAutenticadaObra;
  identidadeAtual: IdentidadeAutenticadaObra;
};

export function atualizarIdentidadeAutenticadaObra(
  identidadeAtual: IdentidadeAutenticadaObra,
  usuarioId: string,
): ResultadoAtualizacaoIdentidadeObra {
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

export function execucaoAutenticacaoObraEstaAtual({
  cancelada,
  versaoEsperada,
  versaoAtual,
}: ExecucaoAutenticacaoObra) {
  return !cancelada && versaoEsperada === versaoAtual;
}

export function execucaoIdentidadeObraEstaAtual({
  cancelada,
  identidadeEsperada,
  identidadeAtual,
}: ExecucaoIdentidadeObra) {
  return (
    !cancelada &&
    identidadeEsperada.versao === identidadeAtual.versao &&
    identidadeEsperada.usuarioId === identidadeAtual.usuarioId
  );
}
