import {
  criarHrefLeituraCapituloLeitor,
} from "./ler-capitulo-chapter-route";

import type {
  ObraLocal,
} from "./ler-capitulo-work-normalization";

const CHAVE_IDENTIDADE_HISTORICO_LEITOR = "__historietasLeitorCapitulo";

type IdentidadeHistoricoLeitor = {
  obraId: string;
  capituloId: string;
};

export function criarEstadoHistoricoLeitor(
  estadoAtual: unknown,
  identidade: IdentidadeHistoricoLeitor,
) {
  const estadoBase =
    estadoAtual && typeof estadoAtual === "object" && !Array.isArray(estadoAtual)
      ? estadoAtual
      : {};

  return {
    ...estadoBase,
    [CHAVE_IDENTIDADE_HISTORICO_LEITOR]: identidade,
  };
}

export function obterIdentidadeHistoricoLeitor(
  estado: unknown,
): IdentidadeHistoricoLeitor | null {
  if (!estado || typeof estado !== "object" || Array.isArray(estado)) {
    return null;
  }

  const identidade = (estado as Record<string, unknown>)[
    CHAVE_IDENTIDADE_HISTORICO_LEITOR
  ];

  if (!identidade || typeof identidade !== "object" || Array.isArray(identidade)) {
    return null;
  }

  const { obraId, capituloId } = identidade as Record<string, unknown>;

  return typeof obraId === "string" && typeof capituloId === "string"
    ? { obraId, capituloId }
    : null;
}

type CriarAcaoTrocaCapituloLeitorProps = {
  obraAtual: ObraLocal | null;

  setCapituloId:
    (capituloId: string) => void;
};

export function criarAcaoTrocaCapituloLeitor({
  obraAtual,
  setCapituloId,
}: CriarAcaoTrocaCapituloLeitorProps) {
  function trocarCapitulo(
    novoCapituloId: string,
  ) {
    if (!obraAtual) {
      return;
    }

    setCapituloId(
      novoCapituloId,
    );

    window.history.pushState(
      // O Next copia seu estado interno ao receber uma navegação externa.
      // Repassar __NA faria o Next ignorar a atualização da URL canônica.
      criarEstadoHistoricoLeitor(null, {
        obraId: obraAtual.id,
        capituloId: novoCapituloId,
      }),
      "",
      criarHrefLeituraCapituloLeitor(
        obraAtual,
        novoCapituloId,
      ),
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return {
    trocarCapitulo,
  };
}
