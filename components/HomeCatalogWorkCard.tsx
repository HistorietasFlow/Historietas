"use client";

import Link from "next/link";
import { useHistorietasLanguage } from "./HistorietasLanguageProvider";
import { criarDadosObraCatalogoCardHome } from "../app/lib/home-catalog-work-card-view-utils";
import { obterFormatoObraCatalogoHome } from "../app/lib/home-catalog-utils";
import {
  traduzirClassificacaoHome,
  traduzirFormatoHome,
  traduzirGeneroHome,
} from "../app/lib/home-metadata-utils";
import { criarMobileCoverThumbStyle } from "../app/lib/home-cover-hero-style-utils";
import {
  authorStyle,
  cardStatHeartIconStyle,
  cardStatIconStyle,
  cardStatItemStyle,
  cardStatsStyle,
  cardStatValueStyle,
  cardTopRowStyle,
  classificationBadgeStyle,
  desktopCardActionRowStyle,
  desktopCardGenreBadgeStyle,
  desktopCardPrimaryActionStyle,
  desktopCardSecondaryActionStyle,
  desktopObraCardSoonStyle,
  desktopObraCardStyle,
  desktopObraTitleStyle,
  formatBadgeStyle,
  mobileCardActionRowStyle,
  mobileCardGenreBadgeStyle,
  mobileCardPrimaryActionStyle,
  mobileCardSecondaryActionStyle,
  obraCardSoonStyle,
  obraCardStyle,
  obraInfoStyle,
  obraTitleStyle,
  pageBackgroundActionButtonStyle,
  statusRowStyle,
} from "../app/lib/home-work-card-styles";

type ObraCatalogoCardHome = {
  arquivoObra?: unknown;
  autor: string;
  capa?: string;
  capaUrl?: string;
  capitulos?: unknown;
  classificacaoIndicativa: string;
  comentarios: string;
  cover?: string;
  disponivel: boolean;
  formato: string;
  genero: string;
  imagem?: string;
  likes: string;
  link: string;
  slug: string;
  titulo: string;
  views: string;
};

export default function MobileObraCard({ obra, isDesktop }: { obra: ObraCatalogoCardHome; isDesktop?: boolean }) {
  const { language } = useHistorietasLanguage();
  const { obraHref, iconeConteudoObra, totalConteudoObra } =
    criarDadosObraCatalogoCardHome(obra);

  const conteudoCard = (
    <>
      <div
        style={
          isDesktop
            ? {
                ...criarMobileCoverThumbStyle(obra),
                minHeight: "122px",
                borderRadius: "16px",
              }
            : criarMobileCoverThumbStyle(obra)
        }
      />

      <div style={obraInfoStyle}>
        <div style={cardTopRowStyle}>
          <h3 style={isDesktop ? desktopObraTitleStyle : obraTitleStyle}>{obra.titulo}</h3>

          <p style={authorStyle}>Por {obra.autor}</p>
        </div>

        <div style={statusRowStyle}>
          <span style={formatBadgeStyle}>{traduzirFormatoHome(obterFormatoObraCatalogoHome(obra), language)}</span>
          <span style={classificationBadgeStyle}>
            {traduzirClassificacaoHome(obra.classificacaoIndicativa, language)}
          </span>
        </div>

        <div style={cardStatsStyle}>
          <span style={cardStatItemStyle}>
            <span style={cardStatIconStyle}>👁️</span>
            <span style={cardStatValueStyle}>{obra.views}</span>
          </span>

          <span style={cardStatItemStyle}>
            <span style={cardStatHeartIconStyle}>❤️</span>
            <span style={cardStatValueStyle}>{obra.likes}</span>
          </span>

          <span style={cardStatItemStyle}>
            <span style={cardStatIconStyle}>💬</span>
            <span style={cardStatValueStyle}>{obra.comentarios}</span>
          </span>

          <span style={cardStatItemStyle}>
            <span style={cardStatIconStyle}>{iconeConteudoObra}</span>
            <span style={cardStatValueStyle}>{totalConteudoObra}</span>
          </span>

         </div>

        <div style={isDesktop ? desktopCardActionRowStyle : mobileCardActionRowStyle}>
          <span style={isDesktop ? desktopCardGenreBadgeStyle : mobileCardGenreBadgeStyle}>
            {traduzirGeneroHome(obra.genero, language)}
          </span>

          <span
            style={{
              ...(obra.disponivel
                ? isDesktop
                  ? desktopCardPrimaryActionStyle
                  : mobileCardPrimaryActionStyle
                : isDesktop
                  ? desktopCardSecondaryActionStyle
                  : mobileCardSecondaryActionStyle),
              ...(obra.disponivel
                ? pageBackgroundActionButtonStyle
                : {}),
            }}
          >
            {obra.disponivel ? "Ver obra" : "Ver detalhes"}
          </span>
        </div>
      </div>
    </>
  );

  return (
    <Link
      href={obraHref}
      style={
        isDesktop
          ? obra.disponivel
            ? desktopObraCardStyle
            : desktopObraCardSoonStyle
          : obra.disponivel
            ? obraCardStyle
            : obraCardSoonStyle
      }
      aria-label={`Abrir página da obra ${obra.titulo}`}
    >
      {conteudoCard}
    </Link>
  );
}
