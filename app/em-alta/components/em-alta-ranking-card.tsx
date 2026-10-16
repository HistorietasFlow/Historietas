"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { normalizarTexto } from "../../../lib/utils";
import type { ObraRanking, TipoRanking } from "../lib/em-alta-models";
import { criarLinkPerfilAutorRanking } from "../lib/em-alta-route-utils";
import {
  formatarDataRanking,
  formatarGeneroCard,
  formatarMediaRanking,
  formatarNumero,
} from "../lib/em-alta-ranking-data-utils";
import { obterTemaPosicao } from "../lib/em-alta-ranking-position-theme";
import {
  authorLinkStyle,
  cardContentStyle,
  cardMetaRowStyle,
  cardTopStyle,
  classificationBadgeStyle,
  coroaNumberStyle,
  criarCardRankingStyle,
  criarObraCardTitleRankingStyle,
  criarRankingCoverStyle,
  criarRankingTierInlineBadgeStyle,
  desktopCardContentStyle,
  desktopRankingCardActionRowStyle,
  desktopRankingThemeBadgeStyle,
  formatBadgeStyle,
  heartMetricIconStyle,
  metricIconStyle,
  metricValueStyle,
  publishedStatusStyle,
  rankingCardActionRowStyle,
  rankingThemeBadgeStyle,
  ratingStatsStyle,
  starMetricIconStyle,
  statsItemStyle,
  statsStyle,
  statusRowStyle,
  statusStyle,
} from "../lib/em-alta-ranking-visual-style-utils";

export function RankingCard({
  obra,
  posicao,
  tipo,
  favorita,
  concluida,
  isDesktop,
}: {
  obra: ObraRanking;
  posicao: number;
  tipo: TipoRanking;
  favorita: boolean;
  concluida: boolean;
  isDesktop: boolean;
}) {
  void favorita;
  void concluida;

  const router = useRouter();
  const mostrarClassificacao =
    obra.classificacaoIndicativa &&
    obra.classificacaoIndicativa !== "Não informada";
  const temaPosicao = obterTemaPosicao(posicao);
  const generoCard = formatarGeneroCard(obra.genero);
  const formatoCard = obra.formato.trim() || "História";
  const mostrarGeneroRanking = Boolean(
    generoCard && normalizarTexto(generoCard) !== "nao informado",
  );
  const mostrarFormatoRanking = Boolean(
    formatoCard && normalizarTexto(formatoCard) !== "nao informado",
  );
  const mostrarStatusRanking = normalizarTexto(obra.status) !== "publicado";
  const mostrarFormatoNoTopoRankingMestre =
    tipo === "geral" && mostrarFormatoRanking;
  const destaque =
    tipo === "geral"
      ? `${formatarNumero(obra.pontuacao)} pts`
      : tipo === "lidas"
        ? `${formatarNumero(obra.views)} visualizações`
        : tipo === "curtidas"
          ? `${formatarNumero(obra.curtidas)} curtidas`
          : tipo === "comentadas"
            ? `${formatarNumero(obra.comentarios)} comentários`
            : tipo === "salvas"
              ? `${formatarNumero(obra.salvos)} seguidores`
              : tipo === "recentes"
                ? formatarDataRanking(obra.criadaEmTimestamp)
                : `${formatarNumero(obra.capitulos)} capítulos`;

  function abrirObra() {
    router.push(obra.href);
  }

  return (
    <article
      className="historietas-ranking-card historietas-ranking-work-card"
      data-ranking-level={temaPosicao.nome.toLowerCase()}
      style={criarCardRankingStyle(posicao, obra.disponivel, tipo, isDesktop)}
      role="link"
      tabIndex={0}
      aria-label={`Abrir página da obra ${obra.titulo}`}
      onClick={abrirObra}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          abrirObra();
        }
      }}
    >
      <div style={criarRankingCoverStyle(obra.capa, isDesktop)}>
        {null}
      </div>

      <div style={isDesktop ? desktopCardContentStyle : cardContentStyle}>
        <div style={cardTopStyle}>
          <h3 data-historietas-i18n-ignore="true" style={criarObraCardTitleRankingStyle()}>{obra.titulo}</h3>
        </div>

        <Link
          href={criarLinkPerfilAutorRanking(obra.autor, obra.autorId)}
          style={authorLinkStyle}
          aria-label={`Abrir perfil de ${obra.autor}`}
          onClick={(event) => {
            event.stopPropagation();
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
          }}
        >
          Por{" "}
          <span data-historietas-i18n-ignore="true">{obra.autor}</span>
        </Link>

        {(mostrarFormatoNoTopoRankingMestre ||
          mostrarGeneroRanking ||
          mostrarClassificacao) && (
          <div style={cardMetaRowStyle}>
            {mostrarFormatoNoTopoRankingMestre && (
              <span className="historietas-ranking-level-line" style={formatBadgeStyle}>{formatoCard}</span>
            )}

            {mostrarGeneroRanking && (
              <span className="historietas-ranking-level-line" style={formatBadgeStyle}>{generoCard}</span>
            )}

            {mostrarClassificacao && (
              <span
                className="historietas-ranking-level-line"
                style={classificationBadgeStyle}
              >
                {obra.classificacaoIndicativa}
              </span>
            )}
          </div>
        )}

        {mostrarStatusRanking && (
          <div style={statusRowStyle}>
            <span
              style={obra.tipo === "local" ? publishedStatusStyle : statusStyle}
            >
              {obra.status}
            </span>
          </div>
        )}

        <div style={statsStyle}>
          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={metricIconStyle} aria-hidden="true">
              💬
            </span>
            <span style={metricValueStyle}>
              {formatarNumero(obra.comentarios)}
            </span>
          </span>

          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={metricIconStyle} aria-hidden="true">
              👥
            </span>
            <span style={metricValueStyle}>{formatarNumero(obra.salvos)}</span>
          </span>

          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={metricIconStyle} aria-hidden="true">
              📚
            </span>
            <span style={metricValueStyle}>
              {formatarNumero(obra.capitulos)}
            </span>
          </span>
        </div>

        <div style={ratingStatsStyle}>
          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={metricIconStyle} aria-hidden="true">
              👁
            </span>
            <span style={metricValueStyle}>{formatarNumero(obra.views)}</span>
          </span>

          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={heartMetricIconStyle} aria-hidden="true">
              ❤️
            </span>
            <span style={metricValueStyle}>
              {formatarNumero(obra.curtidas)}
            </span>
          </span>

          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={starMetricIconStyle} aria-hidden="true">
              ★
            </span>
            <span style={metricValueStyle}>
              {formatarMediaRanking(obra.mediaAvaliacao)}
            </span>
          </span>
        </div>

        <div
          style={
            isDesktop
              ? desktopRankingCardActionRowStyle
              : rankingCardActionRowStyle
          }
        >
          <span
            className="historietas-ranking-level-line"
            style={
              isDesktop ? desktopRankingThemeBadgeStyle : rankingThemeBadgeStyle
            }
          >
            {tipo === "geral"
              ? destaque
              : mostrarFormatoRanking
                ? formatoCard
                : "História"}
          </span>

          <span
            className="historietas-ranking-level-line historietas-ranking-tier-badge"
            style={criarRankingTierInlineBadgeStyle(posicao)}
            aria-label={`Posição ${posicao}º — ${temaPosicao.nome}`}
          >
            <span style={coroaNumberStyle}>{posicao}º</span>
            <span style={coroaNumberStyle}>{temaPosicao.nome}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
