"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "./supabase/client";

export const THEME_STORAGE_KEY = "historietas-tema-visual";

export function criarStorageKeyUsuarioTema(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : "";
}

export type TemaVisualHistorietas = "original" | "foco";

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
  original: {
    accent: "#F97316",
    secondary: "#7C3AED",
    bgStart: "#070212",
    bgMid: "#070212",
    bgEnd: "#070212",
    glowPrimary: "transparent",
    glowSecondary: "transparent",
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
    activeSurface:
      "color-mix(in srgb, #7C3AED 25%, rgba(18,12,30,0.92))",
    secondarySurface:
      "color-mix(in srgb, #7C3AED 18%, rgba(255,255,255,0.035))",
    secondaryButtonText: "#DDD6FE",
    dangerSurface: "rgba(239,68,68,0.105)",
    dangerButtonText: "#FCA5A5",
  },
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

export function obterTemaVisualSeguro(valor: unknown): TemaVisualHistorietas {
  return valor === "foco" ? "foco" : "original";
}

function lerTemaVisualDaChave(chave: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const texto = window.localStorage.getItem(chave);

    if (!texto) {
      return null;
    }

    try {
      return obterTemaVisualSeguro(JSON.parse(texto));
    } catch {
      return obterTemaVisualSeguro(texto);
    }
  } catch {
    return null;
  }
}

export function carregarTemaVisualSalvo(
  userId = "",
  permitirLegadoGlobal = false
): TemaVisualHistorietas {
  if (typeof window === "undefined") {
    return "original";
  }

  const userIdLimpo = userId.trim();

  if (userIdLimpo) {
    const chaveUsuario = criarStorageKeyUsuarioTema(
      THEME_STORAGE_KEY,
      userIdLimpo
    );
    const temaUsuario = chaveUsuario
      ? lerTemaVisualDaChave(chaveUsuario)
      : null;

    if (temaUsuario) {
      return temaUsuario;
    }
  }

  if (permitirLegadoGlobal) {
    return lerTemaVisualDaChave(THEME_STORAGE_KEY) || "original";
  }

  return "original";
}

export function salvarTemaVisualSalvo(
  temaVisual: TemaVisualHistorietas,
  userId = ""
) {
  if (typeof window === "undefined") {
    return;
  }

  const temaSeguro = obterTemaVisualSeguro(temaVisual);
  const userIdLimpo = userId.trim();

  try {
    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      JSON.stringify(temaSeguro)
    );

    if (userIdLimpo) {
      const chaveUsuario = criarStorageKeyUsuarioTema(
        THEME_STORAGE_KEY,
        userIdLimpo
      );

      if (chaveUsuario) {
        window.localStorage.setItem(
          chaveUsuario,
          JSON.stringify(temaSeguro)
        );
      }
    }
  } catch {
    // A preferência continua aplicada na sessão mesmo sem localStorage.
  }

  aplicarTemaVisual(temaSeguro);

  window.dispatchEvent(
    new CustomEvent("historietas:tema-visual-atualizado", {
      detail: {
        temaVisual: temaSeguro,
        userId: userIdLimpo,
      },
    })
  );
}

export function criarFundoTemaHistorietas(
  temaVisual: TemaVisualHistorietas
) {
  return temaVisual === "foco" ? "#000000" : "#070212";
}

function aplicarVariaveisDaBarraInferior(
  temaVisual: TemaVisualHistorietas
) {
  const raiz = document.documentElement;
  const foco = temaVisual === "foco";

  const variaveis = foco
    ? {
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
      }
    : {
        "--historietas-bottom-nav-bg": "#10051f",
        "--historietas-bottom-nav-background": "#10051f",
        "--historietas-bottom-nav-border": "rgba(124,58,237,0.42)",
        "--historietas-bottom-nav-shadow": "none",
        "--historietas-bottom-nav-text": "#C4B5FD",
        "--historietas-bottom-nav-hover-bg": "rgba(124,58,237,0.18)",
        "--historietas-bottom-nav-hover-text": "#FFFFFF",
        "--historietas-bottom-nav-icon-text": "#DDD6FE",
        "--historietas-bottom-nav-icon-bg": "rgba(124,58,237,0.20)",
        "--historietas-bottom-nav-icon-border": "rgba(167,139,250,0.30)",
        "--historietas-bottom-nav-active-bg": "rgba(124,58,237,0.38)",
        "--historietas-bottom-nav-active-border": "rgba(196,181,253,0.62)",
        "--historietas-bottom-nav-active-text": "#FFFFFF",
        "--historietas-bottom-nav-active-icon-bg": "#7C3AED",
        "--historietas-bottom-nav-active-icon-border":
          "rgba(221,214,254,0.70)",
        "--historietas-bottom-nav-active-icon-text": "#FFFFFF",
        "--historietas-bottom-nav-main-bg": "#7C3AED",
        "--historietas-bottom-nav-main-border":
          "rgba(196,181,253,0.70)",
        "--historietas-bottom-nav-main-text": "#FFFFFF",
        "--historietas-bottom-nav-main-shadow": "none",
        "--historietas-bottom-nav-main-icon-bg":
          "rgba(255,255,255,0.16)",
        "--historietas-bottom-nav-main-icon-border":
          "rgba(255,255,255,0.18)",
        "--historietas-bottom-nav-publish-bg": "#7C3AED",
        "--historietas-bottom-nav-publish-border":
          "rgba(196,181,253,0.70)",
        "--historietas-bottom-nav-shine": "none",
      };

  Object.entries(variaveis).forEach(([variavel, valor]) => {
    raiz.style.setProperty(variavel, valor);
  });
}

