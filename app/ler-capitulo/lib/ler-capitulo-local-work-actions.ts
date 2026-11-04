import {
  salvarObrasPreservandoContas,
} from "./ler-capitulo-local-storage";

import {
  atualizarCapituloNasObrasLeitor,
  normalizarObrasLeitor,
} from "./ler-capitulo-local-work-mutations";

import type {
  CapituloLocal,
  ObraLocal,
} from "./ler-capitulo-work-normalization";

type CriarAcoesObraLocalLeitorProps = {
  obras: ObraLocal[];
  obraAtual: ObraLocal | null;
  capituloAtual: CapituloLocal | null;
  usuarioIdLogado: string;
  execucaoIdentidadeAcaoEstaAtual: () => boolean;

  setObras:
    (obras: ObraLocal[]) => void;
};

export function criarAcoesObraLocalLeitor({
  obras,
  obraAtual,
  capituloAtual,
  usuarioIdLogado,
  execucaoIdentidadeAcaoEstaAtual,
  setObras,
}: CriarAcoesObraLocalLeitorProps) {
  function salvarObras(
    novasObras: ObraLocal[],
  ) {
    if (!execucaoIdentidadeAcaoEstaAtual()) {
      return;
    }

    const obrasNormalizadas =
      normalizarObrasLeitor(
        novasObras,
      );

    salvarObrasPreservandoContas(
      obrasNormalizadas,
      usuarioIdLogado,
    );

    if (!execucaoIdentidadeAcaoEstaAtual()) {
      return;
    }

    setObras(
      obrasNormalizadas,
    );
  }

  function atualizarCapitulo(
    dados: Partial<CapituloLocal>,
  ) {
    if (
      !obraAtual ||
      !capituloAtual
    ) {
      return;
    }

    const novasObras =
      atualizarCapituloNasObrasLeitor({
        obras,
        obraAtualId:
          obraAtual.id,
        capituloAtualId:
          capituloAtual.id,
        dados,
      });

    salvarObras(novasObras);
  }

  return {
    salvarObras,
    atualizarCapitulo,
  };
}
