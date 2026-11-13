import { criarSlugBase } from "../../../lib/utils";

type ObraPainelAutor = {
  id: string;
  slug: string;
  titulo: string;
  capitulos?: { id: string }[];
  arquivoObra?: unknown;
};

export function mesclarObrasPainelAutor<T extends ObraPainelAutor>(
  obrasLocais: T[],
  obrasSupabase: T[]
) {
  const obrasMescladas: T[] = [];

  [...obrasLocais, ...obrasSupabase].forEach((obraSupabase, indice) => {
    const indiceExistente = obrasMescladas.findIndex((obraLocal) => {
      const slugLocal = obraLocal.slug || criarSlugBase(obraLocal.titulo);
      const slugSupabase = obraSupabase.slug || criarSlugBase(obraSupabase.titulo);

      return Boolean(obraLocal.id && obraLocal.id === obraSupabase.id) ||
        ((!obraLocal.id || !obraSupabase.id) && slugLocal === slugSupabase);
    });

    if (indiceExistente >= 0) {
      const existente = obrasMescladas[indiceExistente];
      const mesclada = {
        ...existente,
        ...obraSupabase,
      };
      if (existente.capitulos && obraSupabase.capitulos) {
        const capitulos = new Map(obraSupabase.capitulos.map(capitulo => [capitulo.id, capitulo]));
        existente.capitulos.forEach(capitulo => {
          if (!capitulos.has(capitulo.id)) capitulos.set(capitulo.id, capitulo);
        });
        mesclada.capitulos = [...capitulos.values()];
      }
      if (existente.arquivoObra && !obraSupabase.arquivoObra) mesclada.arquivoObra = existente.arquivoObra;
      obrasMescladas[indiceExistente] = mesclada;
      return;
    }

    if (indice < obrasLocais.length) obrasMescladas.push(obraSupabase);
    else obrasMescladas.unshift(obraSupabase);
  });

  return obrasMescladas;
}
