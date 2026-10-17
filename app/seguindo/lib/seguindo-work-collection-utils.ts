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

export function mesclarObrasSeguindo<
  T extends { id: string; titulo: string; slug: string },
>(obrasLocais: T[], obrasSupabase: T[]) {
  const obrasMescladas: T[] = [...obrasLocais];

  obrasSupabase.forEach((obraSupabase) => {
    const indiceExistente = obrasMescladas.findIndex((obraLocal) => {
      const slugLocal = obraLocal.slug || criarSlugBase(obraLocal.titulo);
      const slugSupabase =
        obraSupabase.slug || criarSlugBase(obraSupabase.titulo);

      return obraLocal.id === obraSupabase.id || slugLocal === slugSupabase;
    });

    if (indiceExistente >= 0) {
      obrasMescladas[indiceExistente] = {
        ...obrasMescladas[indiceExistente],
        ...obraSupabase,
      };
      return;
    }

    obrasMescladas.unshift(obraSupabase);
  });

  return obrasMescladas;
}

export function encontrarObraLocalSeguindo<
  T extends { id: string; titulo: string; slug: string },
>(
  obrasLocais: T[],
  obraBanco: { id: string; titulo: string | null; slug: string | null },
) {
  const slugBanco =
    obraBanco.slug?.trim() || criarSlugBase(obraBanco.titulo || "");

  return obrasLocais.find((obraAtual) => {
    const slugLocal = obraAtual.slug || criarSlugBase(obraAtual.titulo);

    return obraAtual.id === obraBanco.id || slugLocal === slugBanco;
  });
}

export function mesclarIdsColecaoSeguindo(
  listaLocal: string[],
  listaRemota: Iterable<string>,
) {
  return Array.from(new Set([...listaLocal, ...listaRemota]));
}

export function criarResultadoColecoesSeguindo<T>({
  obras,
  obrasSeguidasLocais,
  obrasFavoritasLocais,
  obrasConcluidasLocais,
  obrasSeguidasRemotas = [],
  obrasFavoritasRemotas = [],
  obrasConcluidasRemotas = [],
}: {
  obras: T[];
  obrasSeguidasLocais: string[];
  obrasFavoritasLocais: string[];
  obrasConcluidasLocais: string[];
  obrasSeguidasRemotas?: Iterable<string>;
  obrasFavoritasRemotas?: Iterable<string>;
  obrasConcluidasRemotas?: Iterable<string>;
}) {
  return {
    obras,
    obrasSeguidas: mesclarIdsColecaoSeguindo(
      obrasSeguidasLocais,
      obrasSeguidasRemotas,
    ),
    obrasFavoritas: mesclarIdsColecaoSeguindo(
      obrasFavoritasLocais,
      obrasFavoritasRemotas,
    ),
    obrasConcluidas: mesclarIdsColecaoSeguindo(
      obrasConcluidasLocais,
      obrasConcluidasRemotas,
    ),
  };
}

export function finalizarObrasSeguindo<T extends {
  id: string;
  titulo: string;
  slug: string;
}>({
  obrasLocais,
  obrasRemotas,
  obrasSeguidasLocais,
  obrasFavoritasLocais,
  obrasConcluidasLocais,
  obrasSeguidasRemotas,
  obrasFavoritasRemotas,
  obrasConcluidasRemotas,
}: {
  obrasLocais: T[];
  obrasRemotas: T[];
  obrasSeguidasLocais: string[];
  obrasFavoritasLocais: string[];
  obrasConcluidasLocais: string[];
  obrasSeguidasRemotas: Iterable<string>;
  obrasFavoritasRemotas: Iterable<string>;
  obrasConcluidasRemotas: Iterable<string>;
}) {
  return criarResultadoColecoesSeguindo({
    obras: mesclarObrasSeguindo(obrasLocais, obrasRemotas),
    obrasSeguidasLocais,
    obrasFavoritasLocais,
    obrasConcluidasLocais,
    obrasSeguidasRemotas,
    obrasFavoritasRemotas,
    obrasConcluidasRemotas,
  });
}
