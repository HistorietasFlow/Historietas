import { criarSlugBase, normalizarTexto } from "../../lib/utils";

type ObraComIdentificadoresHome = {
  id?: string;
  slug?: string;
  titulo: string;
};

type ObraLocalComIdentificadoresHome = {
  id: string;
  slug: string;
  titulo: string;
};

export function obterIdentificadorFavoritoHome(obra: ObraComIdentificadoresHome) {
  return (
    obra.id?.trim() ||
    obra.slug?.trim() ||
    criarSlugBase(obra.titulo)
  );
}

export function criarFavoritosNormalizadosHome(obrasFavoritas: string[]) {
  return new Set(
    obrasFavoritas
      .map((favorito) => favorito.trim())
      .filter(Boolean)
  );
}

export function normalizarListaIdsHome(lista: string[]) {
  return Array.from(
    new Set(
      lista
        .map((item) => item.trim())
        .filter((item) => Boolean(item))
    )
  );
}

export function criarIdentificadoresObraLocalHome(
  obra: ObraLocalComIdentificadoresHome
) {
  return normalizarListaIdsHome([
    obra.id,
    obra.slug,
    criarSlugBase(obra.titulo),
    normalizarTexto(obra.titulo),
  ]);
}

export function criarIdentificadoresObraCatalogoHome(
  obra: ObraComIdentificadoresHome
) {
  return normalizarListaIdsHome([
    obra.id?.trim() || "",
    obra.slug?.trim() || "",
    criarSlugBase(obra.titulo),
    normalizarTexto(obra.titulo),
  ]);
}

export function colecaoTemIdentificadorHome(identificadores: string[], colecao: string[]) {
  const colecaoNormalizada = criarFavoritosNormalizadosHome(colecao);

  return identificadores.some((identificador) =>
    colecaoNormalizada.has(identificador)
  );
}

export function removerIdentificadoresDaListaHome(lista: string[], identificadores: string[]) {
  const identificadoresParaRemover = new Set(identificadores);

  return normalizarListaIdsHome(
    lista.filter((item) => !identificadoresParaRemover.has(item.trim()))
  );
}

export function obraLocalEstaNaMinhaLista(
  obra: ObraLocalComIdentificadoresHome,
  obrasFavoritas: string[]
) {
  return colecaoTemIdentificadorHome(
    criarIdentificadoresObraLocalHome(obra),
    obrasFavoritas
  );
}

export function obraCatalogoEstaNaMinhaLista(
  obra: ObraComIdentificadoresHome,
  obrasFavoritas: string[]
) {
  return colecaoTemIdentificadorHome(
    criarIdentificadoresObraCatalogoHome(obra),
    obrasFavoritas
  );
}
