"use client";

import Link from "next/link";
import { useHistorietasLanguage } from "./HistorietasLanguageProvider";
import { criarDadosObraLocalCardHome } from "../app/lib/home-local-work-card-view-utils";
import { criarMobileCoverStyle } from "../app/lib/home-cover-hero-style-utils";
import {
  traduzirClassificacaoHome,
  traduzirFormatoHome,
  traduzirGeneroHome,
} from "../app/lib/home-metadata-utils";
import {
  authorLinkStyle,
  cardStatHeartIconStyle,
  cardStatIconStyle,
  cardStatItemStyle,
  cardStatsStyle,
  cardStatValueStyle,
  cardTopRowStyle,
  classificationBadgeStyle,
  continueActionMainTextStyle,
  continueActionSubTextStyle,
  continueActionTextWrapStyle,
  coverPlaceholderCompactHeightStyle,
  desktopCardActionRowStyle,
  desktopCardGenreBadgeStyle,
  desktopCardPrimaryActionStyle,
  desktopCoverPlaceholderCompactHeightStyle,
  desktopCoverPlaceholderStyle,
  desktopPublishedCardCompactHeightStyle,
  desktopPublishedCardStyle,
  desktopPublishedTitleStyle,
  formatBadgeStyle,
  latestChapterInfoStyle,
  mobileCardActionRowStyle,
  mobileCardGenreBadgeStyle,
  mobileCardPrimaryActionStyle,
  pageBackgroundActionButtonStyle,
  progressBarStyle,
  progressCompactStyle,
  progressTextStyle,
  progressTrackStyle,
  publishedCardCompactHeightStyle,
  publishedCardStyle,
  publishedInfoStyle,
  publishedTitleStyle,
  statusRowStyle,
} from "../app/lib/home-work-card-styles";

type CapituloLocalWorkCard = {
  comentario: string;
  criadoEm: string;
  curtiu: boolean;
  id: string;
  lido: boolean;
  lidoEm: string;
  titulo: string;
};

type ObraLocalWorkCard = {
  arquivoObra?: unknown;
  autor: string;
  autorId?: string;
  capa: string;
  capitulos: CapituloLocalWorkCard[];
  classificacaoIndicativa: string;
  criadaEm: string;
  formato: string;
  genero: string;
  id: string;
  link: string;
  publicado: boolean;
  slug: string;
  titulo: string;
  totalComentarios: number;
  totalCurtidas: number;
  ultimaLeituraEm: string;
  ultimoCapituloLidoId: string;
  visualizacoes: number;
};

export default function MobileObraLocalCard({
  obra,
  tipo,
  isDesktop,
}: {
  obra: ObraLocalWorkCard;
  tipo: "continuar" | "catalogo" | "novo-capitulo";
  isDesktop?: boolean;
}) {
  const { language } = useHistorietasLanguage();
  const {
    visualizacoesObra,
    totalCurtidas,
    totalComentarios,
    iconeConteudoObra,
    totalConteudoObra,
    progressoLeitura,
    ultimoCapituloPublicado,
    verObraHref,
    numeroUltimoCapitulo,
    ultimoCapituloHref,
    perfilAutorHref,
    actionHref,
    actionLabel,
    actionSubLabel,
    cardComAlturaExtra,
  } = criarDadosObraLocalCardHome(obra, tipo);
  const cardStyle = isDesktop
    ? cardComAlturaExtra
      ? desktopPublishedCardCompactHeightStyle
      : desktopPublishedCardStyle
    : cardComAlturaExtra
    ? publishedCardCompactHeightStyle
    : publishedCardStyle;
  const capaStyle = isDesktop
    ? {
        ...criarMobileCoverStyle(obra.capa),
        ...(cardComAlturaExtra
          ? desktopCoverPlaceholderCompactHeightStyle
          : desktopCoverPlaceholderStyle),
      }
    : {
        ...criarMobileCoverStyle(obra.capa),
        ...(cardComAlturaExtra ? coverPlaceholderCompactHeightStyle : {}),
      };

  return (
    <article style={cardStyle}>
      <Link href={verObraHref} style={capaStyle} />

      <div style={publishedInfoStyle}>
        <div style={cardTopRowStyle}>
          <h3 style={isDesktop ? desktopPublishedTitleStyle : publishedTitleStyle}>{obra.titulo}</h3>

          <Link href={perfilAutorHref} style={authorLinkStyle}>
            Por {obra.autor}
          </Link>
        </div>

        <div style={statusRowStyle}>
          <span style={formatBadgeStyle}>{traduzirFormatoHome(obra.formato, language)}</span>
          <span style={classificationBadgeStyle}>
            {traduzirClassificacaoHome(obra.classificacaoIndicativa, language)}
          </span>
        </div>

        {tipo === "novo-capitulo" && ultimoCapituloPublicado && (
          <Link href={ultimoCapituloHref} style={latestChapterInfoStyle}>
            Novo cap {numeroUltimoCapitulo} •{" "}
            {ultimoCapituloPublicado.titulo}
          </Link>
        )}

        <div style={cardStatsStyle}>
          <span style={cardStatItemStyle}>
            <span style={cardStatIconStyle}>👁️</span>
            <span style={cardStatValueStyle}>{visualizacoesObra}</span>
          </span>

          <span style={cardStatItemStyle}>
            <span style={cardStatHeartIconStyle}>❤️</span>
            <span style={cardStatValueStyle}>{totalCurtidas}</span>
          </span>

          <span style={cardStatItemStyle}>
            <span style={cardStatIconStyle}>💬</span>
            <span style={cardStatValueStyle}>{totalComentarios}</span>
          </span>

          <span style={cardStatItemStyle}>
            <span style={cardStatIconStyle}>{iconeConteudoObra}</span>
            <span style={cardStatValueStyle}>{totalConteudoObra}</span>
          </span>
        </div>

        {progressoLeitura > 0 && (
          <div style={progressCompactStyle}>
            <div style={progressTrackStyle}>
              <div
                style={{
                  ...progressBarStyle,
                  width: `${progressoLeitura}%`,
                }}
              />
            </div>

            <span style={progressTextStyle}>{progressoLeitura}% lido</span>
          </div>
        )}

        <div style={isDesktop ? desktopCardActionRowStyle : mobileCardActionRowStyle}>
          <span style={isDesktop ? desktopCardGenreBadgeStyle : mobileCardGenreBadgeStyle}>
            {traduzirGeneroHome(obra.genero, language)}
          </span>

          <Link
            href={actionHref}
            style={{
              ...(isDesktop
                ? desktopCardPrimaryActionStyle
                : mobileCardPrimaryActionStyle),
              ...(actionLabel === "Ver obra" ||
              actionLabel === "Continuar" ||
              actionLabel === "Ler agora"
                ? pageBackgroundActionButtonStyle
                : {}),
            }}
          >
            {actionSubLabel ? (
              <span style={continueActionTextWrapStyle}>
                <span style={continueActionMainTextStyle}>{actionLabel}</span>
                <span style={continueActionSubTextStyle}>{actionSubLabel}</span>
              </span>
            ) : (
              actionLabel
            )}
          </Link>
        </div>
      </div>
    </article>
  );
}
