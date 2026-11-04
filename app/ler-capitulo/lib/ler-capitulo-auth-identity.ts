import type { ObraLocal } from "./ler-capitulo-work-normalization";

export type IdentidadeAutenticadaLeitor = {
  usuarioId: string;
  versao: number;
};

type ResultadoAtualizacaoIdentidadeLeitor = {
  identidade: IdentidadeAutenticadaLeitor;
  mudou: boolean;
};

type ExecucaoAutenticacaoLeitor = {
  cancelada: boolean;
  versaoEsperada: number;
  versaoAtual: number;
};

type ExecucaoIdentidadeLeitor = {
  cancelada: boolean;
  identidadeEsperada: IdentidadeAutenticadaLeitor;
  identidadeAtual: IdentidadeAutenticadaLeitor;
};

export function atualizarIdentidadeAutenticadaLeitor(
  identidadeAtual: IdentidadeAutenticadaLeitor,
  usuarioId: string,
): ResultadoAtualizacaoIdentidadeLeitor {
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

export function execucaoAutenticacaoLeitorEstaAtual({
  cancelada,
  versaoEsperada,
  versaoAtual,
}: ExecucaoAutenticacaoLeitor) {
  return !cancelada && versaoEsperada === versaoAtual;
}

export function execucaoIdentidadeLeitorEstaAtual({
  cancelada,
  identidadeEsperada,
  identidadeAtual,
}: ExecucaoIdentidadeLeitor) {
  return (
    !cancelada &&
    identidadeEsperada.versao === identidadeAtual.versao &&
    identidadeEsperada.usuarioId === identidadeAtual.usuarioId
  );
}

export function removerEstadoUsuarioObrasLeitor(
  obras: ObraLocal[],
): ObraLocal[] {
  return obras
    .filter((obra) => obra.publicado)
    .map((obra) => ({
      ...obra,
      capitulos: obra.capitulos
        .filter((capitulo) => capitulo.publicado !== false)
        .map((capitulo) => ({
          ...capitulo,
          curtiu: false,
          salvo: false,
          comentario: "",
          lido: false,
          lidoEm: "",
        })),
      ultimoCapituloLidoId: "",
      ultimaLeituraEm: "",
      progressoLeitura: 0,
    }));
}
