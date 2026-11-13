"use client";

import { useEffect } from "react";
import type { IntervaloPalavrasTexto } from "../../../lib/catalogo-palavras";
import type { Dispatch, SetStateAction } from "react";
import type { ModoConteudoExplorar } from "../components/explorar-section-components";
import type { OrdenacaoExplorar } from "../lib/explorar-derived-utils";
import { observarFiltrosCompartilhaveisExplorar } from "../lib/explorar-page-route-utils";

type UseExplorarRouteFilterSyncParams = {
  setIntervaloPalavras: Dispatch<SetStateAction<IntervaloPalavrasTexto>>;
  setModoConteudo: Dispatch<SetStateAction<ModoConteudoExplorar>>;
  setCategoriaSelecionada: Dispatch<SetStateAction<string>>;
  setBusca: Dispatch<SetStateAction<string>>;
  setOrdenacao: Dispatch<SetStateAction<OrdenacaoExplorar>>;
  setFiltroFormato: Dispatch<SetStateAction<string>>;
  setFiltroTag: Dispatch<SetStateAction<string>>;
  setTagExcluida: Dispatch<SetStateAction<string>>;
  setGeneroExcluido: Dispatch<SetStateAction<string>>;
  setStatusEditorial: Dispatch<SetStateAction<string>>;
  setNotaMinima: Dispatch<SetStateAction<number | null>>;
};

export function useExplorarRouteFilterSync({
  setIntervaloPalavras,
  setModoConteudo,
  setCategoriaSelecionada,
  setBusca,
  setOrdenacao,
  setFiltroFormato,
  setFiltroTag,
  setTagExcluida,
  setGeneroExcluido,
  setStatusEditorial,
  setNotaMinima,
}: UseExplorarRouteFilterSyncParams) {
  useEffect(() => {
    return observarFiltrosCompartilhaveisExplorar((filtros) => {
      setModoConteudo(filtros.modoConteudo);
      setIntervaloPalavras({ minimo: filtros.palavrasMinimas ?? "", maximo: filtros.palavrasMaximas ?? "" });
      setCategoriaSelecionada(filtros.categoriaSelecionada);
      setBusca(filtros.busca);
      setOrdenacao(filtros.ordenacao);
      setFiltroFormato(filtros.filtroFormato);
      setFiltroTag(filtros.filtroTag || "");
      setTagExcluida(filtros.tagExcluida || "");
      setGeneroExcluido(filtros.generoExcluido || "");
      setStatusEditorial(filtros.statusEditorial || "");
      setNotaMinima(filtros.notaMinima ?? null);
    });
  }, [
    setIntervaloPalavras,
    setModoConteudo,
    setCategoriaSelecionada,
    setBusca,
    setOrdenacao,
    setFiltroFormato,
    setFiltroTag,
    setTagExcluida,
    setGeneroExcluido,
    setStatusEditorial,
    setNotaMinima,
  ]);
}
