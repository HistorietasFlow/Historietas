"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

export const THEME_STORAGE_KEY = "historietas-tema-visual";

export type TemaVisualHistorietas =
  | "branco"
  | "escuro"
  | "foco"
  | "original"
  | "fantasia"
  | "romance"
  | "terror"
  | "acao"
  | "scifi"
  | "drama"
  | "aventura"
  | "sobrenatural"
  | "comedia"
  | "misterio"
  | "suspense"
  | "historico"
  | "biografia"
  | "pixel";

export type TemaVisualHistorietasConfig = {
  accent: string;
  secondary: string;
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  glowPrimary: string;
  glowSecondary: string;
  textPrimary?: string;
  textSecondary?: string;
  surface?: string;
  surfaceStrong?: string;
  borderSoft?: string;
  inputBg?: string;
  inputText?: string;
  titleFrom?: string;
  titleMid?: string;
  titleTo?: string;
  heroShadow?: string;
  cardShadow?: string;
  logoShadow?: string;
  activeSurface?: string;
  secondarySurface?: string;
  secondaryButtonText?: string;
  dangerSurface?: string;
  dangerButtonText?: string;
};

const temaBaseEscuro = {
  textPrimary: "#FFFFFF",
  textSecondary: "#D4D4D8",
  surface: "rgba(18,12,30,0.82)",
  surfaceStrong: "rgba(18,12,30,0.98)",
  borderSoft: "rgba(255,255,255,0.08)",
  inputBg: "#18181B",
  inputText: "#FFFFFF",
  titleFrom: "#FFFFFF",
  titleMid: "#F5F3FF",
  titleTo: "#FDBA74",
  heroShadow: "none",
  cardShadow: "none",
  logoShadow: "none",
  secondaryButtonText: "#DDD6FE",
  dangerSurface: "rgba(239,68,68,0.105)",
  dangerButtonText: "#FCA5A5",
};

export const TEMAS_VISUAIS_HISTORIETAS: Record<
  TemaVisualHistorietas,
  TemaVisualHistorietasConfig
