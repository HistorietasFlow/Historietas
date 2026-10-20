"use client";

import Link from "next/link";
import { authorNameStyle } from "../lib/seguindo-author-name-style";
import {
  authorActionsGridStyle,
  authorBadgeRowStyle,
  authorContentStyle,
  desktopAuthorActionsGridStyle,
} from "../lib/seguindo-author-content-styles";
import {
  authorAvatarStyle,
  authorCardStyle,
} from "../lib/seguindo-author-card-styles";
import {
  authorReadingMetaStyle,
  authorWorksMetaStyle,
} from "../lib/seguindo-card-badges-styles";
import {
  actionsStyle,
  readButtonStyle,
  unfollowButtonStyle,
} from "../lib/seguindo-card-action-styles";
import {
  desktopAuthorFollowedAvatarStyle,
  desktopAuthorFollowedCardStyle,
} from "../lib/seguindo-desktop-author-avatar-styles";
import type { AutorSeguido } from "../lib/seguindo-page-types";
import { criarHrefPerfilAutorSeguindo } from "../lib/seguindo-route-utils";

type SeguindoFollowedAuthorCardProps = {
  autor: AutorSeguido;
  isDesktop: boolean;
  onDeixarDeSeguirAutor: (chaveAutor: string) => void;
};

export function SeguindoFollowedAuthorCard({
  autor,
  isDesktop,
  onDeixarDeSeguirAutor,
}: SeguindoFollowedAuthorCardProps) {
  return (
    <article
      style={
        isDesktop
          ? desktopAuthorFollowedCardStyle
          : authorCardStyle
      }
    >
      <div
        style={
          isDesktop
            ? desktopAuthorFollowedAvatarStyle
            : authorAvatarStyle
        }
      >
        {autor.nome.slice(0, 1).toUpperCase()}
      </div>

      <div style={authorContentStyle}>
        <div style={authorBadgeRowStyle}>
          <span style={authorWorksMetaStyle}>
            {autor.obras.length} {" "}
            {autor.obras.length === 1 ? "obra" : "obras"}
          </span>

          {autor.totalEmLeitura > 0 && (
            <span style={authorReadingMetaStyle}>
              {autor.totalEmLeitura} em leitura
            </span>
          )}
        </div>

        <h3 data-historietas-i18n-ignore="true" style={authorNameStyle}>{autor.nome}</h3>

        <div style={actionsStyle}>
          <div style={isDesktop ? desktopAuthorActionsGridStyle : authorActionsGridStyle}>
            <Link
              href={criarHrefPerfilAutorSeguindo(
                autor.nome,
                autor.autorId
              )}
              style={readButtonStyle}
            >
              Abrir perfil
            </Link>

            <button
              type="button"
              onClick={() => onDeixarDeSeguirAutor(autor.chave)}
              style={unfollowButtonStyle}
            >
              Deixar de seguir
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
