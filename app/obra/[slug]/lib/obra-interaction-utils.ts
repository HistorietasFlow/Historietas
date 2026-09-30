import { criarSlugBase, normalizarTexto } from "../../../../lib/utils";

export function obterChavesInteracaoObraPublica(obra: {
  id: string;
  slug: string;
  link: string;
  titulo: string;
}) {
  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        obra.link,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ]
        .map((chave) => chave.trim())
        .filter(Boolean)
    )
  );
}
