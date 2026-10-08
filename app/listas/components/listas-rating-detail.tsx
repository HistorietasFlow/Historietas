import type { CSSProperties } from "react";

import {
  formatarDataCurta,
  formatarNotaListas,
} from "../lib/listas-format-utils";

type ListasRatingDetailProps = {
  nota: number;
  data: string;
};

export default function ListasRatingDetail({
  nota,
  data,
}: ListasRatingDetailProps) {
  const notaNormalizada = Math.max(
    0,
    Math.min(5, Math.round(nota * 2) / 2),
  );

  return (
    <span
      style={ratingDetailStyle}
      aria-label={`${formatarNotaListas(notaNormalizada)} de 5 estrelas`}
    >
      <span style={ratingStarsStyle} aria-hidden="true">
        {Array.from({ length: 5 }, (_, indice) => {
          const preenchimento = Math.max(
            0,
            Math.min(1, notaNormalizada - indice),
          );

          return (
            <span key={indice} style={ratingStarSlotStyle}>
              <span style={ratingStarEmptyStyle}>★</span>

              {preenchimento > 0 && (
                <span
                  style={{
                    ...ratingStarFillClipStyle,
                    width: `${preenchimento * 100}%`,
                  }}
                >
                  <span style={ratingStarFilledStyle}>★</span>
                </span>
              )}
            </span>
          );
        })}
      </span>

      <span>
        {formatarNotaListas(notaNormalizada)} • {formatarDataCurta(data)}
      </span>
    </span>
  );
}

const ratingDetailStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  maxWidth: "100%",
};

const ratingStarsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "1px",
  flex: "0 0 auto",
  fontSize: "14px",
  lineHeight: 1,
};

const ratingStarSlotStyle: CSSProperties = {
  position: "relative",
  display: "inline-block",
  width: "1em",
  height: "1em",
  lineHeight: 1,
};

const ratingStarEmptyStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  color: "rgba(255,255,255,0.22)",
  lineHeight: 1,
};

const ratingStarFillClipStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  height: "100%",
  overflow: "hidden",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

const ratingStarFilledStyle: CSSProperties = {
  display: "block",
  width: "1em",
  color: "#F6C453",
  lineHeight: 1,
};
