import { useMemo } from "react";
import {
  filtrarOrdenarAutoresListas,
  filtrarOrdenarItensPerfilListas,
  filtrarOrdenarObrasPublicasListas,
} from "../lib/listas-filter-sort-utils";
import {
  agruparItensPerfilPorMesListas,
  calcularTotalResultadosListas,
  deveAgruparPorMesListas,
  obterTituloPaginaListas,
} from "../lib/listas-presentation-utils";
import {
  type AutorLista,
  type CategoriaPerfil,
  type ListasPerfilEstado,
  type ModoLista,
  type ObraLista,
  type OrdenacaoLista,
  type OrigemPerfil,
  type PerfilLista,
} from "../types";

type UseListasResultsViewStateArgs = {
  autores: AutorLista[];
  busca: string;
  categoria: CategoriaPerfil;
  genero: string;
  listasPerfil: ListasPerfilEstado;
  modo: ModoLista;
  obrasPublicas: ObraLista[];
  ordenacao: OrdenacaoLista;
  origemPerfil: OrigemPerfil;
  perfil: PerfilLista | null;
  quantidadeVisivel: number;
  secao: string;
  tituloPersonalizado: string;
};

export function useListasResultsViewState({
  autores,
  busca,
  categoria,
  genero,
  listasPerfil,
  modo,
  obrasPublicas,
  ordenacao,
  origemPerfil,
  perfil,
  quantidadeVisivel,
  secao,
  tituloPersonalizado,
}: UseListasResultsViewStateArgs) {
  const itensPerfilFiltrados = useMemo(
    () =>
      filtrarOrdenarItensPerfilListas(
        listasPerfil[categoria],
        busca,
        ordenacao,
      ),
    [busca, categoria, listasPerfil, ordenacao],
  );

  const obrasFiltradas = useMemo(
    () =>
      filtrarOrdenarObrasPublicasListas(
        obrasPublicas,
        busca,
        ordenacao,
        secao,
      ),
    [busca, obrasPublicas, ordenacao, secao],
  );

  const autoresFiltrados = useMemo(
    () => filtrarOrdenarAutoresListas(autores, busca, ordenacao),
    [autores, busca, ordenacao],
  );

  const totalResultados = calcularTotalResultadosListas({
    modo,
    itensPerfil: itensPerfilFiltrados,
    autores: autoresFiltrados,
    obras: obrasFiltradas,
  });
  const tituloPagina = obterTituloPaginaListas({
    tituloPersonalizado,
    modo,
    origemPerfil,
    perfilNome: perfil?.nome || "",
    secao,
    genero,
  });
  const agruparPorMes = deveAgruparPorMesListas(modo, categoria);
  const itensPerfilVisiveis = itensPerfilFiltrados.slice(0, quantidadeVisivel);
  const obrasVisiveis = obrasFiltradas.slice(0, quantidadeVisivel);
  const autoresVisiveis = autoresFiltrados.slice(0, quantidadeVisivel);

  const gruposPerfil = useMemo(
    () => agruparItensPerfilPorMesListas(itensPerfilVisiveis),
    [itensPerfilVisiveis],
  );

  return {
    itensPerfilFiltrados,
    obrasFiltradas,
    autoresFiltrados,
    totalResultados,
    tituloPagina,
    agruparPorMes,
    itensPerfilVisiveis,
    obrasVisiveis,
    autoresVisiveis,
    gruposPerfil,
  };
}
