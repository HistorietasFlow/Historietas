import {
  obraCatalogoCombinaBuscaHome,
  obraLocalCombinaBusca,
} from "./home-discovery-utils";
import {
  obraCatalogoEstaNaMinhaLista,
  obraLocalEstaNaMinhaLista,
} from "./home-collection-utils";
import {
  encontrarCapituloParaContinuar,
  obterTempoUltimaLeitura,
} from "./home-reading-utils";

type CapituloBibliotecaHome = {
  id: string;
  titulo: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
};

type ObraLocalBibliotecaHome = {
  id: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capaNome: string;
  capitulos: CapituloBibliotecaHome[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  slug: string;
};

type ObraCatalogoBibliotecaHome = {
  id?: string;
  titulo: string;
  autor: string;
  genero: string;
  classificacaoIndicativa: string;
  status: string;
  slug?: string;
};

export function criarObrasParaContinuarHome<T extends ObraLocalBibliotecaHome>(
  obrasPublicadas: T[],
  termoBusca: string,
  usuarioLogado: unknown
) {
  if (!usuarioLogado) {
    return [];
  }

  return obrasPublicadas
    .filter((obra) => {
      return (
        Boolean(encontrarCapituloParaContinuar(obra)) &&
        obraLocalCombinaBusca(obra, termoBusca)
      );
    })
    .sort((obraA, obraB) => {
      return obterTempoUltimaLeitura(obraB) - obterTempoUltimaLeitura(obraA);
    })
    .slice(0, 5);
}

export function criarObrasMinhaListaHome<T extends ObraLocalBibliotecaHome>(
  obrasPublicadas: T[],
  obrasFavoritas: string[],
  termoBusca: string,
  usuarioLogado: unknown
) {
  if (!usuarioLogado) {
    return [];
  }

  return obrasPublicadas
    .filter((obra) => {
      return (
        obraLocalEstaNaMinhaLista(obra, obrasFavoritas) &&
        obraLocalCombinaBusca(obra, termoBusca)
      );
    })
    .sort((obraA, obraB) => {
      const dataA = new Date(obraA.ultimaLeituraEm || obraA.criadaEm).getTime();
      const dataB = new Date(obraB.ultimaLeituraEm || obraB.criadaEm).getTime();

      return (
        (Number.isNaN(dataB) ? 0 : dataB) -
        (Number.isNaN(dataA) ? 0 : dataA)
      );
    })
    .slice(0, 12);
}

export function criarObrasCatalogoMinhaListaHome<T extends ObraCatalogoBibliotecaHome>(
  obrasCatalogo: T[],
  obrasFavoritas: string[],
  termoBusca: string,
  usuarioLogado: unknown
) {
  if (!usuarioLogado) {
    return [];
  }

  return obrasCatalogo
    .filter((obra) => {
      return (
        obraCatalogoEstaNaMinhaLista(obra, obrasFavoritas) &&
        obraCatalogoCombinaBuscaHome(obra, termoBusca)
      );
    })
    .slice(0, 12);
}
