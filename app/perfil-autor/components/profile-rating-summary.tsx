import type { HistorietasLanguage } from "../../../lib/i18n";
import { NOTAS_AVALIACAO_AUTOR } from "../constants";
import {
  formatarMediaAvaliacaoAutor,
  formatarTotalAvaliacoesAutor,
  formatarTotalAvaliacoesDiario,
  obterPreenchimentoEstrelaAutor,
} from "../lib/profile-formatters";
import {
  profileRatingMiniStarBaseStyle,
  profileRatingMiniStarFillStyle,
  profileRatingMiniStarsStyle,
  profileRatingMiniStarVisualStyle,
  profileRatingNumberStyle,
  profileRatingPrivateLockStyle,
  profileRatingStackedMetaStyle,
  profileRatingStatItemStyle,
  profileRatingTotalStyle,
} from "../styles";
import { CadeadoAvaliacaoDiarioIcone } from "./profile-icons";

type ProfileRatingSummaryProps = {
  diarioPrivada: boolean;
  ehDiario: boolean;
  language: HistorietasLanguage;
  media: number;
  total: number;
};

export function ProfileRatingSummary({
  diarioPrivada,
  ehDiario,
  language,
  media,
  total,
}: ProfileRatingSummaryProps) {
  return (
    <div
      style={profileRatingStatItemStyle}
      aria-label={ehDiario ? "Avaliação do Diário" : "Avaliação do autor"}
    >
      {ehDiario && diarioPrivada ? (
        <span
          style={profileRatingPrivateLockStyle}
          title="Avaliação do Diário privada"
          aria-label="Avaliação do Diário privada"
        >
          <CadeadoAvaliacaoDiarioIcone />
        </span>
      ) : (
        <>
          <strong style={profileRatingNumberStyle}>
            {formatarMediaAvaliacaoAutor(media)}
          </strong>

          <span style={profileRatingStackedMetaStyle}>
            <span
              style={profileRatingMiniStarsStyle}
              aria-label={`Média ${formatarMediaAvaliacaoAutor(media)} de 5`}
            >
              {NOTAS_AVALIACAO_AUTOR.map((estrela) => (
                <span
                  key={`${ehDiario ? "diario" : "autor"}-media-topo-${estrela}`}
                  style={profileRatingMiniStarVisualStyle}
                  aria-hidden="true"
                >
                  <span style={profileRatingMiniStarBaseStyle}>★</span>
                  <span
                    style={{
                      ...profileRatingMiniStarFillStyle,
                      width: obterPreenchimentoEstrelaAutor(estrela, media),
                    }}
                  >
                    ★
                  </span>
                </span>
              ))}
            </span>

            <span style={profileRatingTotalStyle}>
              {ehDiario
                ? formatarTotalAvaliacoesDiario(total, language)
                : formatarTotalAvaliacoesAutor(total, language)}
            </span>
          </span>
        </>
      )}
    </div>
  );
}
