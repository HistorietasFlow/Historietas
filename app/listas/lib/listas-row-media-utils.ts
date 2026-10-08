import type { CSSProperties } from "react";

const coverStyle: CSSProperties = {
  width: "62px",
  height: "86px",
  borderRadius: "9px",
  overflow: "hidden",
  background: "#111111",
};

const coverEmptyStyle: CSSProperties = {
  ...coverStyle,
  background:
    "linear-gradient(145deg, rgba(124,58,237,0.28), rgba(249,115,22,0.14)), #111111",
};

const authorAvatarStyle: CSSProperties = {
  width: "62px",
  height: "62px",
  borderRadius: "999px",
  overflow: "hidden",
  background: "#111111",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  fontSize: "24px",
  fontWeight: 950,
};

const authorAvatarEmptyStyle: CSSProperties = {
  ...authorAvatarStyle,
  background:
    "linear-gradient(145deg, rgba(124,58,237,0.34), rgba(249,115,22,0.18)), #111111",
};

export function criarCapaStyle(capa: string): CSSProperties {
  return capa
    ? {
        ...coverStyle,
        backgroundImage: `url(${capa})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : coverEmptyStyle;
}

export function criarAvatarStyle(avatar: string): CSSProperties {
  return avatar
    ? {
        ...authorAvatarStyle,
        backgroundImage: `url(${avatar})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : authorAvatarEmptyStyle;
}
