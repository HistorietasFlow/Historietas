import Link from "next/link";

import {
  desktopHeroBottomMetaBarStyle,
  desktopHeroStatsStyle,
  heroBottomAuthorLinkStyle,
  heroBottomMetaBarStyle,
  heroBottomMetricStyle,
  heroBottomMetricsStyle,
  metricEmojiIconStyle,
  metricInlineContentStyle,
  metricWhiteNumberStyle,
} from "../lib/obra-style-utils";

type ObraHeroMetaBarProps = {
  isDesktop: boolean;
  autorNome: string;
  autorHref: string;
  autorBio: string;
  visualizacoes: string;
  curtidas: string;
  comentarios: string;
};

export default function ObraHeroMetaBar({
  isDesktop,
  autorNome,
  autorHref,
  autorBio,
  visualizacoes,
  curtidas,
  comentarios,
}: ObraHeroMetaBarProps) {
  return (
    <div
      style={
        isDesktop
          ? desktopHeroBottomMetaBarStyle
          : heroBottomMetaBarStyle
      }
    >
      {!isDesktop ? (
        <Link
          href={autorHref}
          style={heroBottomAuthorLinkStyle}
          aria-label={`Abrir perfil do autor ${autorNome}`}
          title={autorBio || undefined}
        >
          Por{" "}
          <span data-historietas-i18n-ignore="true">
            {autorNome}
          </span>
        </Link>
      ) : null}

      <div
        style={
          isDesktop
            ? desktopHeroStatsStyle
            : heroBottomMetricsStyle
        }
      >
        <span style={heroBottomMetricStyle}>
          <span style={metricInlineContentStyle}>
            <span style={metricEmojiIconStyle}>👁</span>
            <span style={metricWhiteNumberStyle}>{visualizacoes}</span>
          </span>
        </span>

        <span style={heroBottomMetricStyle}>
          <span style={metricInlineContentStyle}>
            <span style={metricEmojiIconStyle}>❤️</span>
            <span style={metricWhiteNumberStyle}>{curtidas}</span>
          </span>
        </span>

        <span style={heroBottomMetricStyle}>
          <span style={metricInlineContentStyle}>
            <span style={metricEmojiIconStyle}>💬</span>
            <span style={metricWhiteNumberStyle}>{comentarios}</span>
          </span>
        </span>
      </div>
    </div>
  );
}
