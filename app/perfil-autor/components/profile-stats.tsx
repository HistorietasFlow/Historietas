import Link from "next/link";
import type { HistorietasLanguage } from "../../../lib/i18n";
import {
  desktopProfileStatsStyle,
  profileStatLabelStyle,
  profileStatLinkStyle,
  profileStatsStyle,
  profileStatWorksLabelStyle,
  profileStatWorksNumberStyle,
  profileStatNumberStyle,
} from "../styles";
import { ProfileRatingSummary } from "./profile-rating-summary";

type ProfileStatsProps = {
  avaliacaoDiarioPrivada: boolean;
  avaliacaoEhDiario: boolean;
  avaliacaoMedia: number;
  avaliacaoTotal: number;
  avaliacaoVisivel: boolean;
  autorNome: string;
  isDesktop: boolean;
  language: HistorietasLanguage;
  obrasSeguidasHref: string;
  obrasSeguidasTotal: number;
  seguidoresHref: string;
  seguidoresTotal: number;
  seguindoHref: string;
  seguindoTotal: number;
};

export function ProfileStats({
  avaliacaoDiarioPrivada,
  avaliacaoEhDiario,
  avaliacaoMedia,
  avaliacaoTotal,
  avaliacaoVisivel,
  autorNome,
  isDesktop,
  language,
  obrasSeguidasHref,
  obrasSeguidasTotal,
  seguidoresHref,
  seguidoresTotal,
  seguindoHref,
  seguindoTotal,
}: ProfileStatsProps) {
  const statsStyle = isDesktop ? desktopProfileStatsStyle : profileStatsStyle;

  return (
    <div
      style={
        avaliacaoVisivel
          ? {
              ...statsStyle,
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            }
          : statsStyle
      }
    >
      <Link
        href={obrasSeguidasHref}
        style={profileStatLinkStyle}
        aria-label={`Abrir obras seguidas por ${autorNome}`}
      >
        <strong style={profileStatWorksNumberStyle}>
          {obrasSeguidasTotal}
        </strong>
        <span style={profileStatWorksLabelStyle}>
          {language === "en" ? (
            <>
              <span>works</span>
              <span>followed</span>
            </>
          ) : language === "es" ? (
            <>
              <span>obras</span>
              <span>seguidas</span>
            </>
          ) : (
            <>
              <span>obras</span>
              <span>seguidas</span>
            </>
          )}
        </span>
      </Link>

      <Link
        href={seguidoresHref}
        style={profileStatLinkStyle}
        aria-label={`Abrir lista de seguidores de ${autorNome}`}
      >
        <strong style={profileStatNumberStyle}>{seguidoresTotal}</strong>
        <span style={profileStatLabelStyle}>seguidores</span>
      </Link>

      <Link
        href={seguindoHref}
        style={profileStatLinkStyle}
        aria-label={`Abrir lista de perfis que ${autorNome} segue`}
      >
        <strong style={profileStatNumberStyle}>{seguindoTotal}</strong>
        <span style={profileStatLabelStyle}>seguindo</span>
      </Link>

      {avaliacaoVisivel && (
        <ProfileRatingSummary
          diarioPrivada={avaliacaoDiarioPrivada}
          ehDiario={avaliacaoEhDiario}
          language={language}
          media={avaliacaoMedia}
          total={avaliacaoTotal}
        />
      )}
    </div>
  );
}
