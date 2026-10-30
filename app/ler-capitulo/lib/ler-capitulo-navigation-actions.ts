import {
  criarHrefLeituraCapituloLeitor,
} from "./ler-capitulo-chapter-route";

import type {
  ObraLocal,
} from "./ler-capitulo-work-normalization";

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
      null,
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
