"use client";

import Link from "next/link";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import { criarSlugBase } from "../../../lib/utils";
import type { ObraLocal } from "../lib/explorar-work-normalizers";
import { normalizarContadorExplorar, totalCurtidasObra, totalComentariosObra, calcularProgressoLeitura } from "../lib/explorar-work-normalizers";
import { traduzirTextoExplorar, traduzirGeneroExplorar, traduzirFormatoExplorar, traduzirClassificacaoExplorar } from "../lib/explorar-translations";
import { criarPerfilAutorHrefExplorar } from "../lib/explorar-author-route-utils";
import {
  criarPublishedCardTemaStyle,
  criarDesktopPublishedCardTemaStyle,
  criarDesktopPublishedCoverStyle,
  criarProgressTrackStyle,
  criarProgressBarStyle,
  criarCardPrimaryActionStyle,
  cardTopStyle,
  publishedTitleStyle,
  statusRowStyle,
  draftStatusStyle,
  formatBadgeStyle,
  classificationBadgeStyle,
  authorLinkStyle,
  publishedInfoStyle,
  desktopPublishedInfoStyle,
  desktopPublishedSynopsisStyle,
  statsStyle,
  metricItemStyle,
  metricIconStyle,
  heartMetricIconStyle,
  progressCompactStyle,
  progressTextStyle,
  cardActionRowStyle,
  cardGenreBadgeStyle,
  desktopCardActionRowStyle,
  desktopCardGenreBadgeStyle,
  desktopPublishedTitleStyle,
  criarPublishedCoverStyle,
} from "../lib/explorar-content-styles";

export default function ObraPublicadaCard({
  obra,
  isDesktop,
}: {
  obra: ObraLocal;
  isDesktop?: boolean;
}) {
  const { language } = useHistorietasLanguage();
  const totalCurtidas = totalCurtidasObra(obra);
  const totalComentarios = totalComentariosObra(obra);
  const totalVisualizacoes = normalizarContadorExplorar(obra.visualizacoes);
  const progressoLeitura = calcularProgressoLeitura(obra.capitulos);
  const paginaPublicaHref = `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
  const perfilAutorHref = criarPerfilAutorHrefExplorar(
    obra.autor,
    obra.autorId
  );

  return (
    <article style={isDesktop ? criarDesktopPublishedCardTemaStyle() : criarPublishedCardTemaStyle()}>
      <Link
        href={paginaPublicaHref}
        style={
          isDesktop
            ? criarDesktopPublishedCoverStyle(obra.capa)
            : criarPublishedCoverStyle(obra.capa)
        }
        aria-label={
          obra.titulo === "Obra sem título"
            ? traduzirTextoExplorar(obra.titulo, language)
            : obra.titulo
        }
      >
        {!obra.capa && null}
      </Link>

      <div style={isDesktop ? desktopPublishedInfoStyle : publishedInfoStyle}>
        <div style={cardTopStyle}>
          <h3 style={isDesktop ? desktopPublishedTitleStyle : publishedTitleStyle}>
            {obra.titulo === "Obra sem título"
              ? traduzirTextoExplorar(obra.titulo, language)
              : obra.titulo}
          </h3>

          <Link href={perfilAutorHref} style={authorLinkStyle}>
            {traduzirTextoExplorar("Por", language)}{" "}
            {obra.autor === "Autor não informado"
              ? traduzirTextoExplorar(obra.autor, language)
              : obra.autor}
          </Link>
        </div>

        <div style={statusRowStyle}>
          {!obra.publicado && (
            <span style={draftStatusStyle}>
              {traduzirTextoExplorar("Rascunho", language)}
            </span>
          )}

          <span style={formatBadgeStyle}>
            {traduzirFormatoExplorar(obra.formato, language)}
          </span>

          <span style={classificationBadgeStyle}>
            {traduzirClassificacaoExplorar(
              obra.classificacaoIndicativa,
              language
            )}
          </span>
        </div>

        {isDesktop && (
          <p style={desktopPublishedSynopsisStyle}>
            {obra.sinopse === "Nenhuma sinopse informada."
              ? traduzirTextoExplorar(obra.sinopse, language)
              : obra.sinopse}
          </p>
        )}

        <div style={statsStyle}>
          <span style={metricItemStyle}>
            <span style={metricIconStyle}>👁️</span>
            {totalVisualizacoes}
          </span>

          <span style={metricItemStyle}>
            <span style={heartMetricIconStyle}>❤️</span>
            {totalCurtidas}
          </span>

          <span style={metricItemStyle}>
            <span style={metricIconStyle}>💬</span>
            {totalComentarios}
          </span>

          <span style={metricItemStyle}>
            <span style={metricIconStyle}>
              {obra.capitulos.length > 0 ? "📚" : obra.arquivoObra ? "📄" : "📚"}
            </span>
            {obra.capitulos.length > 0
              ? `${obra.capitulos.length}`
              : obra.arquivoObra
                ? "1"
                : "0"}
          </span>
        </div>

        {progressoLeitura > 0 && (
          <div style={progressCompactStyle}>
            <div style={criarProgressTrackStyle()}>
              <div
                style={{
                  ...criarProgressBarStyle(),
                  width: `${progressoLeitura}%`,
                }}
              />
            </div>

            <span style={progressTextStyle}>{progressoLeitura}%</span>
          </div>
        )}

        <div style={isDesktop ? desktopCardActionRowStyle : cardActionRowStyle}>
          <span style={isDesktop ? desktopCardGenreBadgeStyle : cardGenreBadgeStyle}>
            {traduzirGeneroExplorar(obra.genero, language)}
          </span>

          <Link
            href={paginaPublicaHref}
            data-historietas-page-background-action="true"
            style={criarCardPrimaryActionStyle(isDesktop)}
          >
            {traduzirTextoExplorar("Ver obra", language)}
          </Link>
        </div>
      </div>
    </article>
  );
}
