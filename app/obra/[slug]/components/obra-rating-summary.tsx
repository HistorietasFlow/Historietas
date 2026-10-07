import {
  formatarMediaAvaliacao,
  formatarTotalAvaliacoes,
  NOTAS_AVALIACAO_OBRA,
  obterPreenchimentoEstrela,
} from "../lib/obra-rating-utils";
import {
  ratingNumberStyle,
  ratingStarsStyle,
  ratingSummaryStyle,
  ratingTopStarBaseStyle,
  ratingTopStarFillStyle,
  ratingTopStarVisualStyle,
  ratingTotalStyle,
} from "../lib/obra-style-utils";

type ObraRatingSummaryProps = {
  media: number;
  total: number;
};

export default function ObraRatingSummary({
  media,
  total,
}: ObraRatingSummaryProps) {
  return (
    <div style={ratingSummaryStyle}>
      <strong style={ratingNumberStyle}>
        {formatarMediaAvaliacao(media)}
      </strong>
      <span
        style={ratingStarsStyle}
        aria-label={`Média ${formatarMediaAvaliacao(media)} de 5`}
      >
        {NOTAS_AVALIACAO_OBRA.map((estrela) => (
          <span
            key={`media-obra-${estrela}`}
            style={ratingTopStarVisualStyle}
            aria-hidden="true"
          >
            <span style={ratingTopStarBaseStyle}>★</span>
            <span
              style={{
                ...ratingTopStarFillStyle,
                width: obterPreenchimentoEstrela(estrela, media),
              }}
            >
              ★
            </span>
          </span>
        ))}
      </span>
      <span style={ratingTotalStyle}>
        {formatarTotalAvaliacoes(total)}
      </span>
    </div>
  );
}
