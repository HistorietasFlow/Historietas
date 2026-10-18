import { ehClassificacao18 } from "../../../lib/historietasAdultContent";
import { obraEstaNaLista } from "./seguindo-work-collection-utils";
import type { ObraLocal } from "./seguindo-page-types";

export function filtrarObrasVisiveisSeguindo(obras: ObraLocal[]): ObraLocal[] {
  return obras.filter(
    (obra) => !ehClassificacao18(obra.classificacaoIndicativa),
  );
}

export function filtrarObrasSeguidasBase(
  obrasVisiveisSeguindo: ObraLocal[],
  obrasSeguidas: string[],
): ObraLocal[] {
  return obrasVisiveisSeguindo.filter((obra) =>
    obraEstaNaLista(obra, obrasSeguidas),
  );
}
