"use client";

import { useEffect, useMemo } from "react";
import type { CSSProperties } from "react";

export type TemaVisualHistorietas = "foco";

export type TemaVisualHistorietasConfig = {
  accent: string;
  secondary: string;
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  glowPrimary: string;
  glowSecondary: string;
  textPrimary: string;
  textSecondary: string;
  surface: string;
  surfaceStrong: string;
  borderSoft: string;
  inputBg: string;
  inputText: string;
  titleFrom: string;
  titleMid: string;
  titleTo: string;
  heroShadow: string;
  cardShadow: string;
  logoShadow: string;
  activeSurface: string;
  secondarySurface: string;
  secondaryButtonText: string;
  dangerSurface: string;
  dangerButtonText: string;
};

export const TEMAS_VISUAIS_HISTORIETAS: Record<
  TemaVisualHistorietas,
  TemaVisualHistorietasConfig
> = {
  foco: {
    accent: "#FFFFFF",
    secondary: "#A1A1AA",
    bgStart: "#000000",
    bgMid: "#000000",
    bgEnd: "#000000",
    glowPrimary: "transparent",
    glowSecondary: "transparent",
    textPrimary: "#FFFFFF",
    textSecondary: "#A1A1AA",
    surface: "#050505",
    surfaceStrong: "#000000",
    borderSoft: "rgba(255,255,255,0.18)",
    inputBg: "#000000",
    inputText: "#FFFFFF",
    titleFrom: "#FFFFFF",
    titleMid: "#FFFFFF",
    titleTo: "#FFFFFF",
    heroShadow: "none",
    cardShadow: "none",
    logoShadow: "none",
    activeSurface: "rgba(255,255,255,0.10)",
    secondarySurface: "rgba(255,255,255,0.06)",
    secondaryButtonText: "#FFFFFF",
    dangerSurface: "rgba(255,255,255,0.08)",
    dangerButtonText: "#FFFFFF",
  },
};

export function obterTemaVisualSeguro(_valor: unknown): TemaVisualHistorietas {
  return "foco";
}

export function criarFundoTemaHistorietas(
  _temaVisual: TemaVisualHistorietas = "foco"
) {
  return "#000000";
}

function aplicarVariaveisDaBarraInferior() {
  if (typeof document === "undefined") {
    return;
  }

  const raiz = document.documentElement;
  const variaveis = {
    "--historietas-bottom-nav-bg": "#000000",
    "--historietas-bottom-nav-background": "#000000",
    "--historietas-bottom-nav-border": "rgba(255,255,255,0.18)",
    "--historietas-bottom-nav-shadow": "none",
    "--historietas-bottom-nav-text": "#A1A1AA",
    "--historietas-bottom-nav-hover-bg": "rgba(255,255,255,0.06)",
    "--historietas-bottom-nav-hover-text": "#FFFFFF",
    "--historietas-bottom-nav-icon-text": "#FFFFFF",
    "--historietas-bottom-nav-icon-bg": "#050505",
    "--historietas-bottom-nav-icon-border": "rgba(255,255,255,0.18)",
    "--historietas-bottom-nav-active-bg": "#000000",
    "--historietas-bottom-nav-active-border": "#FFFFFF",
    "--historietas-bottom-nav-active-text": "#FFFFFF",
    "--historietas-bottom-nav-active-icon-bg": "#FFFFFF",
    "--historietas-bottom-nav-active-icon-border": "#FFFFFF",
    "--historietas-bottom-nav-active-icon-text": "#000000",
    "--historietas-bottom-nav-main-bg": "#000000",
    "--historietas-bottom-nav-main-border": "#FFFFFF",
    "--historietas-bottom-nav-main-text": "#FFFFFF",
    "--historietas-bottom-nav-main-shadow": "none",
    "--historietas-bottom-nav-main-icon-bg": "#000000",
    "--historietas-bottom-nav-main-icon-border": "#FFFFFF",
    "--historietas-bottom-nav-publish-bg": "#000000",
    "--historietas-bottom-nav-publish-border": "#FFFFFF",
    "--historietas-bottom-nav-shine": "none",
  };

  Object.entries(variaveis).forEach(([variavel, valor]) => {
    raiz.style.setProperty(variavel, valor);
  });
}

