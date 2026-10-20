"use client";

import { useRouter } from "next/navigation";
import { criarAvatarUsuarioSeguindoStyle } from "../lib/seguindo-image-style-utils";
import { criarHrefPerfilUsuarioSeguindo } from "../lib/seguindo-route-utils";
import { authorNameStyle } from "../lib/seguindo-author-name-style";
import {
  authorCardStyle,
  authorAvatarStyle,
  desktopAuthorCardStyle,
} from "../lib/seguindo-author-card-styles";
import { authorContentStyle } from "../lib/seguindo-author-content-styles";
import { authorLinkStyle } from "../lib/seguindo-card-title-link-styles";
import { unfollowButtonStyle } from "../lib/seguindo-card-action-styles";
import { desktopAuthorAvatarStyle } from "../lib/seguindo-desktop-author-avatar-styles";
import type { UsuarioSeguido } from "../lib/seguindo-page-types";

type SeguindoSocialUserCardProps = {
  usuario: UsuarioSeguido;
  isDesktop: boolean;
  podeRemoverUsuariosDaLista: boolean;
  podeRemoverSeguidoresDaLista: boolean;
  usuarioListaAlterandoId: string | null;
  onRemoverSeguidorUsuario: (usuarioId: string) => void;
  onDeixarDeSeguirUsuario: (usuarioId: string) => void;
};

export function SeguindoSocialUserCard({
  usuario,
  isDesktop,
  podeRemoverUsuariosDaLista,
  podeRemoverSeguidoresDaLista,
  usuarioListaAlterandoId,
  onRemoverSeguidorUsuario,
  onDeixarDeSeguirUsuario,
}: SeguindoSocialUserCardProps) {
  const router = useRouter();
  const hrefPerfilUsuario = criarHrefPerfilUsuarioSeguindo(usuario);

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`Abrir perfil de ${usuario.nome}`}
      onClick={() => router.push(hrefPerfilUsuario)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(hrefPerfilUsuario);
        }
      }}
      style={{
        ...(isDesktop ? desktopAuthorCardStyle : authorCardStyle),
        gridTemplateColumns: isDesktop
          ? "58px minmax(0, 1fr)"
          : "52px minmax(0, 1fr)",
        gap: isDesktop ? "7px" : "6px",
        width: isDesktop ? "100%" : "102%",
        margin: isDesktop ? 0 : "0 auto",
        padding: isDesktop ? "11px" : "4px 7px 4px 0",
        borderRadius: isDesktop ? "20px" : 0,
        background: isDesktop
          ? "var(--historietas-seguindo-panel, rgba(4, 0, 10, 0.72))"
          : "transparent",
        border: isDesktop ? "1px solid rgba(255,255,255,0.06)" : "none",
        boxShadow: "none",
        cursor: "pointer",
      }}
    >
      <div
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
      </div>

      <div
        style={{
          ...authorContentStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: isDesktop ? "10px" : "7px",
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "grid",
            gap: "2px",
            minWidth: 0,
            flex: "1 1 auto",
          }}
        >
          <h3
            data-historietas-i18n-ignore="true"
            style={{
              ...authorNameStyle,
              fontSize: isDesktop ? "17px" : "15px",
              lineHeight: 1.05,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {usuario.nome}
          </h3>

          <span
            data-historietas-i18n-ignore="true"
            style={{
              ...authorLinkStyle,
              fontSize: isDesktop ? "11px" : "10px",
              lineHeight: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {usuario.handle}
          </span>
        </div>

        {(podeRemoverUsuariosDaLista || podeRemoverSeguidoresDaLista) && (
          <button
            type="button"
            disabled={usuarioListaAlterandoId === usuario.id}
            onClick={(event) => {
              event.stopPropagation();

              if (podeRemoverSeguidoresDaLista) {
                onRemoverSeguidorUsuario(usuario.id);
                return;
              }

              onDeixarDeSeguirUsuario(usuario.id);
            }}
            onKeyDown={(event) => event.stopPropagation()}
            style={{
              ...unfollowButtonStyle,
              width: isDesktop ? "112px" : "92px",
              minWidth: isDesktop ? "112px" : "92px",
              minHeight: "25px",
              padding: "0 3px",
              fontSize: "9px",
              flex: "0 0 auto",
              opacity: usuarioListaAlterandoId === usuario.id ? 0.58 : 1,
              cursor:
                usuarioListaAlterandoId === usuario.id
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {usuarioListaAlterandoId === usuario.id
              ? "..."
              : podeRemoverSeguidoresDaLista
                ? "Remover seguidor"
                : "Deixar de seguir"}
          </button>
        )}
      </div>
    </article>
  );
}
