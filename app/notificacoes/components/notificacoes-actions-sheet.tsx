"use client";

import Link from "next/link";
import { criarSlugBase } from "../../../lib/utils";
import {
  notificacaoEhComunidade,
} from "../lib/notificacoes-filter-utils";
import {
  obterAcaoPrincipalNotificacao,
  obterNomeAutorNotificacao,
} from "../lib/notificacoes-display-utils";
import {
  criarPerfilHrefNotificacao,
  montarLinkNotificacao,
} from "../lib/notificacoes-navigation-utils";
import {
  prepararNotificacaoTexto,
} from "../lib/notificacoes-local-state-utils";
import type {
  NotificacaoLocal,
  ObraLocal,
} from "../lib/notificacoes-models";
import {
  desktopNotificationActionsSheetStyle,
  notificationActionsDangerOptionDisabledStyle,
  notificationActionsDangerOptionStyle,
  notificationActionsOptionDisabledStyle,
  notificationActionsOptionLinkStyle,
  notificationActionsOptionStyle,
  notificationActionsSheetStyle,
  notificationSortingBackdropStyle,
  notificationSortingHandleStyle,
  notificationSortingOptionsListStyle,
  notificationSortingTitleStyle,
} from "../lib/notificacoes-shell-styles";
import NotificacoesOverlayPortal from "./notificacoes-overlay-portal";

type NotificacoesActionsSheetProps = {
  isDesktop: boolean;
  notificacaoOriginal: NotificacaoLocal;
  encontrarObra: (obraId: string) => ObraLocal | null;
  solicitacaoRespondendoId: string;
  onClose: () => void;
  onAbrirNotificacao: (id: string) => void;
  onResponderSolicitacaoSeguidor: (
    notificacao: NotificacaoLocal,
    aceitar: boolean,
  ) => void;
  onMarcarComoLida: (id: string) => void;
  onMarcarComoNaoLida: (id: string) => void;
  onApagarNotificacao: (id: string) => void;
};

export default function NotificacoesActionsSheet({
  isDesktop,
  notificacaoOriginal,
  encontrarObra,
  solicitacaoRespondendoId,
  onClose,
  onAbrirNotificacao,
  onResponderSolicitacaoSeguidor,
  onMarcarComoLida,
  onMarcarComoNaoLida,
  onApagarNotificacao,
}: NotificacoesActionsSheetProps) {
  const notificacao = prepararNotificacaoTexto(notificacaoOriginal);
  const obra = encontrarObra(notificacao.obraId);
  const ehComunidade = notificacaoEhComunidade(notificacao);
  const autorNotificacaoNome = obterNomeAutorNotificacao(notificacao);
  const autorNotificacaoHref = criarPerfilHrefNotificacao(
    notificacao.autorId || "",
    autorNotificacaoNome,
  );
  const linkNotificacao = montarLinkNotificacao(notificacao, obra);
  const labelAcaoPrincipal = obterAcaoPrincipalNotificacao(notificacao);

  return (
    <NotificacoesOverlayPortal>
      <div
        data-historietas-notificacoes-overlay="true"
        style={notificationSortingBackdropStyle}
        onClick={onClose}
      >
        <div
          style={
            isDesktop
              ? desktopNotificationActionsSheetStyle
              : notificationActionsSheetStyle
          }
          onClick={(event) => event.stopPropagation()}
        >
          <span style={notificationSortingHandleStyle} />

          <h2 style={notificationSortingTitleStyle}>AÇÕES DA NOTIFICAÇÃO</h2>

          <div style={notificationSortingOptionsListStyle}>
            <Link
              href={linkNotificacao}
              style={notificationActionsOptionLinkStyle}
              onClick={() => {
                onAbrirNotificacao(notificacao.id);
                onClose();
              }}
            >
              {labelAcaoPrincipal}
            </Link>

            {notificacao.autorId && (
              <Link
                href={autorNotificacaoHref}
                style={notificationActionsOptionLinkStyle}
                onClick={onClose}
              >
                Abrir perfil
              </Link>
            )}

            {notificacao.tipo === "solicitacao-seguidor" &&
            notificacao.solicitacaoId ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    onResponderSolicitacaoSeguidor(notificacao, true)
                  }
                  style={
                    solicitacaoRespondendoId
                      ? notificationActionsOptionDisabledStyle
                      : notificationActionsOptionStyle
                  }
                  disabled={Boolean(solicitacaoRespondendoId)}
                >
                  {solicitacaoRespondendoId === notificacao.solicitacaoId
                    ? "Aceitando..."
                    : "Aceitar"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onResponderSolicitacaoSeguidor(notificacao, false)
                  }
                  style={
                    solicitacaoRespondendoId
                      ? notificationActionsDangerOptionDisabledStyle
                      : notificationActionsDangerOptionStyle
                  }
                  disabled={Boolean(solicitacaoRespondendoId)}
                >
                  {solicitacaoRespondendoId === notificacao.solicitacaoId
                    ? "Recusando..."
                    : "Recusar"}
                </button>
              </>
            ) : null}

            {notificacao.lida ? (
              <button
                type="button"
                onClick={() => {
                  onMarcarComoNaoLida(notificacao.id);
                  onClose();
                }}
                style={notificationActionsOptionStyle}
              >
                Marcar como nova
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onMarcarComoLida(notificacao.id);
                  onClose();
                }}
                style={notificationActionsOptionStyle}
              >
                Marcar como lida
              </button>
            )}

            {obra && !ehComunidade && (
              <Link
                href={`/obra/${obra.slug || criarSlugBase(obra.titulo)}`}
                style={notificationActionsOptionLinkStyle}
                onClick={onClose}
              >
                Abrir obra
              </Link>
            )}

            <button
              type="button"
              onClick={() => {
                onApagarNotificacao(notificacao.id);
                onClose();
              }}
              style={notificationActionsDangerOptionStyle}
            >
              Apagar
            </button>
          </div>
        </div>
      </div>
    </NotificacoesOverlayPortal>
  );
}