> = {
  branco: {
    accent: "#1A73E8",
    secondary: "#01875F",
    bgStart: "#FFFFFF",
    bgMid: "#FFFFFF",
    bgEnd: "#F8F9FA",
    glowPrimary: "rgba(26,115,232,0.020)",
    glowSecondary: "rgba(1,135,95,0.018)",
    textPrimary: "#202124",
    textSecondary: "#5F6368",
    surface: "#FFFFFF",
    surfaceStrong: "#FFFFFF",
    borderSoft: "#DADCE0",
    inputBg: "#FFFFFF",
    inputText: "#202124",
    titleFrom: "#202124",
    titleMid: "#202124",
    titleTo: "#202124",
    heroShadow: "none",
    cardShadow: "none",
    logoShadow: "none",
    activeSurface: "rgba(26,115,232,0.10)",
    secondarySurface: "#F1F3F4",
    secondaryButtonText: "#3C4043",
    dangerSurface: "rgba(217,48,37,0.10)",
    dangerButtonText: "#B3261E",
  },
  escuro: {
    ...temaBaseEscuro,
    accent: "#F97316",
    secondary: "#7C3AED",
    bgStart: "#000000",
    bgMid: "#000000",
    bgEnd: "#000000",
    glowPrimary: "rgba(249,115,22,0.030)",
    glowSecondary: "rgba(124,58,237,0.030)",
    textSecondary: "#B3B3B3",
    surface: "#101010",
    surfaceStrong: "#000000",
    borderSoft: "rgba(255,255,255,0.11)",
    inputBg: "#0B0B0B",
    heroShadow: "none",
    cardShadow: "none",
    logoShadow: "none",
    activeSurface: "rgba(124,58,237,0.14)",
    secondarySurface: "rgba(124,58,237,0.12)",
    secondaryButtonText: "#FFFFFF",
    dangerSurface: "rgba(239,68,68,0.12)",
  },
  foco: {
    ...temaBaseEscuro,
    accent: "#A78BFA",
    secondary: "#27272A",
    bgStart: "#050506",
    bgMid: "#030305",
    bgEnd: "#020203",
    glowPrimary: "rgba(124,58,237,0.08)",
    glowSecondary: "rgba(255,255,255,0.045)",
    textPrimary: "#F4F4F5",
    textSecondary: "#D4D4D8",
    surface: "rgba(9,9,11,0.88)",
    surfaceStrong: "rgba(3,3,6,0.96)",
    borderSoft: "rgba(255,255,255,0.065)",
    inputBg: "#09090B",
    inputText: "#F4F4F5",
    titleMid: "#E4E4E7",
    titleTo: "#A78BFA",
    heroShadow: "none",
    cardShadow: "none",
    logoShadow: "none",
    activeSurface: "rgba(167,139,250,0.12)",
    secondarySurface: "rgba(39,39,42,0.72)",
    secondaryButtonText: "#E4E4E7",
    dangerSurface: "rgba(127,29,29,0.18)",
  },
  original: {
    ...temaBaseEscuro,
    accent: "#F97316",
    secondary: "#7C3AED",
    bgStart: "#070212",
    bgMid: "#070212",
    bgEnd: "#070212",
    glowPrimary: "transparent",
    glowSecondary: "transparent",
  },
  fantasia: {
    ...temaBaseEscuro,
    accent: "#A855F7",
    secondary: "#2563EB",
    bgStart: "#090417",
    bgMid: "#130A2A",
    bgEnd: "#0B1028",
    glowPrimary: "rgba(168,85,247,0.34)",
    glowSecondary: "rgba(37,99,235,0.18)",
    titleTo: "#C4B5FD",
    activeSurface: "rgba(168,85,247,0.18)",
    secondarySurface: "rgba(37,99,235,0.16)",
    secondaryButtonText: "#DBEAFE",
  },
  romance: {
    ...temaBaseEscuro,
    accent: "#EC4899",
    secondary: "#BE123C",
    bgStart: "#140711",
    bgMid: "#251022",
    bgEnd: "#1E0B16",
    glowPrimary: "rgba(236,72,153,0.30)",
    glowSecondary: "rgba(190,18,60,0.18)",
    titleTo: "#F9A8D4",
    activeSurface: "rgba(236,72,153,0.18)",
    secondarySurface: "rgba(190,18,60,0.16)",
    secondaryButtonText: "#FCE7F3",
  },
  terror: {
    ...temaBaseEscuro,
    accent: "#EF4444",
    secondary: "#7F1D1D",
    bgStart: "#080305",
    bgMid: "#160707",
    bgEnd: "#100608",
    glowPrimary: "rgba(239,68,68,0.30)",
    glowSecondary: "rgba(127,29,29,0.22)",
    titleTo: "#FCA5A5",
    activeSurface: "rgba(239,68,68,0.18)",
    secondarySurface: "rgba(127,29,29,0.20)",
    secondaryButtonText: "#FECACA",
    dangerSurface: "rgba(127,29,29,0.22)",
  },
  acao: {
    ...temaBaseEscuro,
    accent: "#F97316",
    secondary: "#DC2626",
    bgStart: "#100604",
    bgMid: "#1E0B08",
    bgEnd: "#17101B",
    glowPrimary: "rgba(249,115,22,0.34)",
    glowSecondary: "rgba(220,38,38,0.18)",
    titleTo: "#FDBA74",
    activeSurface: "rgba(249,115,22,0.20)",
    secondarySurface: "rgba(220,38,38,0.16)",
    secondaryButtonText: "#FED7AA",
  },
  scifi: {
    ...temaBaseEscuro,
    accent: "#06B6D4",
    secondary: "#2563EB",
    bgStart: "#031017",
    bgMid: "#071C2D",
    bgEnd: "#071321",
    glowPrimary: "rgba(6,182,212,0.30)",
    glowSecondary: "rgba(37,99,235,0.20)",
    titleTo: "#67E8F9",
    activeSurface: "rgba(6,182,212,0.18)",
    secondarySurface: "rgba(37,99,235,0.16)",
    secondaryButtonText: "#CFFAFE",
  },
  drama: {
    ...temaBaseEscuro,
    accent: "#C084FC",
    secondary: "#581C87",
    bgStart: "#0E0718",
    bgMid: "#160A24",
    bgEnd: "#17101F",
    glowPrimary: "rgba(192,132,252,0.30)",
    glowSecondary: "rgba(88,28,135,0.22)",
    titleTo: "#DDD6FE",
    activeSurface: "rgba(192,132,252,0.18)",
    secondarySurface: "rgba(88,28,135,0.20)",
    secondaryButtonText: "#E9D5FF",
  },
  aventura: {
    ...temaBaseEscuro,
    accent: "#EAB308",
    secondary: "#92400E",
    bgStart: "#0D0803",
    bgMid: "#171006",
    bgEnd: "#1F1308",
    glowPrimary: "rgba(234,179,8,0.18)",
    glowSecondary: "rgba(146,64,14,0.20)",
    titleTo: "#FDE68A",
    activeSurface: "rgba(234,179,8,0.16)",
    secondarySurface: "rgba(146,64,14,0.18)",
    secondaryButtonText: "#FEF3C7",
  },
  sobrenatural: {
    ...temaBaseEscuro,
    accent: "#34D399",
    secondary: "#065F46",
    bgStart: "#06120D",
    bgMid: "#0B1D1C",
    bgEnd: "#10171A",
    glowPrimary: "rgba(52,211,153,0.24)",
    glowSecondary: "rgba(6,95,70,0.22)",
    titleTo: "#A7F3D0",
    activeSurface: "rgba(52,211,153,0.16)",
    secondarySurface: "rgba(6,95,70,0.20)",
    secondaryButtonText: "#D1FAE5",
  },
  comedia: {
    ...temaBaseEscuro,
    accent: "#FACC15",
    secondary: "#FB7185",
    bgStart: "#110D04",
    bgMid: "#1D1608",
    bgEnd: "#1A1014",
    glowPrimary: "rgba(250,204,21,0.24)",
    glowSecondary: "rgba(251,113,133,0.18)",
    titleTo: "#FEF08A",
    activeSurface: "rgba(250,204,21,0.16)",
    secondarySurface: "rgba(251,113,133,0.16)",
    secondaryButtonText: "#FEF9C3",
  },
  misterio: {
    ...temaBaseEscuro,
    accent: "#3B82F6",
    secondary: "#0F172A",
    bgStart: "#030712",
    bgMid: "#07111F",
    bgEnd: "#0B1020",
    glowPrimary: "rgba(59,130,246,0.22)",
    glowSecondary: "rgba(15,23,42,0.30)",
    titleTo: "#93C5FD",
    activeSurface: "rgba(59,130,246,0.15)",
    secondarySurface: "rgba(15,23,42,0.28)",
    secondaryButtonText: "#BFDBFE",
  },
  suspense: {
    ...temaBaseEscuro,
    accent: "#A3E635",
    secondary: "#365314",
    bgStart: "#070B05",
    bgMid: "#101607",
    bgEnd: "#11140A",
    glowPrimary: "rgba(163,230,53,0.18)",
    glowSecondary: "rgba(54,83,20,0.24)",
    titleTo: "#D9F99D",
    activeSurface: "rgba(163,230,53,0.14)",
    secondarySurface: "rgba(54,83,20,0.24)",
    secondaryButtonText: "#D9F99D",
  },
  historico: {
    ...temaBaseEscuro,
    accent: "#D6A15D",
    secondary: "#78350F",
    bgStart: "#0C0704",
    bgMid: "#151008",
    bgEnd: "#18110A",
    glowPrimary: "rgba(214,161,93,0.18)",
    glowSecondary: "rgba(120,53,15,0.22)",
    titleTo: "#F5D6A0",
    activeSurface: "rgba(214,161,93,0.14)",
    secondarySurface: "rgba(120,53,15,0.22)",
    secondaryButtonText: "#FDE68A",
  },
  biografia: {
    ...temaBaseEscuro,
    accent: "#94A3B8",
    secondary: "#334155",
    bgStart: "#05080D",
    bgMid: "#0B111C",
    bgEnd: "#101827",
    glowPrimary: "rgba(148,163,184,0.18)",
    glowSecondary: "rgba(51,65,85,0.26)",
    titleTo: "#CBD5E1",
    activeSurface: "rgba(148,163,184,0.14)",
    secondarySurface: "rgba(51,65,85,0.24)",
    secondaryButtonText: "#E2E8F0",
  },
  pixel: {
    ...temaBaseEscuro,
    accent: "#22C55E",
    secondary: "#38BDF8",
    bgStart: "#030703",
    bgMid: "#061106",
    bgEnd: "#020402",
    glowPrimary: "rgba(34,197,94,0.16)",
    glowSecondary: "rgba(56,189,248,0.12)",
    textPrimary: "#ECFDF5",
    textSecondary: "#BBF7D0",
    surface: "#07120A",
    surfaceStrong: "#030803",
    borderSoft: "rgba(34,197,94,0.34)",
    inputBg: "#020602",
    inputText: "#ECFDF5",
    titleFrom: "#ECFDF5",
    titleMid: "#BBF7D0",
    titleTo: "#86EFAC",
    heroShadow: "none",
    cardShadow: "none",
    logoShadow: "none",
    activeSurface: "rgba(34,197,94,0.18)",
    secondarySurface: "rgba(56,189,248,0.12)",
    secondaryButtonText: "#BAE6FD",
    dangerSurface: "rgba(239,68,68,0.14)",
    dangerButtonText: "#FCA5A5",
  },
};

