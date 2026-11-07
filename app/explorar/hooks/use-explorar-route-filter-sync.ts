"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ModoConteudoExplorar } from "../components/explorar-section-components";
import type { OrdenacaoExplorar } from "../lib/explorar-derived-utils";
import { observarFiltrosCompartilhaveisExplorar } from "../lib/explorar-page-route-utils";

type UseExplorarRouteFilterSyncParams = {
  setModoConteudo: Dispatch<SetStateAction<ModoConteudoExplorar>>;
  setCategoriaSelecionada: Dispatch<SetStateAction<string>>;
  setBusca: Dispatch<SetStateAction<string>>;
  setOrdenacao: Dispatch<SetStateAction<OrdenacaoExplorar>>;
  setFiltroFormato: Dispatch<SetStateAction<string>>;
  setFiltroTag: Dispatch<SetStateAction<string>>;
  setTagExcluida: Dispatch<SetStateAction<string>>;
  setNotaMinima: Dispatch<SetStateAction<number | null>>;
};

export function useExplorarRouteFilterSync({
  setModoConteudo,
  setCategoriaSelecionada,
  setBusca,
  setOrdenacao,
  setFiltroFormato,
  setFiltroTag,
  setTagExcluida,
  setNotaMinima,
}: UseExplorarRouteFilterSyncParams) {
  useEffect(() => {
    return observarFiltrosCompartilhaveisExplorar((filtros) => {
      setModoConteudo(filtros.modoConteudo);
      setCategoriaSelecionada(filtros.categoriaSelecionada);
      setBusca(filtros.busca);
      setOrdenacao(filtros.ordenacao);
      setFiltroFormato(filtros.filtroFormato);
      setFiltroTag(filtros.filtroTag || "");
      setTagExcluida(filtros.tagExcluida || "");
      setNotaMinima(filtros.notaMinima ?? null);
    });
  }, [
    setModoConteudo,
    setCategoriaSelecionada,
    setBusca,
    setOrdenacao,
    setFiltroFormato,
    setFiltroTag,
    setTagExcluida,
    setNotaMinima,
  ]);
}
