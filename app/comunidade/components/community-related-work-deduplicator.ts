import { normalizarTexto } from "../../../lib/utils";
import type { ObraRelacionadaSugestao } from "./community-related-work-suggestion";

export function removerSugestoesObrasDuplicadas(obrasBase: ObraRelacionadaSugestao[]) {
  const titulosRegistrados = new Set<string>();

  return obrasBase.filter((obra) => {
    const chaveTitulo = normalizarTexto(obra.titulo);

    if (!chaveTitulo || titulosRegistrados.has(chaveTitulo)) {
      return false;
    }

    titulosRegistrados.add(chaveTitulo);
    return true;
  });
}

