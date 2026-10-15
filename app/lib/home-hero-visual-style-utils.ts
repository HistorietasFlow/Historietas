import type { CSSProperties } from "react";
import { obterImagemObraCatalogo } from "./home-catalog-utils";

type ObraImagemHeroHome = {
  disponivel: boolean;
};

export const heroStyle: CSSProperties = {
  marginTop: "8px",
  borderRadius: "28px",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  position: "relative",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export function criarMobileHeroFrameBackground(): CSSProperties {
  return {
    ...heroStyle,
    backgroundColor: "#000000",
    backgroundImage: "linear-gradient(145deg, #000000 0%, #050505 58%, #0B0B0D 100%)",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export function criarMobileHeroImageLayerStyle(
  obra: ObraImagemHeroHome,
): CSSProperties {
  const imagemObra = obterImagemObraCatalogo(obra);
  const imagemOuFallback = imagemObra
    ? `url(${imagemObra})`
    : "linear-gradient(145deg, #050505 0%, #0B0B0D 58%, #000000 100%)";

  return {
    position: "absolute",
    zIndex: 0,
    inset: "5px",
    borderRadius: "24px",
    backgroundImage: imagemOuFallback,
    backgroundSize: "cover",
    backgroundPosition: obra.disponivel ? "center" : "center top",
    pointerEvents: "none",
  };
}

export function criarDecoracaoHomeStyle(): CSSProperties {
  return {
    display: "none",
  };
}
