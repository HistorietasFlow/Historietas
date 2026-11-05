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
};

export function useExplorarRouteFilterSync({
  setModoConteudo,
  setCategoriaSelecionada,
  setBusca,
  setOrdenacao,
}: UseExplorarRouteFilterSyncParams) {
  useEffect(() => {
    return observarFiltrosCompartilhaveisExplorar((filtros) => {
      setModoConteudo(filtros.modoConteudo);
      setCategoriaSelecionada(filtros.categoriaSelecionada);
      setBusca(filtros.busca);
      setOrdenacao(filtros.ordenacao);
    });
  }, [
    setModoConteudo,
    setCategoriaSelecionada,
    setBusca,
    setOrdenacao,
  ]);
}
