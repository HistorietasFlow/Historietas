import { criarSlugBase, normalizarTexto } from "../../../lib/utils";
import type { ObraRelacionadaSugestao } from "./community-related-work-suggestion";

export function criarLinkObraRelacionada(
  titulo: string,
  sugestoesObras: ObraRelacionadaSugestao[] = []
) {
  const tituloNormalizado = normalizarTexto(titulo);
  const obraRelacionada = sugestoesObras.find((obra) => {
    return normalizarTexto(obra.titulo) === tituloNormalizado;
  });

  if (obraRelacionada?.link?.trim()) {
    return obraRelacionada.link.trim();
  }

  if (obraRelacionada?.slug?.trim()) {
    return `/obra/${obraRelacionada.slug.trim()}`;
  }

  return `/obra/${criarSlugBase(titulo)}`;
}

