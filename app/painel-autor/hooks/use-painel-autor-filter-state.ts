"use client";

import { useState } from "react";
import type {
  FiltroPainel,
  OrdenacaoPainel,
} from "../lib/painel-autor-filter-options";

export function usePainelAutorFilterState() {
  const [busca, setBusca] = useState("");
  const [buscaPainelAberta, setBuscaPainelAberta] = useState(false);
  const [filtro, setFiltro] = useState<FiltroPainel>("todas");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoPainel>("pontuacao");
  const [mostrarFiltrosPainel, setMostrarFiltrosPainel] = useState(false);

  const filtrosAtivos =
    Boolean(busca.trim()) || filtro !== "todas" || ordenacao !== "pontuacao";

  function limparFiltros() {
    setBusca("");
    setFiltro("todas");
    setOrdenacao("pontuacao");
  }

  return {
    busca,
    setBusca,
    buscaPainelAberta,
    setBuscaPainelAberta,
    filtro,
    setFiltro,
    ordenacao,
    setOrdenacao,
    mostrarFiltrosPainel,
    setMostrarFiltrosPainel,
    filtrosAtivos,
    limparFiltros,
  };
}
