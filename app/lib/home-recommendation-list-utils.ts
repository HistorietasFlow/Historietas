import { normalizarTexto } from "../../lib/utils";
import {
  obraCatalogoCombinaBuscaHome,
  obraCatalogoCombinaComTemasRecomendados,
  obraCombinaComTemasRecomendados,
  obraLocalCombinaBusca,
  obterTemasRecomendacaoObra,
  obterTemasRecomendacaoObraCatalogo,
} from "./home-discovery-utils";
import { obterTempoUltimoCapitulo } from "./home-reading-utils";

type CapituloRecomendacaoHome = {
  id: string;
  titulo: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
};

type ObraLocalRecomendacaoHome = {
  id: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capaNome: string;
  capitulos: CapituloRecomendacaoHome[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
};

type ObraCatalogoRecomendacaoHome = {
  titulo: string;
  autor: string;
  genero: string;
  classificacaoIndicativa: string;
  status: string;
};

export function criarTemasRecomendadosUsuarioHome<
  TObraLocal extends ObraLocalRecomendacaoHome,
  TObraCatalogo extends ObraCatalogoRecomendacaoHome,
>(
  obrasParaContinuar: TObraLocal[],
  obrasMinhaLista: TObraLocal[],
  obrasCatalogoMinhaLista: TObraCatalogo[]
) {
  const temas = new Set<string>();

  [...obrasParaContinuar, ...obrasMinhaLista].forEach((obra) => {
    obterTemasRecomendacaoObra(obra).forEach((tema) => {
      temas.add(tema);
    });
  });

  obrasCatalogoMinhaLista.forEach((obra) => {
    obterTemasRecomendacaoObraCatalogo(obra).forEach((tema) => {
      temas.add(tema);
    });
  });

  return temas;
}

export function criarObrasRecomendadasHome<T extends ObraLocalRecomendacaoHome>(
  obrasPublicadas: T[],
  obrasParaContinuar: T[],
  obrasMinhaLista: T[],
  temasRecomendadosUsuario: Set<string>,
  termoBusca: string
) {
  const obrasJaPriorizadas = new Set(
    [...obrasParaContinuar, ...obrasMinhaLista].map((obra) => obra.id)
  );

  return obrasPublicadas
    .filter((obra) => {
      return (
        !obrasJaPriorizadas.has(obra.id) &&
        obraCombinaComTemasRecomendados(obra, temasRecomendadosUsuario) &&
        obraLocalCombinaBusca(obra, termoBusca)
      );
    })
    .sort((obraA, obraB) => {
      const afinidadeA = obterTemasRecomendacaoObra(obraA).filter((tema) =>
        temasRecomendadosUsuario.has(tema)
      ).length;
      const afinidadeB = obterTemasRecomendacaoObra(obraB).filter((tema) =>
        temasRecomendadosUsuario.has(tema)
      ).length;

      return (
        afinidadeB - afinidadeA ||
        obterTempoUltimoCapitulo(obraB) - obterTempoUltimoCapitulo(obraA)
      );
    })
    .slice(0, 12);
}

export function criarObrasCatalogoRecomendadasHome<T extends ObraCatalogoRecomendacaoHome>(
  obrasCatalogo: T[],
  obrasCatalogoMinhaLista: T[],
  temasRecomendadosUsuario: Set<string>,
  termoBusca: string
) {
  const titulosMinhaLista = new Set(
    obrasCatalogoMinhaLista.map((obra) => normalizarTexto(obra.titulo))
  );

  const recomendadasPorTema = obrasCatalogo.filter((obra) => {
    return (
      !titulosMinhaLista.has(normalizarTexto(obra.titulo)) &&
      obraCatalogoCombinaBuscaHome(obra, termoBusca) &&
      obraCatalogoCombinaComTemasRecomendados(obra, temasRecomendadosUsuario)
    );
  });

  const baseRecomendacoes =
    recomendadasPorTema.length > 0
      ? recomendadasPorTema
      : obrasCatalogo.filter((obra) => {
          return (
            !titulosMinhaLista.has(normalizarTexto(obra.titulo)) &&
            obraCatalogoCombinaBuscaHome(obra, termoBusca)
          );
        });

  return baseRecomendacoes.slice(0, 12);
}
