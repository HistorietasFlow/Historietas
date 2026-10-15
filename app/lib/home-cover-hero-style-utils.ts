import type { CSSProperties } from "react";
import { obterImagemObraCatalogo } from "./home-catalog-utils";

type ObraCapaHeroHome = {
  disponivel: boolean;
};

const coverPlaceholderStyle: CSSProperties = {
  minHeight: "116px",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  backgroundImage: "linear-gradient(135deg, #050505 0%, #0B0B0D 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  textDecoration: "none",
  display: "block",
};

const coverThumbStyle: CSSProperties = {
  minHeight: "122px",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  backgroundImage: "linear-gradient(135deg, #050505 0%, #0B0B0D 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopHeroPosterStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  minHeight: 0,
  borderRadius: "22px",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  textDecoration: "none",
  color: "#FFFFFF",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  gap: "10px",
  padding: "22px",
  boxSizing: "border-box",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
};

export function criarMobileCoverStyle(capa: string): CSSProperties {
  if (!capa) {
    return coverPlaceholderStyle;
  }

  return {
    ...coverPlaceholderStyle,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export function criarMobileCoverThumbStyle(obra: ObraCapaHeroHome): CSSProperties {
  const imagemObra = obterImagemObraCatalogo(obra);

  if (!imagemObra) {
    return coverThumbStyle;
  }

  return {
    ...coverThumbStyle,
    backgroundImage: `url(${imagemObra})`,
    backgroundSize: "cover",
    backgroundPosition: obra.disponivel ? "center" : "center top",
  };
}

export function criarDesktopHeroPosterStyle(
  obra: ObraCapaHeroHome,
): CSSProperties {
  const imagemObra = obterImagemObraCatalogo(obra);

  if (imagemObra) {
    return {
      ...desktopHeroPosterStyle,
      backgroundImage: `url(${imagemObra})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  return {
    ...desktopHeroPosterStyle,
    backgroundImage:
      "linear-gradient(145deg, #050505 0%, #0B0B0D 52%, #000000 100%)",
  };
}
