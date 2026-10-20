"use client";

import NotificacoesEmptyState from "./notificacoes-empty-state";
import NotificacoesFeedCard from "./notificacoes-feed-card";
import { prepararNotificacaoTexto } from "../lib/notificacoes-local-state-utils";
import {
  desktopListStyle,
  listStyle,
} from "../lib/notificacoes-card-styles";
import type {
  CapituloLocal,
  NotificacaoLocal,
  ObraLocal,
} from "../lib/notificacoes-models";

type NotificacoesFeedProps = {
  isDesktop: boolean;
  notificacoes: NotificacaoLocal[];
  notificacoesFiltradas: NotificacaoLocal[];
  menuNotificacaoAbertoId: string;
  solicitacaoRespondendoId: string;
  encontrarObra: (obraId: string) => ObraLocal | null;
  encontrarCapitulo: (
    obraId: string,
    capituloId: string
  ) => CapituloLocal | null;
  onAlternarMenuNotificacao: (id: string) => void;
  onResponderSolicitacaoSeguidor: (
    notificacao: NotificacaoLocal,
    aceitar: boolean
  ) => void;
};

export default function NotificacoesFeed({
  isDesktop,
  notificacoes,
  notificacoesFiltradas,
  menuNotificacaoAbertoId,
  solicitacaoRespondendoId,
  encontrarObra,
  encontrarCapitulo,
  onAlternarMenuNotificacao,
  onResponderSolicitacaoSeguidor,
}: NotificacoesFeedProps) {
  if (notificacoes.length === 0) {
    return <NotificacoesEmptyState mensagem="Nenhuma notificação" />;
  }

  if (notificacoesFiltradas.length === 0) {
    return <NotificacoesEmptyState mensagem="Nada encontrado" />;
  }

  return (
    <section
      style={isDesktop ? desktopListStyle : listStyle}
      aria-label="Lista de notificações"
    >
      {notificacoesFiltradas.map((notificacaoOriginal, notificacaoIndex) => {
        const notificacao = prepararNotificacaoTexto(notificacaoOriginal);

        return (
          <NotificacoesFeedCard
            key={notificacao.id}
            notificacao={notificacao}
            notificacaoIndex={notificacaoIndex}
            totalNotificacoes={notificacoesFiltradas.length}
            isDesktop={isDesktop}
            menuNotificacaoAbertoId={menuNotificacaoAbertoId}
            solicitacaoRespondendoId={solicitacaoRespondendoId}
            encontrarObra={encontrarObra}
            encontrarCapitulo={encontrarCapitulo}
            onAlternarMenuNotificacao={onAlternarMenuNotificacao}
            onResponderSolicitacaoSeguidor={onResponderSolicitacaoSeguidor}
          />
        );
      })}
    </section>
  );
}
