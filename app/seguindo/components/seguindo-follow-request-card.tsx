"use client";

import Link from "next/link";
import { criarAvatarUsuarioSeguindoStyle } from "../lib/seguindo-image-style-utils";
import { criarHrefPerfilUsuarioSeguindo } from "../lib/seguindo-route-utils";
import { desktopAuthorAvatarStyle } from "../lib/seguindo-desktop-author-avatar-styles";
import {
  authorAvatarStyle,
  authorCardStyle,
  desktopAuthorCardStyle,
} from "../lib/seguindo-author-card-styles";
import {
  followRequestAcceptButtonStyle,
  followRequestActionsStyle,
  followRequestContentStyle,
  followRequestDeclineButtonStyle,
} from "../lib/seguindo-suggested-user-action-styles";
import {
  suggestedUserHandleStyle,
  suggestedUserInfoStyle,
  suggestedUserNameStyle,
} from "../lib/seguindo-suggested-user-text-styles";
import type { SolicitacaoSeguidor } from "../lib/seguindo-page-types";

type SeguindoFollowRequestCardProps = {
  solicitacao: SolicitacaoSeguidor;
  isDesktop: boolean;
  respondendo: boolean;
  onResponderSolicitacao: (
    solicitacao: SolicitacaoSeguidor,
    aceitar: boolean,
  ) => void;
};

export function SeguindoFollowRequestCard({
  solicitacao,
  isDesktop,
  respondendo,
  onResponderSolicitacao,
}: SeguindoFollowRequestCardProps) {
  const usuarioSolicitante = solicitacao.usuario;
  const hrefPerfilUsuario = criarHrefPerfilUsuarioSeguindo(usuarioSolicitante);

  return (
    <article
      style={{
        ...(isDesktop ? desktopAuthorCardStyle : authorCardStyle),
        gridTemplateColumns: isDesktop
          ? "58px minmax(0, 1fr)"
          : "52px minmax(0, 1fr)",
        gap: isDesktop ? "10px" : "7px",
        width: isDesktop ? "100%" : "102%",
        margin: isDesktop ? 0 : "0 auto",
        padding: isDesktop ? "11px" : "6px 8px 6px 0",
        borderRadius: isDesktop ? "20px" : 0,
        background: isDesktop
          ? "var(--historietas-seguindo-panel, rgba(4, 0, 10, 0.72))"
          : "transparent",
        border: isDesktop ? "1px solid rgba(255,255,255,0.06)" : "none",
        boxShadow: "none",
      }}
    >
      <Link
        href={hrefPerfilUsuario}
        aria-label={`Abrir perfil de ${usuarioSolicitante.nome}`}
        style={{
          ...criarAvatarUsuarioSeguindoStyle(
            usuarioSolicitante.avatar,
            authorAvatarStyle,
          ),
          ...(isDesktop ? desktopAuthorAvatarStyle : {}),
          width: isDesktop ? "58px" : "52px",
          height: isDesktop ? "58px" : "52px",
          borderRadius: isDesktop ? "17px" : "16px",
          fontSize: isDesktop ? "25px" : "22px",
        }}
      >
        {!usuarioSolicitante.avatar &&
          usuarioSolicitante.nome.slice(0, 1).toUpperCase()}
      </Link>

      <div style={followRequestContentStyle}>
        <div style={suggestedUserInfoStyle}>
          <Link
            href={hrefPerfilUsuario}
            data-historietas-i18n-ignore="true"
            style={suggestedUserNameStyle}
          >
            {usuarioSolicitante.nome}
          </Link>

          <span
            data-historietas-i18n-ignore="true"
            style={suggestedUserHandleStyle}
          >
            {usuarioSolicitante.handle}
          </span>
        </div>

        <div aria-label="Responder solicitação" style={followRequestActionsStyle}>
          <button
            type="button"
            onClick={() => onResponderSolicitacao(solicitacao, true)}
            disabled={respondendo}
            style={{
              ...followRequestAcceptButtonStyle,
              opacity: respondendo ? 0.58 : 1,
              cursor: respondendo ? "not-allowed" : "pointer",
            }}
          >
            {respondendo ? "..." : "Aceitar"}
          </button>

          <button
            type="button"
            onClick={() => onResponderSolicitacao(solicitacao, false)}
            disabled={respondendo}
            style={{
              ...followRequestDeclineButtonStyle,
              opacity: respondendo ? 0.58 : 1,
              cursor: respondendo ? "not-allowed" : "pointer",
            }}
          >
            {respondendo ? "..." : "Recusar"}
          </button>
        </div>
      </div>
    </article>
  );
}
