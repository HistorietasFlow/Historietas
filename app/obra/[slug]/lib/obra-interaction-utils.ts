import { criarSlugBase, normalizarTexto } from "../../../../lib/utils";
import { carregarListaLocalObraPublica } from "./obra-user-storage";

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

export function obraEstaEmListaLocalObraPublica(
  obra: {
    id: string;
    slug: string;
    link: string;
    titulo: string;
  },
  chaveStorage: string,
  userId = "",
) {
  const chavesObra = new Set(obterChavesInteracaoObraPublica(obra));

  return carregarListaLocalObraPublica(chaveStorage, userId).some((item) =>
    chavesObra.has(item.trim())
  );
}
