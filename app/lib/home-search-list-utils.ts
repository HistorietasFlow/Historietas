import { normalizarTexto } from "../../lib/utils";
import { obraLocalCombinaBusca } from "./home-discovery-utils";
import { formatarGeneroHome } from "./home-metadata-utils";

type CapituloBuscaObrasPublicadasHome = {
  titulo: string;
};

type ObraPublicadaBuscaHome = {
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capaNome: string;
  capitulos: CapituloBuscaObrasPublicadasHome[];
  criadaEm: string;
};

type ObraCatalogoBuscaHome = {
  titulo: string;
  autor: string;
  genero: string;
  classificacaoIndicativa: string;
  status: string;
};

export function criarObrasPublicadasFiltradasHome<T extends ObraPublicadaBuscaHome>(
  obrasPublicadas: T[],
  termoBusca: string
) {
  return obrasPublicadas
    .filter((obra) => obraLocalCombinaBusca(obra, termoBusca))
    .sort((obraA, obraB) => {
      const dataA = new Date(obraA.criadaEm).getTime();
      const dataB = new Date(obraB.criadaEm).getTime();

      return (
        (Number.isNaN(dataB) ? 0 : dataB) -
        (Number.isNaN(dataA) ? 0 : dataA)
      );
    });
}

export function criarObrasCatalogoFiltradasHome<T extends ObraCatalogoBuscaHome>(
  obrasCatalogo: T[],
  termoBusca: string
) {
  if (!termoBusca) {
    return obrasCatalogo;
  }

  return obrasCatalogo.filter((obra) => {
    const textoObra = normalizarTexto(
      [
        obra.titulo,
        obra.autor,
        obra.genero,
        formatarGeneroHome(obra.genero),
        obra.classificacaoIndicativa,
        obra.status,
      ].join(" ")
    );

    return textoObra.includes(termoBusca);
  });
}