export function aplicarTemaVisual(
  temaVisual: TemaVisualHistorietas
) {
  if (typeof document === "undefined") {
    return;
  }

  const temaSeguro = obterTemaVisualSeguro(temaVisual);
  const tema = TEMAS_VISUAIS_HISTORIETAS[temaSeguro];
  const raiz = document.documentElement;
  const fundo = criarFundoTemaHistorietas(temaSeguro);

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
    "--historietas-obra-bg-deep":
      temaSeguro === "foco" ? "#000000" : "#04000A",
    "--historietas-obra-bg-shadow-42":
      temaSeguro === "foco"
        ? "rgba(0,0,0,0.72)"
        : "rgba(3,2,8,0.42)",
    "--historietas-obra-menu-98":
      temaSeguro === "foco" ? "#000000" : "rgba(18,9,35,0.98)",
    "--historietas-obra-purple-58":
      temaSeguro === "foco"
        ? "rgba(255,255,255,0.18)"
        : "rgba(59,7,100,0.58)",
    "--historietas-obra-purple-72":
      temaSeguro === "foco" ? "#050505" : "rgba(59,7,100,0.72)",
    "--historietas-obra-secondary-soft-34":
      temaSeguro === "foco"
        ? "rgba(255,255,255,0.18)"
        : "rgba(167,139,250,0.34)",
  };

  Object.entries(variaveis).forEach(([variavel, valor]) => {
    raiz.style.setProperty(variavel, valor);
  });

  aplicarVariaveisDaBarraInferior(temaSeguro);

  raiz.dataset.historietasTemaVisual = temaSeguro;
  raiz.style.background = fundo;
  raiz.style.colorScheme = "dark";

  if (document.body) {
    document.body.style.background = fundo;
    document.body.style.color = tema.textPrimary;
  }
}

export const historietasThemeCss = `
  html[data-historietas-tema-visual="foco"],
  html[data-historietas-tema-visual="foco"] body,
  html[data-historietas-tema-visual="foco"] main {
    background: #000000 !important;
    color: #FFFFFF !important;
    color-scheme: dark;
  }

  html[data-historietas-tema-visual="foco"] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  html[data-historietas-tema-visual="foco"] input,
  html[data-historietas-tema-visual="foco"] textarea,
  html[data-historietas-tema-visual="foco"] select {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.18) !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual="foco"] input::placeholder,
  html[data-historietas-tema-visual="foco"] textarea::placeholder {
    color: #A1A1AA !important;
    opacity: 1 !important;
  }

  html[data-historietas-tema-visual="foco"] [role="dialog"],
  html[data-historietas-tema-visual="foco"] [role="menu"],
  html[data-historietas-tema-visual="foco"] [role="listbox"] {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.18) !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual="foco"] .historietas-theme-logo-text,
  html[data-historietas-tema-visual="foco"] .historietas-theme-title {
    background: none !important;
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    text-shadow: none !important;
  }

  html[data-historietas-tema-visual="foco"] nav.historietas-bottom-nav,
  html[data-historietas-tema-visual="foco"] [data-bottom-nav="true"],
  html[data-historietas-tema-visual="foco"] [data-mobile-nav="true"],
  html[data-historietas-tema-visual="foco"] nav:has(a[href="/publicar"]) {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.18) !important;
    box-shadow: none !important;
    color: #A1A1AA !important;
  }

  html[data-historietas-tema-visual="foco"] nav.historietas-bottom-nav a,
  html[data-historietas-tema-visual="foco"] [data-bottom-nav="true"] a,
  html[data-historietas-tema-visual="foco"] [data-mobile-nav="true"] a {
    color: #A1A1AA !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual="foco"] nav.historietas-bottom-nav .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual="foco"] [data-bottom-nav="true"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual="foco"] [data-mobile-nav="true"] .historietas-bottom-nav-icon {
    background: #050505 !important;
    border-color: rgba(255,255,255,0.18) !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual="foco"] nav.historietas-bottom-nav .historietas-bottom-nav-item[aria-current="page"],
  html[data-historietas-tema-visual="foco"] nav.historietas-bottom-nav .historietas-bottom-nav-item-active,
  html[data-historietas-tema-visual="foco"] [data-bottom-nav="true"] .historietas-bottom-nav-item[aria-current="page"],
  html[data-historietas-tema-visual="foco"] [data-bottom-nav="true"] .historietas-bottom-nav-item-active,
  html[data-historietas-tema-visual="foco"] [data-mobile-nav="true"] .historietas-bottom-nav-item[aria-current="page"],
  html[data-historietas-tema-visual="foco"] [data-mobile-nav="true"] .historietas-bottom-nav-item-active {
    background: #000000 !important;
    border-color: #FFFFFF !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual="foco"] nav.historietas-bottom-nav .historietas-bottom-nav-item[aria-current="page"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual="foco"] nav.historietas-bottom-nav .historietas-bottom-nav-item-active .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual="foco"] [data-bottom-nav="true"] .historietas-bottom-nav-item[aria-current="page"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual="foco"] [data-bottom-nav="true"] .historietas-bottom-nav-item-active .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual="foco"] [data-mobile-nav="true"] .historietas-bottom-nav-item[aria-current="page"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual="foco"] [data-mobile-nav="true"] .historietas-bottom-nav-item-active .historietas-bottom-nav-icon {
    background: #FFFFFF !important;
    border-color: #FFFFFF !important;
    color: #000000 !important;
  }

  html[data-historietas-tema-visual="foco"] nav.historietas-bottom-nav a[href="/publicar"],
  html[data-historietas-tema-visual="foco"] [data-bottom-nav="true"] a[href="/publicar"],
  html[data-historietas-tema-visual="foco"] [data-mobile-nav="true"] a[href="/publicar"] {
    background: #000000 !important;
    border-color: #FFFFFF !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual="foco"] [data-historietas-obra-comments="true"] {
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

  html[data-historietas-tema-visual="foco"] [data-historietas-obra-comments="true"] [role="dialog"],
  html[data-historietas-tema-visual="foco"] [data-historietas-obra-comments="true"] [role="menu"] {
    background-color: #000000 !important;
    border-color: rgba(255,255,255,0.18) !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual="foco"] [data-historietas-obra-comments="true"] textarea {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.18) !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual="foco"] [data-historietas-obra-comments="true"] textarea::placeholder {
    color: #A1A1AA !important;
    opacity: 1 !important;
  }

  html[data-historietas-tema-visual="foco"] ::selection {
    background: #FFFFFF;
    color: #000000;
  }
`;

