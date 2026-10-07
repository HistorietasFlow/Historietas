"use client";

import {
  NOTAS_AVALIACAO_OBRA,
  obterPreenchimentoEstrela,
  obterProximaNotaAvaliacao,
} from "../lib/obra-rating-utils";
import {
  desktopWorkRatingBoxStyle,
  workRatingBoxStyle,
  workRatingHeaderStyle,
  workRatingStarActiveStyle,
  workRatingStarBaseStyle,
  workRatingStarButtonStyle,
  workRatingStarFillStyle,
  workRatingStarVisualStyle,
  workRatingStarsRowStyle,
  workRatingTitleStyle,
} from "../lib/obra-style-utils";

type ObraRatingBoxProps = {
  isDesktop: boolean;
  minhaNota: number;
  salvando: boolean;
  onAvaliar: (nota: number) => void | Promise<void>;
};

export default function ObraRatingBox({
  isDesktop,
  minhaNota,
  salvando,
  onAvaliar,
}: ObraRatingBoxProps) {
  return (
    <section
      style={isDesktop ? desktopWorkRatingBoxStyle : workRatingBoxStyle}
    >
      <div style={workRatingHeaderStyle}>
        <span style={workRatingTitleStyle}>AVALIE ESTA OBRA</span>
      </div>

      <div style={workRatingStarsRowStyle}>
        {NOTAS_AVALIACAO_OBRA.map((estrela) => {
          const preenchimentoEstrela = obterPreenchimentoEstrela(
            estrela,
            minhaNota,
          );
          const proximaNota = obterProximaNotaAvaliacao(estrela, minhaNota);

          return (
            <button
              key={`avaliacao-obra-${estrela}`}
              type="button"
              onClick={() => void onAvaliar(proximaNota)}
              disabled={salvando}
              style={
                preenchimentoEstrela === "0%"
                  ? workRatingStarButtonStyle
                  : workRatingStarActiveStyle
              }
              aria-label={`Avaliar com ${proximaNota
                .toString()
                .replace(".", ",")} estrela${proximaNota === 1 ? "" : "s"}`}
            >
              <span style={workRatingStarVisualStyle} aria-hidden="true">
                <span style={workRatingStarBaseStyle}>★</span>
                <span
                  style={{
                    ...workRatingStarFillStyle,
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
