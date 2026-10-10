import { criarSlugBase } from "../../../lib/utils";

type ObraPainelAutor = {
  id: string;
  slug: string;
  titulo: string;
};

export function mesclarObrasPainelAutor<T extends ObraPainelAutor>(
  obrasLocais: T[],
  obrasSupabase: T[]
) {
  const obrasMescladas: T[] = [...obrasLocais];

  obrasSupabase.forEach((obraSupabase) => {
    const indiceExistente = obrasMescladas.findIndex((obraLocal) => {
      const slugLocal = obraLocal.slug || criarSlugBase(obraLocal.titulo);
      const slugSupabase = obraSupabase.slug || criarSlugBase(obraSupabase.titulo);

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