export const historietasThemeCss = `
  html[data-historietas-tema-visual] body {
    background: var(--historietas-bg-start, #070212) !important;
    color: var(--historietas-text-primary, #FFFFFF) !important;
  }

  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #070212 !important;
  }

  html[data-historietas-tema-visual="original"] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  html[data-historietas-tema-visual] nav,
  html[data-historietas-tema-visual] [data-bottom-nav],
  html[data-historietas-tema-visual] [data-mobile-nav],
  html[data-historietas-tema-visual] nav:has(a[href="/publicar"]),
  html[data-historietas-tema-visual] div:has(> a[href="/publicar"]):has(> a[href="/biblioteca"]),
  html[data-historietas-tema-visual] div:has(a[href="/publicar"]):has(a[href="/biblioteca"]) {
    background: var(--historietas-bottom-nav-bg, var(--historietas-surface-strong, rgba(18,8,31,0.98))) !important;
    border-color: var(--historietas-bottom-nav-border, var(--historietas-border-soft, rgba(255,255,255,0.12))) !important;
    box-shadow: var(--historietas-bottom-nav-shadow, none) !important;
    color: var(--historietas-bottom-nav-text, var(--historietas-text-secondary, #D4D4D8)) !important;
  }

  html[data-historietas-tema-visual] nav a,
  html[data-historietas-tema-visual] [data-bottom-nav] a,
  html[data-historietas-tema-visual] [data-mobile-nav] a,
  html[data-historietas-tema-visual] nav button,
  html[data-historietas-tema-visual] [data-bottom-nav] button,
  html[data-historietas-tema-visual] [data-mobile-nav] button,
  html[data-historietas-tema-visual] div:has(a[href="/publicar"]):has(a[href="/biblioteca"]) a,
  html[data-historietas-tema-visual] div:has(a[href="/publicar"]):has(a[href="/biblioteca"]) button {
    color: var(--historietas-bottom-nav-text, var(--historietas-text-secondary, #D4D4D8)) !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual] nav a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] div:has(a[href="/publicar"]):has(a[href="/biblioteca"]) a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) {
    background: transparent !important;
    border-color: transparent !important;
    box-shadow: none !important;
    color: var(--historietas-bottom-nav-text, var(--historietas-text-secondary, #D4D4D8)) !important;
  }

  html[data-historietas-tema-visual] nav .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-icon {
    color: var(--historietas-bottom-nav-icon-text, #DDD6FE) !important;
    background: var(--historietas-bottom-nav-icon-bg, var(--historietas-surface, rgba(255,255,255,0.045))) !important;
    border-color: var(--historietas-bottom-nav-icon-border, var(--historietas-border-soft, rgba(255,255,255,0.055))) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) .historietas-bottom-nav-icon {
    color: var(--historietas-bottom-nav-icon-text, #DDD6FE) !important;
    background: var(--historietas-bottom-nav-icon-bg, rgba(124,58,237,0.20)) !important;
    border-color: var(--historietas-bottom-nav-icon-border, rgba(167,139,250,0.30)) !important;
  }

  html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-item[aria-current="page"],
  html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-item-active,
  html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-item[aria-current="page"],
  html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-item-active {
    background: var(--historietas-bottom-nav-active-bg, rgba(124,58,237,0.38)) !important;
    border-color: var(--historietas-bottom-nav-active-border, rgba(196,181,253,0.62)) !important;
    color: var(--historietas-bottom-nav-hover-text, #FFFFFF) !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-item[aria-current="page"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-item-active .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-item[aria-current="page"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-item-active .historietas-bottom-nav-icon {
    background: var(--historietas-bottom-nav-active-icon-bg, #7C3AED) !important;
    border-color: var(--historietas-bottom-nav-active-icon-border, rgba(221,214,254,0.70)) !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual="branco"] .historietas-theme-logo-text,
  html[data-historietas-tema-visual="branco"] .historietas-theme-title {
    background: none !important;
    color: #1A73E8 !important;
    -webkit-text-fill-color: #1A73E8 !important;
    text-shadow: none !important;
  }

  html[data-historietas-tema-visual="branco"] input::placeholder,
  html[data-historietas-tema-visual="branco"] textarea::placeholder {
    color: #80868B !important;
  }

  html[data-historietas-tema-visual="branco"] input,
  html[data-historietas-tema-visual="branco"] textarea,
  html[data-historietas-tema-visual="branco"] select {
    color: #202124 !important;
  }

  html[data-historietas-tema-visual="branco"] a,
  html[data-historietas-tema-visual="branco"] button,
  html[data-historietas-tema-visual="branco"] label {
    text-shadow: none !important;
  }

  html[data-historietas-tema-visual="escuro"] {
    --historietas-bg-start: #000000;
    --historietas-bg-mid: #000000;
    --historietas-bg-end: #000000;
    --historietas-accent: #F97316;
    --historietas-secondary: #7C3AED;
    --historietas-glow-primary: rgba(249,115,22,0.030);
    --historietas-glow-secondary: rgba(124,58,237,0.030);
    --historietas-active-surface: rgba(124,58,237,0.14);
    --historietas-secondary-surface: rgba(124,58,237,0.12);
    --historietas-danger-surface: rgba(239,68,68,0.12);
  }

  html[data-historietas-tema-visual="pixel"] {
    --historietas-bg-start: #030703;
    --historietas-bg-mid: #061106;
    --historietas-bg-end: #020402;
    --historietas-accent: #22C55E;
    --historietas-secondary: #38BDF8;
    --historietas-text-primary: #ECFDF5;
    --historietas-text-secondary: #BBF7D0;
    --historietas-surface: #07120A;
    --historietas-surface-strong: #030803;
    --historietas-border-soft: rgba(34,197,94,0.34);
    --historietas-input-bg: #020602;
    --historietas-input-text: #ECFDF5;
    --historietas-title-from: #ECFDF5;
    --historietas-title-mid: #BBF7D0;
    --historietas-title-to: #86EFAC;
    --historietas-active-surface: rgba(34,197,94,0.18);
    --historietas-secondary-surface: rgba(56,189,248,0.12);
    --historietas-secondary-button-text: #BAE6FD;
    --historietas-pixel-border: #22C55E;
    --historietas-pixel-grid: rgba(34,197,94,0.055);
  }

  html[data-historietas-tema-visual="pixel"] body {
    background:
      repeating-linear-gradient(0deg, transparent 0 7px, var(--historietas-pixel-grid) 7px 8px),
      repeating-linear-gradient(90deg, transparent 0 7px, var(--historietas-pixel-grid) 7px 8px),
      linear-gradient(180deg, #030703 0%, #061106 54%, #020402 100%) !important;
  }

  html[data-historietas-tema-visual="pixel"] main {
    background:
      radial-gradient(circle at 18% 0%, rgba(34,197,94,0.10), transparent 28%),
      radial-gradient(circle at 86% 20%, rgba(56,189,248,0.08), transparent 26%),
      repeating-linear-gradient(0deg, transparent 0 7px, rgba(34,197,94,0.045) 7px 8px),
      repeating-linear-gradient(90deg, transparent 0 7px, rgba(56,189,248,0.030) 7px 8px),
      linear-gradient(180deg, #030703 0%, #061106 54%, #020402 100%) !important;
  }

  html[data-historietas-tema-visual="pixel"] button,
  html[data-historietas-tema-visual="pixel"] input,
  html[data-historietas-tema-visual="pixel"] textarea,
  html[data-historietas-tema-visual="pixel"] select,
  html[data-historietas-tema-visual="pixel"] a,
  html[data-historietas-tema-visual="pixel"] [style*="border-radius"] {
    border-radius: 3px !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  html[data-historietas-tema-visual="pixel"] button,
  html[data-historietas-tema-visual="pixel"] input,
  html[data-historietas-tema-visual="pixel"] textarea,
  html[data-historietas-tema-visual="pixel"] select {
    border-color: color-mix(in srgb, var(--historietas-pixel-border) 52%, rgba(255,255,255,0.10)) !important;
    background-color: var(--historietas-input-bg, #020602) !important;
    image-rendering: pixelated;
  }

  html[data-historietas-tema-visual="pixel"] img,
  html[data-historietas-tema-visual="pixel"] canvas,
  html[data-historietas-tema-visual="pixel"] video,
  html[data-historietas-tema-visual="pixel"] [style*="background-image"] {
    image-rendering: pixelated;
  }

  html[data-historietas-tema-visual="pixel"] .historietas-theme-logo-text,
  html[data-historietas-tema-visual="pixel"] .historietas-theme-title {
    background: none !important;
    color: #86EFAC !important;
    -webkit-text-fill-color: #86EFAC !important;
    letter-spacing: 0.06em !important;
    text-transform: uppercase;
  }

`;

