import { obterIdentificadoresObraTop5 } from "./top5-work-identifiers";
import type { ObraTop5 } from "./top5-types";

export function criarMapaObrasTop5(
  obras: ObraTop5[],
) {
  const mapa = new Map<string, ObraTop5>();

  obras.forEach((obra) => {
    obterIdentificadoresObraTop5(obra).forEach(
      (chave) => {
        mapa.set(chave, obra);
      },
    );
  });

  return mapa;
}

export function selecionarObrasTop5(
  idsSelecionados: string[],
  obrasPorChave: Map<string, ObraTop5>,
) {
  return idsSelecionados
    .map((id) => obrasPorChave.get(id))
    .filter(
      (obra): obra is ObraTop5 =>
        Boolean(obra),
    );
}
