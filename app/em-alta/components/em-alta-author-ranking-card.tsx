"use client";

import { useRouter } from "next/navigation";
import type { AutorRanking } from "../lib/em-alta-models";
import {
  formatarMediaRanking,
  formatarNumero,
} from "../lib/em-alta-ranking-data-utils";
import { obterTemaPosicao } from "../lib/em-alta-ranking-position-theme";
import {
  authorRankingAvatarInitialStyle,
  authorRankingMetaStackStyle,
  authorRankingScoreRowStyle,
  authorRankingTitleAreaStyle,
  authorRankingWorksBadgeStyle,
  cardContentStyle,
  coroaNumberStyle,
  criarAutorAvatarRankingStyle,
  criarAutorCardTitleRankingStyle,
  criarAutorPointsBadgeStyle,
  criarAutorTierInlineBadgeStyle,
  criarCardRankingStyle,
  desktopCardContentStyle,
  heartMetricIconStyle,
  metricIconStyle,
  metricValueStyle,
  ratingStatsStyle,
  starMetricIconStyle,
  statsItemStyle,
  statsStyle,
} from "../lib/em-alta-ranking-visual-style-utils";

export function AutorRankingCard({
  autor,
  posicao,
  isDesktop,
}: {
  autor: AutorRanking;
  posicao: number;
  isDesktop: boolean;
}) {
  const router = useRouter();
  const inicialAutor = autor.nome.trim().charAt(0).toUpperCase() || "A";
  const temaPosicao = obterTemaPosicao(posicao);
  const avatarAutor = autor.avatar.trim();

  function abrirPerfil() {
    router.push(autor.href);
  }

  return (
    <article
      className="historietas-ranking-card historietas-ranking-author-card"
      data-ranking-level={temaPosicao.nome.toLowerCase()}
      style={criarCardRankingStyle(posicao, true, "geral", isDesktop)}
      role="link"
      tabIndex={0}
      aria-label={`Abrir perfil de ${autor.nome}`}
      onClick={abrirPerfil}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          abrirPerfil();
        }
      }}
    >
      <div
        style={criarAutorAvatarRankingStyle(avatarAutor, posicao, isDesktop)}
      >
        {!avatarAutor && (
          <span style={authorRankingAvatarInitialStyle}>{inicialAutor}</span>
        )}
      </div>

      <div style={isDesktop ? desktopCardContentStyle : cardContentStyle}>
        <div style={authorRankingTitleAreaStyle}>
          <h3 data-historietas-i18n-ignore="true" style={criarAutorCardTitleRankingStyle()}>{autor.nome}</h3>
        </div>

        <div style={authorRankingMetaStackStyle}>
          <span style={authorRankingWorksBadgeStyle}>
            {formatarNumero(autor.obras)}{" "}
            {autor.obras === 1 ? "Obra Publicada" : "Obras Publicadas"}
          </span>
        </div>

        <div style={statsStyle}>
          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={metricIconStyle} aria-hidden="true">
              💬
            </span>
            <span style={metricValueStyle}>
              {formatarNumero(autor.comentarios)}
            </span>
          </span>

          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={metricIconStyle} aria-hidden="true">
              👥
            </span>
            <span style={metricValueStyle}>
              {formatarNumero(autor.seguidores)}
            </span>
          </span>

          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={metricIconStyle} aria-hidden="true">
              📚
            </span>
            <span style={metricValueStyle}>
              {formatarNumero(autor.capitulos)}
            </span>
          </span>
        </div>

        <div style={ratingStatsStyle}>
          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={metricIconStyle} aria-hidden="true">
              👁
            </span>
            <span style={metricValueStyle}>{formatarNumero(autor.views)}</span>
          </span>

          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={heartMetricIconStyle} aria-hidden="true">
              ❤️
            </span>
            <span style={metricValueStyle}>
              {formatarNumero(autor.curtidas)}
            </span>
          </span>

          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={starMetricIconStyle} aria-hidden="true">
              ★
            </span>
            <span style={metricValueStyle}>
              {formatarMediaRanking(autor.mediaAvaliacao)}
            </span>
          </span>
        </div>

        <div style={authorRankingScoreRowStyle}>
          <span className="historietas-ranking-level-line" style={criarAutorPointsBadgeStyle()}>
            {formatarNumero(autor.pontuacao)} pts
          </span>

          <span
            className="historietas-ranking-level-line historietas-ranking-tier-badge"
            style={criarAutorTierInlineBadgeStyle(posicao)}
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
