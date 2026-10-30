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

  setObras:
    (obras: ObraLocal[]) => void;
};

export function criarAcoesObraLocalLeitor({
  obras,
  obraAtual,
  capituloAtual,
  usuarioIdLogado,
  setObras,
}: CriarAcoesObraLocalLeitorProps) {
  function salvarObras(
    novasObras: ObraLocal[],
  ) {
    const obrasNormalizadas =
      normalizarObrasLeitor(
        novasObras,
      );

    salvarObrasPreservandoContas(
      obrasNormalizadas,
      usuarioIdLogado,
    );

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
