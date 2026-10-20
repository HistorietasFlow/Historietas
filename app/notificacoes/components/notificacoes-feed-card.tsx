"use client";

import Link from "next/link";
import { formatarData } from "../../../lib/utils";
import {
  criarAvatarNotificacaoStyle,
  notificacaoTemAutorSocial,
  notificacaoUsaCardSocial,
  obterDetalheNotificacao,
  obterIconeNotificacao,
  obterInicialNotificacao,
  obterNomeAutorNotificacao,
  obterTextoBlocoSocialNotificacao,
  obterTituloBlocoSocialNotificacao,
  obterTituloExibicaoNotificacao,
} from "../lib/notificacoes-display-utils";
import {
  criarPerfilHrefNotificacao,
} from "../lib/notificacoes-navigation-utils";
import {
  cardHeaderStyle,
  cardHeaderTextStyle,
  cardMenuButtonStyle,
  cardMenuWrapperStyle,
  cardStyle,
  communityCardStyle,
  communityCommentBoxStyle,
  communityCommentTextStyle,
  communityDateTextStyle,
  communityInlineStatusDotStyle,
  communityInlineStatusStyle,
  communityMetaGridStyle,
  communityNotificationIconStyle,
  communityUpdateBoxStyle,
  desktopCardStyle,
  desktopCommunityCardStyle,
  desktopCommunityMetaGridStyle,
  desktopMetaGridStyle,
  desktopReadCardStyle,
  desktopReadCommunityCardStyle,
  followerRequestAcceptButtonDisabledStyle,
  followerRequestAcceptButtonStyle,
  followerRequestActionsStyle,
  followerRequestRejectButtonDisabledStyle,
  followerRequestRejectButtonStyle,
  metaBoxStyle,
  metaGridStyle,
  metaLabelStyle,
  metaValueStyle,
  notificationAuthorInlineLinkStyle,
  notificationMessageStyle,
  notificationTitleRowStyle,
  notificationTitleStyle,
  readCardStyle,
  readCommunityCardStyle,
  readNotificationIconStyle,
  unreadNotificationIconStyle,
} from "../lib/notificacoes-card-styles";
import type {
  CapituloLocal,
  NotificacaoLocal,
  ObraLocal,
} from "../lib/notificacoes-models";
import type { CSSProperties } from "react";

