import { NOTAS_AVALIACAO_AUTOR } from "../constants";
import {
  obterPreenchimentoEstrelaAutor,
  obterProximaNotaAvaliacaoAutor,
} from "../lib/profile-formatters";
import {
  authorRatingBoxStyle,
  authorRatingHeaderStyle,
  authorRatingStarActiveStyle,
  authorRatingStarBaseStyle,
  authorRatingStarButtonStyle,
  authorRatingStarFillStyle,
  authorRatingStarsRowStyle,
  authorRatingStarVisualStyle,
  authorRatingTitleStyle,
  desktopAuthorRatingBoxStyle,
} from "../styles";

type ProfileRatingBoxProps = {
  ariaLabel: string;
  entidadeAvaliacao: string;
  isDesktop: boolean;
  keyPrefix: string;
  minhaNota: number;
  onRate: (nota: number) => void | Promise<void>;
  salvando?: boolean;
  titulo: string;
};

export function ProfileRatingBox({
  ariaLabel,
  entidadeAvaliacao,
  isDesktop,
  keyPrefix,
  minhaNota,
  onRate,
  salvando,
  titulo,
}: ProfileRatingBoxProps) {
  return (
    <section
      style={isDesktop ? desktopAuthorRatingBoxStyle : authorRatingBoxStyle}
      aria-label={ariaLabel}
    >
      <div style={authorRatingHeaderStyle}>
        <span style={authorRatingTitleStyle}>{titulo}</span>
      </div>

      <div style={authorRatingStarsRowStyle}>
        {NOTAS_AVALIACAO_AUTOR.map((estrela) => {
          const preenchimentoEstrela = obterPreenchimentoEstrelaAutor(
            estrela,
            minhaNota,
          );
          const proximaNota = obterProximaNotaAvaliacaoAutor(
            estrela,
            minhaNota,
          );
          const estiloEstrela =
            preenchimentoEstrela === "0%"
              ? authorRatingStarButtonStyle
              : authorRatingStarActiveStyle;

          return (
            <button
              key={`${keyPrefix}-${estrela}`}
              type="button"
              onClick={() => void onRate(proximaNota)}
              disabled={salvando}
              style={
                salvando === undefined
                  ? estiloEstrela
                  : {
                      ...estiloEstrela,
                      opacity: salvando ? 0.58 : 1,
                    }
              }
              aria-label={`Avaliar ${entidadeAvaliacao} com ${proximaNota
                .toString()
                .replace(".", ",")} estrela${proximaNota === 1 ? "" : "s"}`}
            >
              <span style={authorRatingStarVisualStyle} aria-hidden="true">
                <span style={authorRatingStarBaseStyle}>★</span>
                <span
                  style={{
                    ...authorRatingStarFillStyle,
                    width: preenchimentoEstrela,
                  }}
                >
                  ★
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
