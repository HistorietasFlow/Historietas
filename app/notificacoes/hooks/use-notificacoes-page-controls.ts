"use client";

import { useState } from "react";
import type {
  FiltroNotificacao,
  OrdenacaoNotificacao,
} from "../lib/notificacoes-filter-utils";

export function useNotificacoesPageControls() {
  const [busca, setBusca] = useState("");
  const [buscaTopoAberta, setBuscaTopoAberta] = useState(false);
  const [filtro, setFiltro] = useState<FiltroNotificacao>("todas");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoNotificacao>("recentes");
  const [menuNotificacaoAbertoId, setMenuNotificacaoAbertoId] = useState("");
  const [mostrarPainelOrdenacao, setMostrarPainelOrdenacao] = useState(false);

  function alternarMenuNotificacao(id: string) {
    setMostrarPainelOrdenacao(false);
    setMenuNotificacaoAbertoId((idAtual) => (idAtual === id ? "" : id));
  }

  function fecharMenuNotificacao() {
    setMenuNotificacaoAbertoId("");
  }

  function fecharMenusNotificacoes() {
    setMenuNotificacaoAbertoId("");
    setMostrarPainelOrdenacao(false);
  }

  function limparFiltros() {
    fecharMenusNotificacoes();
    setBusca("");
    setBuscaTopoAberta(false);
    setFiltro("todas");
    setOrdenacao("recentes");
  }

  return {
    busca,
    buscaTopoAberta,
    filtro,
    ordenacao,
    menuNotificacaoAbertoId,
    mostrarPainelOrdenacao,
    setBusca,
    setBuscaTopoAberta,
    setFiltro,
    setOrdenacao,
    setMostrarPainelOrdenacao,
    alternarMenuNotificacao,
    fecharMenuNotificacao,
    fecharMenusNotificacoes,
    limparFiltros,
  };
}