export function criarPageThemeStyle(
  pageStyle: CSSProperties,
  temaVisual: TemaVisualHistorietas
): CSSProperties {
  if (temaVisual === "original") {
    return pageStyle;
  }

  return {
    ...pageStyle,
    background: "#000000",
    color: "#FFFFFF",
  };
}

export function useHistorietasTheme(pageStyle: CSSProperties) {
  const [temaVisual, setTemaVisual] =
    useState<TemaVisualHistorietas>("original");

  const pageThemeStyle = useMemo<CSSProperties>(
    () => criarPageThemeStyle(pageStyle, temaVisual),
    [pageStyle, temaVisual]
  );

  useEffect(() => {
    let cancelado = false;

    async function carregarTemaDoUsuarioAtual() {
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id || "";
        const temaSalvo = carregarTemaVisualSalvo(userId, true);

        if (cancelado) {
          return;
        }

        setTemaVisual(temaSalvo);
        aplicarTemaVisual(temaSalvo);
      } catch {
        if (!cancelado) {
          const temaSalvo = carregarTemaVisualSalvo("", true);

          setTemaVisual(temaSalvo);
          aplicarTemaVisual(temaSalvo);
        }
      }
    }

    void carregarTemaDoUsuarioAtual();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user.id || "";
      const temaSalvo = carregarTemaVisualSalvo(userId, true);

      setTemaVisual(temaSalvo);
      aplicarTemaVisual(temaSalvo);
    });

    function atualizarTemaAoMudarStorage(evento: StorageEvent) {
      const chave = evento.key || "";

      if (
        chave === THEME_STORAGE_KEY ||
        chave.startsWith(`${THEME_STORAGE_KEY}:`)
      ) {
        void carregarTemaDoUsuarioAtual();
      }
    }

    function atualizarTemaPorEvento() {
      void carregarTemaDoUsuarioAtual();
    }

    window.addEventListener("storage", atualizarTemaAoMudarStorage);
    window.addEventListener(
      "historietas:tema-visual-atualizado",
      atualizarTemaPorEvento
    );

    return () => {
      cancelado = true;
      subscription.unsubscribe();
      window.removeEventListener("storage", atualizarTemaAoMudarStorage);
      window.removeEventListener(
        "historietas:tema-visual-atualizado",
        atualizarTemaPorEvento
      );
    };
  }, []);

  return {
    temaVisual,
    pageThemeStyle,
    setTemaVisual,
    aplicarTemaVisual,
    salvarTemaVisualSalvo,
    historietasThemeCss,
  };
}