export function aplicarTemaVisual(
  _temaVisual: TemaVisualHistorietas = "foco"
) {
  if (typeof document === "undefined") {
    return;
  }

  const tema = TEMAS_VISUAIS_HISTORIETAS.foco;
  const raiz = document.documentElement;
  const fundo = "#000000";

  const variaveis = {
    "--historietas-page-background": fundo,
    "--historietas-accent": tema.accent,
    "--historietas-secondary": tema.secondary,
    "--historietas-bg-start": tema.bgStart,
    "--historietas-bg-mid": tema.bgMid,
    "--historietas-bg-end": tema.bgEnd,
    "--historietas-glow-primary": tema.glowPrimary,
    "--historietas-glow-secondary": tema.glowSecondary,
    "--historietas-text-primary": tema.textPrimary,
    "--historietas-text-secondary": tema.textSecondary,
    "--historietas-surface": tema.surface,
    "--historietas-surface-strong": tema.surfaceStrong,
    "--historietas-border-soft": tema.borderSoft,
    "--historietas-input-bg": tema.inputBg,
    "--historietas-input-text": tema.inputText,
    "--historietas-input-placeholder": tema.textSecondary,
    "--historietas-title-from": tema.titleFrom,
    "--historietas-title-mid": tema.titleMid,
    "--historietas-title-to": tema.titleTo,
    "--historietas-hero-shadow": tema.heroShadow,
    "--historietas-card-shadow": tema.cardShadow,
    "--historietas-logo-shadow": tema.logoShadow,
    "--historietas-active-surface": tema.activeSurface,
    "--historietas-secondary-surface": tema.secondarySurface,
    "--historietas-secondary-button-text": tema.secondaryButtonText,
    "--historietas-danger-surface": tema.dangerSurface,
    "--historietas-danger-button-text": tema.dangerButtonText,
    "--historietas-obra-bg-deep": "#000000",
    "--historietas-obra-bg-shadow-42": "rgba(0,0,0,0.72)",
    "--historietas-obra-menu-98": "#000000",
    "--historietas-obra-purple-58": "rgba(255,255,255,0.18)",
    "--historietas-obra-purple-72": "#050505",
    "--historietas-obra-secondary-soft-34": "rgba(255,255,255,0.18)",
  };

  Object.entries(variaveis).forEach(([variavel, valor]) => {
    raiz.style.setProperty(variavel, valor);
  });

  aplicarVariaveisDaBarraInferior();

  raiz.removeAttribute("data-historietas-tema-visual");
  raiz.style.background = fundo;
  raiz.style.colorScheme = "dark";

  if (document.body) {
    document.body.style.background = fundo;
    document.body.style.color = tema.textPrimary;
  }
}

