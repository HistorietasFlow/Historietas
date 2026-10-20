"use client";

import { useMemo } from "react";
import { acessoConteudo18Confirmado } from "../../../lib/historietasAdultContent";
import { normalizarTexto } from "../../../lib/utils";
import {
  filtrarEOrdenarNotificacoes,
  type FiltroNotificacao,
  type OrdenacaoNotificacao,
} from "../lib/notificacoes-filter-utils";
import {
  criarOpcoesFiltroNotificacoes,
  criarOpcoesOrdenacaoNotificacoes,
  filtrosNotificacoesEstaoAtivos,
} from "../lib/notificacoes-filter-options";
import type {
  NotificacaoLocal,
  ObraLocal,
} from "../lib/notificacoes-models";
import {
  calcularTotalNotificacoesLidas,
  contarNotificacoesNaoLidas,
  criarObrasPorIdNotificacoes,
  encontrarCapituloNotificacao,
  encontrarObraNotificacao,
  obterNotificacaoMenuAberta,
} from "../lib/notificacoes-view-state-utils";

type UseNotificacoesPageViewStateParametros = {
  obras: ObraLocal[];
  notificacoes: NotificacaoLocal[];
  busca: string;
  filtro: FiltroNotificacao;
  ordenacao: OrdenacaoNotificacao;
  menuNotificacaoAbertoId: string;
};

export function useNotificacoesPageViewState({
  obras,
  notificacoes,
  busca,
  filtro,
  ordenacao,
  menuNotificacaoAbertoId,
}: UseNotificacoesPageViewStateParametros) {
  const obrasPorId = useMemo(() => {
    return criarObrasPorIdNotificacoes(obras);
  }, [obras]);

  const totalNotificacoes = notificacoes.length;

  const totalNaoLidas = useMemo(() => {
    return contarNotificacoesNaoLidas(notificacoes);
  }, [notificacoes]);

  const totalLidas = calcularTotalNotificacoesLidas(
    totalNotificacoes,
    totalNaoLidas,
  );
  const termoBusca = normalizarTexto(busca);

  const acessoConteudo18Liberado = acessoConteudo18Confirmado();

  const notificacoesFiltradas = useMemo(() => {
    return filtrarEOrdenarNotificacoes({
      notificacoes,
      obrasPorId,
      termoBusca,
      filtro,
      ordenacao,
      acessoConteudo18Liberado,
    });
  }, [
    notificacoes,
    obrasPorId,
    termoBusca,
    filtro,
    ordenacao,
    acessoConteudo18Liberado,
  ]);

  const filtrosAtivos = filtrosNotificacoesEstaoAtivos(
    busca,
    filtro,
    ordenacao,
  );

  const opcoesFiltro = criarOpcoesFiltroNotificacoes();

  const opcoesOrdenacao = criarOpcoesOrdenacaoNotificacoes();

  function encontrarObra(obraId: string) {
    return encontrarObraNotificacao(obrasPorId, obraId);
  }

  function encontrarCapitulo(obraId: string, capituloId: string) {
    return encontrarCapituloNotificacao(obrasPorId, obraId, capituloId);
  }

  const notificacaoMenuAberta = obterNotificacaoMenuAberta(
    menuNotificacaoAbertoId,
    notificacoes,
  );

  return {
    obrasPorId,
    totalNotificacoes,
    totalLidas,
    notificacoesFiltradas,
    filtrosAtivos,
    opcoesFiltro,
    opcoesOrdenacao,
    encontrarObra,
    encontrarCapitulo,
    notificacaoMenuAberta,
  };
}
