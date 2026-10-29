import type { CSSProperties } from "react";

const selectedCoverStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  background: "#09090B",
};

const selectedCoverEmptyStyle: CSSProperties = {
  ...selectedCoverStyle,
  background:
    "linear-gradient(135deg, var(--historietas-top5-purple-empty, rgba(124,58,237,0.18)), var(--historietas-top5-orange-soft, rgba(249,115,22,0.10))), #09090B",
};

const top5CoverStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  aspectRatio: "3 / 4",
  borderRadius: "12px",
  overflow: "hidden",
  background: "#09090B",
  border: "none",
  boxShadow: "none",
};

const top5CoverEmptyStyle: CSSProperties = {
  ...top5CoverStyle,
  background:
    "linear-gradient(135deg, var(--historietas-top5-purple-cover, rgba(124,58,237,0.22)), var(--historietas-top5-orange-cover, rgba(249,115,22,0.13))), #09090B",
};

export function criarCapaTop5Style(capa: string): CSSProperties {
  if (!capa) {
    return top5CoverEmptyStyle;
  }

  return {
    ...top5CoverStyle,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export function criarCapaSelecionadaTop5Style(capa: string): CSSProperties {
  if (!capa) {
    return selectedCoverEmptyStyle;
  }

  return {
    ...selectedCoverStyle,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}
