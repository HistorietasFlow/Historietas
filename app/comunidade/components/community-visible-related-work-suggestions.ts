import { normalizarTexto } from "../../../lib/utils";
import type { ObraRelacionadaSugestao } from "./community-related-work-suggestion";

export function obterSugestoesObrasRelacionadasVisiveisComunidade(
  obraRelacionadaBusca: string,
  obrasRelacionadasSugestoes: ObraRelacionadaSugestao[]
) {
  const buscaNormalizada = normalizarTexto(obraRelacionadaBusca);

  if (!buscaNormalizada) {
    return [];
  }

  return obrasRelacionadasSugestoes
    .filter((obra) => {
      const tituloObra = normalizarTexto(obra.titulo);

      return tituloObra.startsWith(buscaNormalizada);
    })
    .slice(0, 8);
}
