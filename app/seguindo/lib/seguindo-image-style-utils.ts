import type { CSSProperties } from "react";

export function criarAvatarUsuarioSeguindoStyle(
  avatar: string,
  baseStyle: CSSProperties,
): CSSProperties {
  const avatarLimpo = avatar.trim();

  if (!avatarLimpo) {
    return {
      ...baseStyle,
      textDecoration: "none",
    };
  }

  return {
    ...baseStyle,
    textDecoration: "none",
    backgroundImage: `url(${avatarLimpo})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "transparent",
    WebkitTextFillColor: "transparent",
  };
}

export function criarCoverStyle(
  capa: string,
  baseStyle: CSSProperties,
): CSSProperties {
  if (!capa) {
    return {
      ...baseStyle,
      background: "var(--historietas-seguindo-bg-deep, #050505)",
      backgroundImage:
        "linear-gradient(135deg, var(--historietas-seguindo-surface, #0A0A0A) 0%, var(--historietas-seguindo-bg-deep, #050505) 100%)",
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  return {
    ...baseStyle,
    background: "var(--historietas-seguindo-bg-deep, #050505)",
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}
