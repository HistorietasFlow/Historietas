import { obraLocalCombinaBusca } from "./home-discovery-utils";
import {
  obterTotalComentariosObraHome,
  obterTotalCurtidasObraHome,
  obraTemArquivoAnexado,
} from "./home-local-work-utils";
import { obterTempoUltimoCapitulo } from "./home-reading-utils";

type CapituloListaObrasLocaisHome = {
  id: string;
  titulo: string;
  curtiu: boolean;
  comentario: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
};

type ObraListaObrasLocaisHome = {
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capaNome: string;
  arquivoObra?: unknown;
  capitulos: CapituloListaObrasLocaisHome[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  totalCurtidas: number;
  totalComentarios: number;
};

export function criarObrasComNovosCapitulosHome<T extends ObraListaObrasLocaisHome>(
  obrasPublicadas: T[],
  termoBusca: string
) {
  return obrasPublicadas
    .filter(
      (obra) =>
        obra.capitulos.length > 0 &&
        obraLocalCombinaBusca(obra, termoBusca)
    )
    .sort(
      (obraA, obraB) =>
        obterTempoUltimoCapitulo(obraB) -
        obterTempoUltimoCapitulo(obraA)
    )
    .slice(0, 12);
}

export function criarObrasMaisCurtidasHome<T extends ObraListaObrasLocaisHome>(
  obrasPublicadas: T[],
  termoBusca: string
) {
  return obrasPublicadas
    .filter(
      (obra) =>
        obterTotalCurtidasObraHome(obra) > 0 &&
        obraLocalCombinaBusca(obra, termoBusca)
    )
    .sort(
      (obraA, obraB) =>
        obterTotalCurtidasObraHome(obraB) -
        obterTotalCurtidasObraHome(obraA)
    )
    .slice(0, 12);
}

export function criarObrasMaisComentadasHome<T extends ObraListaObrasLocaisHome>(
  obrasPublicadas: T[],
  termoBusca: string
) {
  return obrasPublicadas
    .filter(
      (obra) =>
        obterTotalComentariosObraHome(obra) > 0 &&
        obraLocalCombinaBusca(obra, termoBusca)
    )
    .sort(
      (obraA, obraB) =>
        obterTotalComentariosObraHome(obraB) -
        obterTotalComentariosObraHome(obraA)
    )
    .slice(0, 12);
}

export function criarObrasComArquivoAnexadoHome<T extends ObraListaObrasLocaisHome>(
  obrasPublicadas: T[],
  termoBusca: string
) {
  return obrasPublicadas
    .filter(
      (obra) =>
        obraTemArquivoAnexado(obra) &&
        obraLocalCombinaBusca(obra, termoBusca)
    )
    .slice(0, 12);
}

export function criarLeiturasRapidasHome<T extends ObraListaObrasLocaisHome>(
  obrasPublicadas: T[],
  termoBusca: string
) {
  return obrasPublicadas
    .filter((obra) => {
      return (
        obra.capitulos.length > 0 &&
        obra.capitulos.length <= 3 &&
        obraLocalCombinaBusca(obra, termoBusca)
      );
    })
    .sort(
      (obraA, obraB) =>
        obraA.capitulos.length - obraB.capitulos.length
    )
    .slice(0, 12);
}
