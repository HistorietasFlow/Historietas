"use client";

import Link from "next/link";
import { criarSlugBase } from "../../../lib/utils";
import {
  actionsStyle,
  readButtonStyle,
  unfollowButtonStyle,
} from "../lib/seguindo-card-action-styles";
import {
  badgeRowStyle,
  classificationBadgeStyle,
} from "../lib/seguindo-card-badges-styles";
import {
  cardStyle,
  coverStyle,
  desktopCardStyle,
  desktopCoverStyle,
} from "../lib/seguindo-card-base-styles";
import {
  authorLinkStyle,
  cardTitleStyle,
} from "../lib/seguindo-card-title-link-styles";
import {
  contentStyle,
  desktopContentStyle,
  genreStyle,
  overlayStyle,
} from "../lib/seguindo-card-overlay-styles";
import { formatarGeneroSeguindo } from "../lib/seguindo-format-utils";
import { criarCoverStyle } from "../lib/seguindo-image-style-utils";
import type { ObraLocal } from "../lib/seguindo-page-types";
import { criarHrefPerfilAutorSeguindo } from "../lib/seguindo-route-utils";
import { mostrarClassificacao } from "../lib/seguindo-work-presentation-utils";

type SeguindoWorkCardProps = {
  obra: ObraLocal;
  isDesktop: boolean;
  visualizandoListaSocialDoPerfil: boolean;
  onDeixarDeSeguirObra: (obra: ObraLocal) => void;
};

export function SeguindoWorkCard({
  obra,
  isDesktop,
  visualizandoListaSocialDoPerfil,
  onDeixarDeSeguirObra,
}: SeguindoWorkCardProps) {
  const obraHref =
    obra.link ||
    `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;

  return (
    <article style={isDesktop ? desktopCardStyle : cardStyle}>
      <div style={criarCoverStyle(obra.capa, isDesktop ? desktopCoverStyle : coverStyle)}>
        <div style={overlayStyle} />

      </div>

      <div style={isDesktop ? desktopContentStyle : contentStyle}>
        <div style={badgeRowStyle}>
          <span style={genreStyle}>
            {obra.formato || "Obra"}
          </span>

          <span style={genreStyle}>
            {formatarGeneroSeguindo(obra.genero)}
          </span>

          {mostrarClassificacao(obra) && (
            <span style={classificationBadgeStyle}>
              {obra.classificacaoIndicativa}
            </span>
          )}

        </div>

        <h3 data-historietas-i18n-ignore="true" style={cardTitleStyle}>{obra.titulo}</h3>

        <Link
          href={criarHrefPerfilAutorSeguindo(
            obra.autor,
            obra.autorId
          )}
          style={authorLinkStyle}
        >
          Por <span data-historietas-i18n-ignore="true">{obra.autor}</span>
        </Link>

        <div
          style={{
            ...actionsStyle,
            gridTemplateColumns:
              visualizandoListaSocialDoPerfil
                ? "minmax(0, 1fr)"
                : "minmax(0, 1fr) auto",
            alignItems: "stretch",
            marginTop: isDesktop ? "auto" : undefined,
          }}
        >
          <Link
            href={obraHref}
            style={{
              ...readButtonStyle,
              width: "100%",
              minHeight: isDesktop ? "32px" : "28px",
            }}
          >
            Ver obra
          </Link>

          {!visualizandoListaSocialDoPerfil && (
            <button
              type="button"
              onClick={() => onDeixarDeSeguirObra(obra)}
              style={{
                ...unfollowButtonStyle,
                minWidth: isDesktop ? "112px" : "104px",
                minHeight: isDesktop ? "32px" : "28px",
              }}
            >
              Deixar de seguir
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
