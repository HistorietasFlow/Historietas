"use client";

import Link from "next/link";
import type { KeyboardEventHandler, RefObject } from "react";
import {
  desktopObraActionsMenuStyle,
  metricEmojiIconStyle,
  metricInlineContentStyle,
  metricWhiteNumberStyle,
  obraActionSheetHandleStyle,
  obraActionSheetOverlayStyle,
  obraActionsMenuStyle,
  obraMenuActionsStyle,
  obraMenuAuthorLinkStyle,
  obraMenuAuthorMetricsRowStyle,
  obraMenuHeaderStyle,
  obraMenuItemActiveStyle,
  obraMenuItemButtonStyle,
  obraMenuItemCopiedStyle,
  obraMenuItemDotActiveStyle,
  obraMenuItemDotStyle,
  obraMenuMetricStyle,
  obraMenuMetricsStyle,
  obraMenuSectionLabelStyle,
  obraMenuTagSeparatorStyle,
  obraMenuTagStyle,
  obraMenuTagsStyle,
  obraMenuTitleStyle,
} from "../lib/obra-style-utils";

type ObraActionsSheetProps = {
  titulo: string;
  obraId: string;
  autorNome: string;
  autorHref: string;
  autorBio: string;
  tags: string[];
  metricas: [string, string, string, string];
  indicadorIcone: string;
  indicadorValor: string | number;
  isDesktop: boolean;
  dialogRef: RefObject<HTMLElement | null>;
  obraFavoritada: boolean;
  obraConcluida: boolean;
  linkCopiado: boolean;
  mostrarDenuncia: boolean;
  onFechar: () => void;
  onKeyDown: KeyboardEventHandler<HTMLElement>;
  onSalvar: () => void;
  onConcluir: () => void;
  onDenunciar: () => void;
  onCompartilhar: () => void;
};

export default function ObraActionsSheet({
  titulo,
  obraId,
  autorNome,
  autorHref,
  autorBio,
  tags,
  metricas,
  indicadorIcone,
  indicadorValor,
  isDesktop,
  dialogRef,
  obraFavoritada,
  obraConcluida,
  linkCopiado,
  mostrarDenuncia,
  onFechar,
  onKeyDown,
  onSalvar,
  onConcluir,
  onDenunciar,
  onCompartilhar,
}: ObraActionsSheetProps) {
  const icones = ["👁", "❤️", "💬", "🔖"];

  return (
    <div
      style={obraActionSheetOverlayStyle}
      role="presentation"
      onClick={onFechar}
    >
      <section
        ref={dialogRef}
        style={
          isDesktop ? desktopObraActionsMenuStyle : obraActionsMenuStyle
        }
        role="dialog"
        aria-modal="true"
        aria-label={`Ações da obra ${titulo}`}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={obraActionSheetHandleStyle} aria-hidden="true" />

        <div style={obraMenuHeaderStyle}>
          <strong
            data-historietas-i18n-ignore="true"
            style={obraMenuTitleStyle}
          >
            {titulo}
          </strong>

          <div style={obraMenuAuthorMetricsRowStyle}>
            <Link
              href={autorHref}
              style={obraMenuAuthorLinkStyle}
              aria-label={`Abrir perfil do autor ${autorNome}`}
              title={autorBio || undefined}
            >
              Por{" "}
              <span data-historietas-i18n-ignore="true">{autorNome}</span>
            </Link>
          </div>

          <div style={obraMenuTagsStyle}>
            {tags
              .filter((tag) => tag.trim())
              .slice(0, 10)
              .map((tag, index) => (
                <span
                  key={`${obraId}-menu-tag-${tag}-${index}`}
                  style={obraMenuTagStyle}
                >
                  {index > 0 ? (
                    <span style={obraMenuTagSeparatorStyle}>•</span>
                  ) : null}
                  {tag}
                </span>
              ))}
          </div>

          <div style={obraMenuMetricsStyle}>
            {metricas.map((metrica, index) => (
              <span key={icones[index]} style={obraMenuMetricStyle}>
                <span style={metricInlineContentStyle}>
                  <span style={metricEmojiIconStyle}>{icones[index]}</span>
                  <span style={metricWhiteNumberStyle}>{metrica}</span>
                </span>
              </span>
            ))}

            <span style={obraMenuMetricStyle}>
              <span style={metricInlineContentStyle}>
                <span style={metricEmojiIconStyle}>{indicadorIcone}</span>
                <span style={metricWhiteNumberStyle}>{indicadorValor}</span>
              </span>
            </span>
          </div>
        </div>

        <span style={obraMenuSectionLabelStyle}>Ações</span>

        <div style={obraMenuActionsStyle}>
          <button
            type="button"
            data-dialog-initial-focus="true"
            onClick={onSalvar}
            style={
              obraFavoritada ? obraMenuItemActiveStyle : obraMenuItemButtonStyle
            }
          >
            <span>{obraFavoritada ? "Salvo" : "Salvar"}</span>
            <span
              style={
                obraFavoritada
                  ? obraMenuItemDotActiveStyle
                  : obraMenuItemDotStyle
              }
            >
              {obraFavoritada ? "✓" : ""}
            </span>
          </button>

          <button
            type="button"
            onClick={onConcluir}
            style={
              obraConcluida ? obraMenuItemActiveStyle : obraMenuItemButtonStyle
            }
          >
            <span>{obraConcluida ? "Concluída" : "Concluir"}</span>
            <span
              style={
                obraConcluida
                  ? obraMenuItemDotActiveStyle
                  : obraMenuItemDotStyle
              }
            >
              {obraConcluida ? "✓" : ""}
            </span>
          </button>

          {mostrarDenuncia ? (
            <button
              type="button"
              onClick={onDenunciar}
              style={obraMenuItemButtonStyle}
            >
              <span>Denunciar</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={onCompartilhar}
            style={
              linkCopiado ? obraMenuItemCopiedStyle : obraMenuItemButtonStyle
            }
          >
            <span>{linkCopiado ? "Link copiado!" : "Compartilhar"}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