export function obterTemaVisualSeguro(valor: unknown): TemaVisualHistorietas {
  if (typeof valor === "string" && valor in TEMAS_VISUAIS_HISTORIETAS) {
    return valor as TemaVisualHistorietas;
  }

  return "original";
}

export function carregarTemaVisualSalvo(): TemaVisualHistorietas {
  if (typeof localStorage === "undefined") {
    return "original";
  }

  try {
    const texto = localStorage.getItem(THEME_STORAGE_KEY);

    if (!texto) {
      return "original";
    }

    try {
      return obterTemaVisualSeguro(JSON.parse(texto));
    } catch {
      return obterTemaVisualSeguro(texto);
    }
  } catch {
    return "original";
  }
}

export function aplicarTemaVisual(temaVisual: TemaVisualHistorietas) {
  if (typeof document === "undefined") {
    return;
  }

  const tema = TEMAS_VISUAIS_HISTORIETAS[temaVisual];
  const raiz = document.documentElement;
  const fundoDocumento =
    temaVisual === "branco"
      ? "#FFFFFF"
      : temaVisual === "escuro"
        ? "#000000"
        : temaVisual === "pixel"
          ? "#030703"
          : tema.bgStart;

  document.body.style.background = fundoDocumento;
  raiz.style.background = fundoDocumento;

  Object.entries({
    "--historietas-accent": tema.accent,
    "--historietas-secondary": tema.secondary,
    "--historietas-bg-start": tema.bgStart,
    "--historietas-bg-mid": tema.bgMid,
    "--historietas-bg-end": tema.bgEnd,
    "--historietas-glow-primary": tema.glowPrimary,
    "--historietas-glow-secondary": tema.glowSecondary,
    "--historietas-text-primary": tema.textPrimary || "#FFFFFF",
    "--historietas-text-secondary": tema.textSecondary || "#D4D4D8",
    "--historietas-surface": tema.surface || "rgba(18,12,30,0.82)",
    "--historietas-surface-strong": tema.surfaceStrong || "rgba(18,12,30,0.98)",
    "--historietas-border-soft": tema.borderSoft || "rgba(255,255,255,0.08)",
    "--historietas-input-bg": tema.inputBg || "#18181B",
    "--historietas-input-text": tema.inputText || "#FFFFFF",
    "--historietas-title-from": tema.titleFrom || "#FFFFFF",
    "--historietas-title-mid": tema.titleMid || "#F5F3FF",
    "--historietas-title-to": tema.titleTo || "#FDBA74",
    "--historietas-hero-shadow": tema.heroShadow || temaBaseEscuro.heroShadow,
    "--historietas-card-shadow": tema.cardShadow || temaBaseEscuro.cardShadow,
    "--historietas-logo-shadow": tema.logoShadow || temaBaseEscuro.logoShadow,
    "--historietas-active-surface":
      tema.activeSurface ||
      "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 25%, rgba(18,12,30,0.92))",
    "--historietas-secondary-surface":
      tema.secondarySurface ||
      "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, rgba(255,255,255,0.035))",
    "--historietas-secondary-button-text": tema.secondaryButtonText || "#DDD6FE",
    "--historietas-danger-surface": tema.dangerSurface || "rgba(239,68,68,0.105)",
    "--historietas-danger-button-text": tema.dangerButtonText || "#FCA5A5",
  }).forEach(([variavel, valor]) => {
    raiz.style.setProperty(variavel, valor);
  });

  aplicarVariaveisDaBarraInferior(temaVisual, tema);

  raiz.dataset.historietasTemaVisual = temaVisual;
  document.body.dataset.historietasTemaVisual = temaVisual;
}