type NotificacoesFeedCardProps = {
  notificacao: NotificacaoLocal;
  notificacaoIndex: number;
  totalNotificacoes: number;
  isDesktop: boolean;
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

export default function NotificacoesFeedCard({
  notificacao,
  notificacaoIndex,
  totalNotificacoes,
  isDesktop,
  menuNotificacaoAbertoId,
  solicitacaoRespondendoId,
  encontrarObra,
  encontrarCapitulo,
  onAlternarMenuNotificacao,
  onResponderSolicitacaoSeguidor,
}: NotificacoesFeedCardProps) {
  const obra = encontrarObra(notificacao.obraId);
  const capitulo = encontrarCapitulo(
    notificacao.obraId,
    notificacao.capituloId
  );

  const usaCardSocial = notificacaoUsaCardSocial(notificacao);
  const tituloObra = obra?.titulo || "Obra não encontrada";
  const tituloCapitulo = capitulo?.titulo || "Capítulo não encontrado";
  const tituloExibicao = obterTituloExibicaoNotificacao(notificacao);
  const tituloBlocoSocial = obterTituloBlocoSocialNotificacao(notificacao);
  const textoBlocoSocial = obterTextoBlocoSocialNotificacao(notificacao);
  const autorNotificacaoNome = obterNomeAutorNotificacao(notificacao);
  const autorNotificacaoHref = criarPerfilHrefNotificacao(
    notificacao.autorId || "",
    autorNotificacaoNome
  );

  const menuEstaAberto = menuNotificacaoAbertoId === notificacao.id;

  const cardVisualStyle = notificacao.lida
    ? usaCardSocial
      ? isDesktop
        ? desktopReadCommunityCardStyle
        : readCommunityCardStyle
      : isDesktop
        ? desktopReadCardStyle
        : readCardStyle
    : usaCardSocial
      ? isDesktop
        ? desktopCommunityCardStyle
        : communityCardStyle
      : isDesktop
        ? desktopCardStyle
        : cardStyle;

  const iconVisualStyle = notificacao.lida
    ? readNotificationIconStyle
    : usaCardSocial
      ? communityNotificationIconStyle
      : unreadNotificationIconStyle;
  const avatarVisualStyle = criarAvatarNotificacaoStyle(
    notificacao,
    iconVisualStyle
  );
  const cardSeparadorStyle: CSSProperties =
    notificacaoIndex < totalNotificacoes - 1
      ? {}
      : { borderBottom: "0" };

  return (
    <article style={{ ...cardVisualStyle, ...cardSeparadorStyle }}>
      <div style={cardHeaderStyle}>
        {notificacao.autorId ? (
          <Link
            href={autorNotificacaoHref}
            aria-label={`Abrir perfil de ${autorNotificacaoNome}`}
            style={avatarVisualStyle}
          >
            {notificacao.autorAvatar?.trim()
              ? ""
              : obterInicialNotificacao(notificacao)}
          </Link>
        ) : (
          <div style={iconVisualStyle} aria-hidden="true">
            {obterIconeNotificacao(notificacao, notificacao.lida)}
          </div>
        )}

        <div style={cardHeaderTextStyle}>
          <div style={notificationTitleRowStyle}>
            <h2 style={notificationTitleStyle}>{tituloExibicao}</h2>

            <div style={cardMenuWrapperStyle}>
              <button
                type="button"
                aria-label={`Abrir ações de ${tituloExibicao}`}
                aria-expanded={menuEstaAberto}
                onClick={() => onAlternarMenuNotificacao(notificacao.id)}
                style={cardMenuButtonStyle}
              >
                ⋮
              </button>
            </div>
          </div>

          <span style={communityDateTextStyle}>
            DATA: {formatarData(notificacao.criadaEm)}
          </span>

          {!usaCardSocial && (
            <p style={notificationMessageStyle}>{notificacao.mensagem}</p>
          )}
        </div>
      </div>

      <div
        style={
          usaCardSocial
            ? isDesktop
              ? desktopCommunityMetaGridStyle
              : communityMetaGridStyle
            : isDesktop
              ? desktopMetaGridStyle
              : metaGridStyle
        }
      >
        {usaCardSocial ? (
          <div
            style={
              notificacao.tipo === "comentario-comunidade" ||
              notificacao.tipo === "comentario-obra" ||
              notificacao.tipo === "comentario-capitulo" ||
              notificacao.tipo === "comentario-diario"
                ? communityCommentBoxStyle
                : communityUpdateBoxStyle
            }
          >
            {notificacaoTemAutorSocial(notificacao) ? (
              notificacao.autorId ? (
                <Link
                  href={autorNotificacaoHref}
                  style={notificationAuthorInlineLinkStyle}
                >
                  {tituloBlocoSocial}
                </Link>
              ) : (
                <span style={notificationAuthorInlineLinkStyle}>
                  {tituloBlocoSocial}
                </span>
              )
            ) : (
              <span style={communityInlineStatusStyle}>
                <span>Atualização</span>
                <span style={communityInlineStatusDotStyle}>•</span>
                <span>{obterDetalheNotificacao(notificacao)}</span>
              </span>
            )}

            {textoBlocoSocial.trim() ? (
              <p style={communityCommentTextStyle}>{textoBlocoSocial}</p>
            ) : null}

            {notificacao.tipo === "solicitacao-seguidor" &&
            notificacao.solicitacaoId ? (
              <div style={followerRequestActionsStyle}>
                <button
                  type="button"
                  onClick={() =>
                    onResponderSolicitacaoSeguidor(notificacao, true)
                  }
                  style={
                    solicitacaoRespondendoId
                      ? followerRequestAcceptButtonDisabledStyle
                      : followerRequestAcceptButtonStyle
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
                      ? followerRequestRejectButtonDisabledStyle
                      : followerRequestRejectButtonStyle
                  }
                  disabled={Boolean(solicitacaoRespondendoId)}
                >
                  {solicitacaoRespondendoId === notificacao.solicitacaoId
                    ? "Recusando..."
                    : "Recusar"}
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div style={metaBoxStyle}>
              <span style={metaLabelStyle}>Obra</span>
              <strong data-historietas-i18n-ignore="true" style={metaValueStyle}>{tituloObra}</strong>
            </div>

            <div style={metaBoxStyle}>
              <span style={metaLabelStyle}>Capítulo</span>
              <strong data-historietas-i18n-ignore="true" style={metaValueStyle}>{tituloCapitulo}</strong>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
