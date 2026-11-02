"use client";

import { useState } from "react";
import type { ModoConteudoExplorar } from "../components/explorar-section-components";
import type {
  FiltroColecaoExplorar,
  OrdenacaoExplorar,
} from "../lib/explorar-derived-utils";

export function useExplorarNavigationFilterState() {
  const [modoConteudo, setModoConteudo] =
    useState<ModoConteudoExplorar>("obras");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroFormato, setFiltroFormato] = useState("todos");
  const [filtroClassificacao, setFiltroClassificacao] = useState("todos");
  const [filtroCapitulos, setFiltroCapitulos] = useState("todos");
  const [filtroColecao, setFiltroColecao] =
    useState<FiltroColecaoExplorar>("todos");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoExplorar>("relevancia");

  return {
    modoConteudo,
    setModoConteudo,
    categoriaSelecionada,
    setCategoriaSelecionada,
    busca,
    setBusca,
    filtroFormato,
    setFiltroFormato,
    filtroClassificacao,
    setFiltroClassificacao,
    filtroCapitulos,
    setFiltroCapitulos,
    filtroColecao,
    setFiltroColecao,
    ordenacao,
    setOrdenacao,
  };
}
