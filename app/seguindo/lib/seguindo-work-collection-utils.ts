import { criarSlugBase, normalizarTexto } from "../../../lib/utils";
import { normalizarListaTexto } from "./seguindo-format-utils";

type ObraColecaoSeguindo = {
  id: string;
  titulo: string;
  slug: string;
  link: string;
};

export function criarChavesObra(obra: ObraColecaoSeguindo) {
  return normalizarListaTexto([
    obra.id,
    obra.slug,
    criarSlugBase(obra.titulo),
    normalizarTexto(obra.titulo),
    obra.link,
  ]);
}

export function obraEstaNaLista(
  obra: ObraColecaoSeguindo,
  lista: string[],
) {
  const listaNormalizada = new Set(normalizarListaTexto(lista));

  return criarChavesObra(obra).some((chave) =>
    listaNormalizada.has(chave),
  );
}

export function removerObraDaLista(
  obra: ObraColecaoSeguindo,
  lista: string[],
) {
  const chavesParaRemover = new Set(criarChavesObra(obra));

  return normalizarListaTexto(lista).filter(
    (item) => !chavesParaRemover.has(item),
  );
}