function aplicarVariaveisDaBarraInferior(
  temaVisual: TemaVisualHistorietas,
  tema: TemaVisualHistorietasConfig
) {
  const raiz = document.documentElement;
  const isBranco = temaVisual === "branco";
  const isPixel = temaVisual === "pixel";

  raiz.style.setProperty(
    "--historietas-bottom-nav-bg",
    isBranco
      ? "#FFFFFF"
      : isPixel
        ? "repeating-linear-gradient(0deg, transparent 0 7px, rgba(34,197,94,0.055) 7px 8px), linear-gradient(180deg, #07120A 0%, #030803 100%)"
        : "#10051f"
  );

  raiz.style.setProperty(
    "--historietas-bottom-nav-border",
    isBranco ? "#DADCE0" : "rgba(124,58,237,0.42)"
  );

  raiz.style.setProperty("--historietas-bottom-nav-shadow", "none");

  raiz.style.setProperty(
    "--historietas-bottom-nav-text",
    isBranco ? "#5F6368" : "#C4B5FD"
  );

  raiz.style.setProperty(
    "--historietas-bottom-nav-hover-bg",
    isBranco ? "#F1F3F4" : "rgba(124,58,237,0.18)"
  );

  raiz.style.setProperty(
    "--historietas-bottom-nav-hover-text",
    isBranco ? "#202124" : "#FFFFFF"
  );

  raiz.style.setProperty(
    "--historietas-bottom-nav-icon-text",
    isBranco ? "#5F6368" : "#DDD6FE"
  );

  raiz.style.setProperty(
    "--historietas-bottom-nav-icon-bg",
    isBranco ? "#F1F3F4" : "rgba(124,58,237,0.20)"
  );

  raiz.style.setProperty(
    "--historietas-bottom-nav-icon-border",
    isBranco ? "#E0E3E7" : "rgba(167,139,250,0.30)"
  );

  raiz.style.setProperty(
    "--historietas-bottom-nav-active-bg",
    isBranco ? "rgba(26,115,232,0.10)" : "rgba(124,58,237,0.38)"
  );

  raiz.style.setProperty(
    "--historietas-bottom-nav-active-border",
    isBranco ? "#1A73E8" : "rgba(196,181,253,0.62)"
  );

  raiz.style.setProperty(
    "--historietas-bottom-nav-active-icon-bg",
    isBranco ? "#1A73E8" : "#7C3AED"
  );

  raiz.style.setProperty(
    "--historietas-bottom-nav-active-icon-border",
    isBranco ? "#1A73E8" : "rgba(221,214,254,0.70)"
  );

  raiz.style.setProperty(
    "--historietas-bottom-nav-main-bg",
    isBranco ? "#1A73E8" : "#7C3AED"
  );

  raiz.style.setProperty(
    "--historietas-bottom-nav-main-border",
    isBranco ? "#1A73E8" : "rgba(196,181,253,0.70)"
  );

  raiz.style.setProperty("--historietas-bottom-nav-main-shadow", "none");
  raiz.style.setProperty("--historietas-bottom-nav-main-icon-bg", "rgba(255,255,255,0.16)");
  raiz.style.setProperty("--historietas-bottom-nav-main-icon-border", "rgba(255,255,255,0.18)");
  raiz.style.setProperty("--historietas-bottom-nav-shine", "none");
}