export const historietasThemeCss = `
  html,
  body,
  main {
    background: #000000 !important;
    color: #FFFFFF !important;
    color-scheme: dark;
  }

  main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  input,
  textarea,
  select {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.18) !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  input::placeholder,
  textarea::placeholder {
    color: #A1A1AA !important;
    opacity: 1 !important;
  }

  [role="dialog"],
  [role="menu"],
  [role="listbox"] {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.18) !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  .historietas-theme-logo-text,
  .historietas-theme-title {
    background: none !important;
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    text-shadow: none !important;
  }

  nav.historietas-bottom-nav,
  [data-bottom-nav="true"],
  [data-mobile-nav="true"],
  nav:has(a[href="/publicar"]) {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.18) !important;
    box-shadow: none !important;
    color: #A1A1AA !important;
  }

  nav.historietas-bottom-nav a,
  [data-bottom-nav="true"] a,
  [data-mobile-nav="true"] a {
    color: #A1A1AA !important;
    box-shadow: none !important;
  }

  nav.historietas-bottom-nav .historietas-bottom-nav-icon,
  [data-bottom-nav="true"] .historietas-bottom-nav-icon,
  [data-mobile-nav="true"] .historietas-bottom-nav-icon {
    background: #050505 !important;
    border-color: rgba(255,255,255,0.18) !important;
    color: #FFFFFF !important;
  }

  nav.historietas-bottom-nav .historietas-bottom-nav-item[aria-current="page"],
  nav.historietas-bottom-nav .historietas-bottom-nav-item-active,
  [data-bottom-nav="true"] .historietas-bottom-nav-item[aria-current="page"],
  [data-bottom-nav="true"] .historietas-bottom-nav-item-active,
  [data-mobile-nav="true"] .historietas-bottom-nav-item[aria-current="page"],
  [data-mobile-nav="true"] .historietas-bottom-nav-item-active {
    background: #000000 !important;
    border-color: #FFFFFF !important;
    color: #FFFFFF !important;
  }

  nav.historietas-bottom-nav .historietas-bottom-nav-item[aria-current="page"] .historietas-bottom-nav-icon,
  nav.historietas-bottom-nav .historietas-bottom-nav-item-active .historietas-bottom-nav-icon,
  [data-bottom-nav="true"] .historietas-bottom-nav-item[aria-current="page"] .historietas-bottom-nav-icon,
  [data-bottom-nav="true"] .historietas-bottom-nav-item-active .historietas-bottom-nav-icon,
  [data-mobile-nav="true"] .historietas-bottom-nav-item[aria-current="page"] .historietas-bottom-nav-icon,
  [data-mobile-nav="true"] .historietas-bottom-nav-item-active .historietas-bottom-nav-icon {
    background: #FFFFFF !important;
    border-color: #FFFFFF !important;
    color: #000000 !important;
  }

  nav.historietas-bottom-nav a[href="/publicar"],
  [data-bottom-nav="true"] a[href="/publicar"],
  [data-mobile-nav="true"] a[href="/publicar"] {
    background: #000000 !important;
    border-color: #FFFFFF !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  [data-historietas-obra-comments="true"] {
    --historietas-obra-bg-deep: #000000;
    --historietas-obra-bg-shadow-42: rgba(0,0,0,0.72);
    --historietas-obra-menu-98: #000000;
    --historietas-obra-purple-58: rgba(255,255,255,0.18);
    --historietas-obra-purple-72: #050505;
    --historietas-obra-secondary-soft-34: rgba(255,255,255,0.18);
    --historietas-text-primary: #FFFFFF;
    --historietas-text-secondary: #A1A1AA;
    --historietas-border-soft: rgba(255,255,255,0.18);
    --historietas-input-bg: #000000;
    --historietas-input-text: #FFFFFF;
    --historietas-input-placeholder: #A1A1AA;
    --historietas-danger-button-text: #FFFFFF;
    color: #FFFFFF;
  }

  [data-historietas-obra-comments="true"] [role="dialog"],
  [data-historietas-obra-comments="true"] [role="menu"] {
    background-color: #000000 !important;
    border-color: rgba(255,255,255,0.18) !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  [data-historietas-obra-comments="true"] textarea {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.18) !important;
    color: #FFFFFF !important;
  }

  [data-historietas-obra-comments="true"] textarea::placeholder {
    color: #A1A1AA !important;
    opacity: 1 !important;
  }

  ::selection {
    background: #FFFFFF;
    color: #000000;
  }
`;

export function criarPageThemeStyle(
  pageStyle: CSSProperties,
  _temaVisual: TemaVisualHistorietas = "foco"
): CSSProperties {
  return {
    ...pageStyle,
    background: "#000000",
    color: "#FFFFFF",
  };
}

export function useHistorietasTheme(pageStyle: CSSProperties) {
  const temaVisual: TemaVisualHistorietas = "foco";

  const pageThemeStyle = useMemo<CSSProperties>(
    () => criarPageThemeStyle(pageStyle, temaVisual),
    [pageStyle]
  );

  useEffect(() => {
    aplicarTemaVisual("foco");
  }, []);

  return {
    temaVisual,
    pageThemeStyle,
    setTemaVisual: (_temaVisual: TemaVisualHistorietas) => {
      aplicarTemaVisual("foco");
    },
    aplicarTemaVisual,
    historietasThemeCss,
  };
}