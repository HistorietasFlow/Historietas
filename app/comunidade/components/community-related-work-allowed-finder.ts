import { normalizarTexto } from "../../../lib/utils";
import type { ObraRelacionadaSugestao } from "./community-related-work-suggestion";

export function obterObraRelacionadaPermitida(
  titulo: string,
  sugestoesObras: ObraRelacionadaSugestao[]
) {
  const tituloNormalizado = normalizarTexto(titulo);

  if (!tituloNormalizado) {
    return null;
  }

  return (
    sugestoesObras.find((obra) => {
      return normalizarTexto(obra.titulo) === tituloNormalizado;
    }) || null
  );
}