export function criarPageThemeStyle(
  pageStyle: CSSProperties,
  temaVisual: TemaVisualHistorietas
): CSSProperties {
  const tema = TEMAS_VISUAIS_HISTORIETAS[temaVisual];

  return {
    ...pageStyle,
    background:
      temaVisual === "branco"
        ? "linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 58%, #F8F9FA 100%)"
        : temaVisual === "escuro"
          ? "linear-gradient(180deg, #000000 0%, #000000 100%)"
          : temaVisual === "pixel"
            ? "radial-gradient(circle at 18% 0%, rgba(34,197,94,0.10), transparent 28%), radial-gradient(circle at 86% 20%, rgba(56,189,248,0.08), transparent 26%), repeating-linear-gradient(0deg, transparent 0 7px, rgba(34,197,94,0.045) 7px 8px), repeating-linear-gradient(90deg, transparent 0 7px, rgba(56,189,248,0.030) 7px 8px), linear-gradient(180deg, #030703 0%, #061106 54%, #020402 100%)"
            : temaVisual === "original"
              ? tema.bgStart
              : pageStyle.background,
  };
}

export function useHistorietasTheme(pageStyle: CSSProperties) {
  const [temaVisual, setTemaVisual] = useState<TemaVisualHistorietas>("original");

  const pageThemeStyle = useMemo<CSSProperties>(
    () => criarPageThemeStyle(pageStyle, temaVisual),
    [pageStyle, temaVisual]
  );

  useEffect(() => {
    const temaSalvo = carregarTemaVisualSalvo();

    setTemaVisual(temaSalvo);
    aplicarTemaVisual(temaSalvo);
  }, []);

  return {
    temaVisual,
    pageThemeStyle,
    setTemaVisual,
    aplicarTemaVisual,
    historietasThemeCss,
  };
}