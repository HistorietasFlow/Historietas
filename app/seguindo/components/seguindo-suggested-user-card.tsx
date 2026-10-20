"use client";

import Link from "next/link";
import { criarAvatarUsuarioSeguindoStyle } from "../lib/seguindo-image-style-utils";
import { criarHrefPerfilUsuarioSeguindo } from "../lib/seguindo-route-utils";
import {
  authorAvatarStyle,
  authorCardStyle,
  desktopAuthorCardStyle,
} from "../lib/seguindo-author-card-styles";
import { desktopAuthorAvatarStyle } from "../lib/seguindo-desktop-author-avatar-styles";
import {
  suggestedUserFollowButtonStyle,
  suggestedUserRequestPendingButtonStyle,
} from "../lib/seguindo-suggested-user-action-styles";
import {
  suggestedUserHandleStyle,
  suggestedUserInfoStyle,
  suggestedUserNameStyle,
} from "../lib/seguindo-suggested-user-text-styles";
import type { UsuarioSeguido } from "../lib/seguindo-page-types";

type SeguindoSuggestedUserCardProps = {
  usuario: UsuarioSeguido;
  isDesktop: boolean;
  seguindoAgora: boolean;
  solicitacaoPendente: boolean;
  onSeguirUsuarioSugestao: (usuario: UsuarioSeguido) => void;
};

export function SeguindoSuggestedUserCard({
  usuario,
  isDesktop,
  seguindoAgora,
  solicitacaoPendente,
  onSeguirUsuarioSugestao,
}: SeguindoSuggestedUserCardProps) {
  const hrefPerfil = criarHrefPerfilUsuarioSeguindo(usuario);

  return (
    <article
      style={{
        ...(isDesktop ? desktopAuthorCardStyle : authorCardStyle),
        gridTemplateColumns: isDesktop
          ? "58px minmax(0, 1fr) auto"
          : "52px minmax(0, 1fr) auto",
        gap: isDesktop ? "10px" : "7px",
        width: isDesktop ? "100%" : "102%",
        margin: isDesktop ? 0 : "0 auto",
        padding: isDesktop ? "11px" : "4px 7px 4px 0",
        borderRadius: isDesktop ? "20px" : 0,
        background: isDesktop
          ? "var(--historietas-seguindo-panel, rgba(4, 0, 10, 0.72))"
          : "transparent",
        border: isDesktop ? "1px solid rgba(255,255,255,0.06)" : "none",
        boxShadow: "none",
      }}
    >
      <Link
        href={hrefPerfil}
        aria-label={`Abrir perfil de ${usuario.nome}`}
        style={{
          ...criarAvatarUsuarioSeguindoStyle(usuario.avatar, authorAvatarStyle),
          ...(isDesktop ? desktopAuthorAvatarStyle : {}),
          width: isDesktop ? "58px" : "52px",
          height: isDesktop ? "58px" : "52px",
          borderRadius: isDesktop ? "17px" : "16px",
          fontSize: isDesktop ? "25px" : "22px",
        }}
      >
        {!usuario.avatar && usuario.nome.slice(0, 1).toUpperCase()}
      </Link>

      <div style={suggestedUserInfoStyle}>
        <Link
          href={hrefPerfil}
          data-historietas-i18n-ignore="true"
          style={suggestedUserNameStyle}
        >
          {usuario.nome}
        </Link>

        <span data-historietas-i18n-ignore="true" style={suggestedUserHandleStyle}>
          {usuario.handle}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onSeguirUsuarioSugestao(usuario)}
        disabled={seguindoAgora}
        style={{
          ...(solicitacaoPendente
            ? suggestedUserRequestPendingButtonStyle
            : suggestedUserFollowButtonStyle),
          opacity: seguindoAgora ? 0.58 : 1,
          cursor: seguindoAgora ? "not-allowed" : "pointer",
        }}
      >
        {seguindoAgora
          ? "..."
          : solicitacaoPendente
            ? "Cancelar"
            : "Seguir"}
      </button>
    </article>
  );
}
