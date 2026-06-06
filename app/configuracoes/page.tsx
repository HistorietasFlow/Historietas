"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";

type TemaVisual =
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
  | "misterio"
  | "suspense"
  | "sobrenatural"
  | "historico"
  | "biografia"
  | "comedia"
  | "pixel";

type PreferenciasConta = {
  nomeExibicao: string;
  emailContato: string;
  receberAvisos: boolean;
  leituraConfortavel: boolean;
  reduzirEfeitos: boolean;
  temaVisual: TemaVisual;
};

type ResumoLocal = {
  obras: number;
  notificacoes: number;
  lancamentos: number;
  favoritas: number;
  concluidas: number;
  seguindoObras: number;
  seguindoAutores: number;
};

const CONFIG_STORAGE_KEY = "historietas-configuracoes-conta";
const THEME_STORAGE_KEY = "historietas-tema-visual";

const TEMAS_VISUAIS: Record<
  TemaVisual,
  {
    nome: string;
    descricao: string;
    icone: string;
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
  }
> = {
  branco: {
    nome: "Branco",
    descricao: "Modo claro limpo no estilo Google/Play Store.",
    icone: "G",
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
    secondarySurface: "rgba(1,135,95,0.10)",
    secondaryButtonText: "#188038",
    dangerSurface: "rgba(217,48,37,0.10)",
    dangerButtonText: "#B3261E",
  },
  escuro: {
    nome: "Escuro",
    descricao: "Modo escuro com fundo preto e cores padrão do Historietas.",
    icone: "N",
    accent: "#F97316",
    secondary: "#7C3AED",
    bgStart: "#000000",
    bgMid: "#000000",
    bgEnd: "#000000",
    glowPrimary: "rgba(249,115,22,0.030)",
    glowSecondary: "rgba(124,58,237,0.030)",
    textPrimary: "#FFFFFF",
    textSecondary: "#B3B3B3",
    surface: "#101010",
    surfaceStrong: "#000000",
    borderSoft: "rgba(255,255,255,0.11)",
    inputBg: "#0B0B0B",
    inputText: "#FFFFFF",
    titleFrom: "#FFFFFF",
    titleMid: "#FFFFFF",
    titleTo: "#FFFFFF",
    heroShadow: "none",
    cardShadow: "none",
    logoShadow: "none",
    activeSurface: "rgba(124,58,237,0.14)",
    secondarySurface: "rgba(124,58,237,0.12)",
    secondaryButtonText: "#FFFFFF",
    dangerSurface: "rgba(239,68,68,0.12)",
    dangerButtonText: "#FCA5A5",
  },
  foco: {
    nome: "Foco",
    descricao: "Base escura quase preta, inspirada no modo foco da leitura.",
    icone: "◉",
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
    titleFrom: "#FFFFFF",
    titleMid: "#E4E4E7",
    titleTo: "#A78BFA",
  },
  original: {
    nome: "Original",
    descricao: "Roxo e laranja premium, o visual padrão do app.",
    icone: "✦",
    accent: "#F97316",
    secondary: "#7C3AED",
    bgStart: "#0B0614",
    bgMid: "#12081F",
    bgEnd: "#17101B",
    glowPrimary: "rgba(124,58,237,0.32)",
    glowSecondary: "rgba(249,115,22,0.16)",
  },
  fantasia: {
    nome: "Fantasia",
    descricao: "Aura mística com violeta profundo e azul arcano.",
    icone: "◇",
    accent: "#A855F7",
    secondary: "#2563EB",
    bgStart: "#090417",
    bgMid: "#130A2A",
    bgEnd: "#0B1028",
    glowPrimary: "rgba(168,85,247,0.34)",
    glowSecondary: "rgba(37,99,235,0.18)",
  },
  romance: {
    nome: "Romance",
    descricao: "Rosa, vinho e brilho suave para histórias emocionais.",
    icone: "♡",
    accent: "#EC4899",
    secondary: "#BE123C",
    bgStart: "#140711",
    bgMid: "#251022",
    bgEnd: "#1E0B16",
    glowPrimary: "rgba(236,72,153,0.30)",
    glowSecondary: "rgba(190,18,60,0.18)",
  },
  terror: {
    nome: "Terror",
    descricao: "Vermelho sombrio, clima pesado e cinematográfico.",
    icone: "☾",
    accent: "#EF4444",
    secondary: "#7F1D1D",
    bgStart: "#080305",
    bgMid: "#160707",
    bgEnd: "#100608",
    glowPrimary: "rgba(239,68,68,0.30)",
    glowSecondary: "rgba(127,29,29,0.22)",
  },
  acao: {
    nome: "Ação",
    descricao: "Laranja e vermelho intenso, com energia de batalha.",
    icone: "⚡",
    accent: "#F97316",
    secondary: "#DC2626",
    bgStart: "#100604",
    bgMid: "#1E0B08",
    bgEnd: "#17101B",
    glowPrimary: "rgba(249,115,22,0.34)",
    glowSecondary: "rgba(220,38,38,0.18)",
  },
  scifi: {
    nome: "Sci-fi",
    descricao: "Azul e ciano neon para mundos tecnológicos.",
    icone: "◌",
    accent: "#06B6D4",
    secondary: "#2563EB",
    bgStart: "#031017",
    bgMid: "#071C2D",
    bgEnd: "#071321",
    glowPrimary: "rgba(6,182,212,0.30)",
    glowSecondary: "rgba(37,99,235,0.20)",
  },
  drama: {
    nome: "Drama",
    descricao: "Roxo dramático e profundo para histórias intensas.",
    icone: "✧",
    accent: "#C084FC",
    secondary: "#581C87",
    bgStart: "#0E0718",
    bgMid: "#160A24",
    bgEnd: "#17101F",
    glowPrimary: "rgba(192,132,252,0.30)",
    glowSecondary: "rgba(88,28,135,0.22)",
  },
  aventura: {
    nome: "Aventura",
    descricao: "Deserto cinematográfico, ruínas e jornadas de exploração.",
    icone: "⌖",
    accent: "#EAB308",
    secondary: "#92400E",
    bgStart: "#0D0803",
    bgMid: "#171006",
    bgEnd: "#1F1308",
    glowPrimary: "rgba(234,179,8,0.18)",
    glowSecondary: "rgba(146,64,14,0.20)",
    titleTo: "#FDE68A",
    activeSurface: "rgba(234,179,8,0.15)",
    secondarySurface: "rgba(146,64,14,0.20)",
    secondaryButtonText: "#FDE68A",
  },
  misterio: {
    nome: "Mistério",
    descricao: "Azul investigativo e índigo para segredos e pistas ocultas.",
    icone: "?",
    accent: "#818CF8",
    secondary: "#312E81",
    bgStart: "#060817",
    bgMid: "#0B1026",
    bgEnd: "#10112A",
    glowPrimary: "rgba(129,140,248,0.26)",
    glowSecondary: "rgba(49,46,129,0.24)",
    titleTo: "#C7D2FE",
    activeSurface: "rgba(129,140,248,0.16)",
    secondarySurface: "rgba(49,46,129,0.22)",
    secondaryButtonText: "#C7D2FE",
  },
  suspense: {
    nome: "Suspense",
    descricao: "Verde ácido escuro e oliva para tensão e alerta constante.",
    icone: "!",
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
  sobrenatural: {
    nome: "Sobrenatural",
    descricao: "Verde espectral com toque místico e misterioso.",
    icone: "☾",
    accent: "#34D399",
    secondary: "#065F46",
    bgStart: "#06120D",
    bgMid: "#0B1D1C",
    bgEnd: "#10171A",
    glowPrimary: "rgba(52,211,153,0.24)",
    glowSecondary: "rgba(6,95,70,0.22)",
  },
  historico: {
    nome: "Histórico",
    descricao: "Marrom antigo e cobre escuro para épocas, arquivos e memória.",
    icone: "⌛",
    accent: "#D97706",
    secondary: "#78350F",
    bgStart: "#110805",
    bgMid: "#1A0F08",
    bgEnd: "#17100A",
    glowPrimary: "rgba(217,119,6,0.22)",
    glowSecondary: "rgba(120,53,15,0.25)",
    titleTo: "#FDBA74",
    activeSurface: "rgba(217,119,6,0.16)",
    secondarySurface: "rgba(120,53,15,0.22)",
    secondaryButtonText: "#FED7AA",
  },
  biografia: {
    nome: "Biografia",
    descricao: "Azul aço e grafite para perfis, memória real e documento.",
    icone: "B",
    accent: "#60A5FA",
    secondary: "#334155",
    bgStart: "#06101F",
    bgMid: "#0B1728",
    bgEnd: "#101827",
    glowPrimary: "rgba(96,165,250,0.22)",
    glowSecondary: "rgba(51,65,85,0.28)",
    titleTo: "#BFDBFE",
    activeSurface: "rgba(96,165,250,0.15)",
    secondarySurface: "rgba(51,65,85,0.24)",
    secondaryButtonText: "#BFDBFE",
  },
  comedia: {
    nome: "Comédia",
    descricao: "Amarelo vibrante e coral para histórias leves e divertidas.",
    icone: "☀",
    accent: "#FACC15",
    secondary: "#FB7185",
    bgStart: "#110D04",
    bgMid: "#1D1608",
    bgEnd: "#1A1014",
    glowPrimary: "rgba(250,204,21,0.24)",
    glowSecondary: "rgba(251,113,133,0.18)",
  },
  pixel: {
    nome: "Pixel",
    descricao: "Interface retrô em estilo arcade/RPG, com bordas secas e grid pixelado.",
    icone: "▣",
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

const ORDEM_TEMAS_VISUAIS: TemaVisual[] = [
  "branco",
  "escuro",
  "foco",
  "original",
  "fantasia",
  "romance",
  "terror",
  "acao",
  "scifi",
  "drama",
  "aventura",
  "misterio",
  "suspense",
  "sobrenatural",
  "historico",
  "biografia",
  "comedia",
  "pixel",
];

const CHAVES_RESUMO = [
  "historietas-obras",
  "historietas-notificacoes",
  "historietas-lancamentos-salvos",
  "historietas-obras-favoritas",
  "historietas-obras-concluidas",
  "historietas-obras-seguidas",
  "historietas-autores-seguidos",
  "historietas-perfis-autores",
  THEME_STORAGE_KEY,
];

const preferenciasPadrao: PreferenciasConta = {
  nomeExibicao: "",
  emailContato: "",
  receberAvisos: true,
  leituraConfortavel: true,
  reduzirEfeitos: false,
  temaVisual: "original",
};

const resumoPadrao: ResumoLocal = {
  obras: 0,
  notificacoes: 0,
  lancamentos: 0,
  favoritas: 0,
  concluidas: 0,
  seguindoObras: 0,
  seguindoAutores: 0,
};


function obterTemaVisualSeguro(valor: unknown): TemaVisual {
  if (typeof valor === "string" && valor in TEMAS_VISUAIS) {
    return valor as TemaVisual;
  }

  return "original";
}

function carregarTemaVisualSalvo() {
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

function salvarTemaVisual(temaVisual: TemaVisual) {
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(temaVisual));
}

function aplicarTemaVisual(temaVisual: TemaVisual) {
  if (typeof document === "undefined") {
    return;
  }

  const tema = TEMAS_VISUAIS[temaVisual];
  const raiz = document.documentElement;

  raiz.style.setProperty("--historietas-accent", tema.accent);
  raiz.style.setProperty("--historietas-secondary", tema.secondary);
  raiz.style.setProperty("--historietas-bg-start", tema.bgStart);
  raiz.style.setProperty("--historietas-bg-mid", tema.bgMid);
  raiz.style.setProperty("--historietas-bg-end", tema.bgEnd);
  raiz.style.setProperty("--historietas-glow-primary", tema.glowPrimary);
  raiz.style.setProperty("--historietas-glow-secondary", tema.glowSecondary);
  raiz.style.setProperty("--historietas-text-primary", tema.textPrimary || "#FFFFFF");
  raiz.style.setProperty("--historietas-text-secondary", tema.textSecondary || "#D4D4D8");
  raiz.style.setProperty("--historietas-surface", tema.surface || "rgba(18,12,30,0.82)");
  raiz.style.setProperty("--historietas-surface-strong", tema.surfaceStrong || "rgba(18,12,30,0.98)");
  raiz.style.setProperty("--historietas-border-soft", tema.borderSoft || "rgba(255,255,255,0.08)");
  raiz.style.setProperty("--historietas-input-bg", tema.inputBg || "#18181B");
  raiz.style.setProperty("--historietas-input-text", tema.inputText || "#FFFFFF");
  raiz.style.setProperty("--historietas-title-from", tema.titleFrom || "#FFFFFF");
  raiz.style.setProperty("--historietas-title-mid", tema.titleMid || "#F5F3FF");
  raiz.style.setProperty("--historietas-title-to", tema.titleTo || "#FDBA74");
  raiz.style.setProperty("--historietas-hero-shadow", tema.heroShadow || "0 18px 48px rgba(0,0,0,0.32), 0 0 36px rgba(124,58,237,0.12)");
  raiz.style.setProperty("--historietas-card-shadow", tema.cardShadow || "0 14px 36px rgba(0,0,0,0.20)");
  raiz.style.setProperty("--historietas-logo-shadow", tema.logoShadow || "0 0 26px rgba(139, 92, 246, 0.24)");
  raiz.style.setProperty("--historietas-active-surface", tema.activeSurface || "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 25%, rgba(18,12,30,0.92))");
  raiz.style.setProperty("--historietas-secondary-surface", tema.secondarySurface || "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, rgba(255,255,255,0.035))");
  raiz.style.setProperty("--historietas-secondary-button-text", tema.secondaryButtonText || "#DDD6FE");
  raiz.style.setProperty("--historietas-danger-surface", tema.dangerSurface || "rgba(239, 68, 68, 0.105)");
  raiz.style.setProperty("--historietas-danger-button-text", tema.dangerButtonText || "#FCA5A5");

  const surface = tema.surface || "rgba(18,12,30,0.82)";
  const surfaceStrong = tema.surfaceStrong || "rgba(18,12,30,0.98)";
  const borderSoft = tema.borderSoft || "rgba(255,255,255,0.08)";
  const textPrimary = tema.textPrimary || "#FFFFFF";
  const textSecondary = tema.textSecondary || "#D4D4D8";
  const activeSurface =
    tema.activeSurface ||
    "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 25%, rgba(18,12,30,0.92))";

  const isBranco = temaVisual === "branco";
  const isEscuro = temaVisual === "escuro";
  const isFoco = temaVisual === "foco";

  raiz.style.setProperty(
    "--historietas-bottom-nav-bg",
    isBranco
      ? "#FFFFFF"
      : isEscuro
      ? "#050505"
      : isFoco
      ? "#050506"
      : `radial-gradient(circle at 16% 0%, color-mix(in srgb, ${tema.accent} 18%, transparent), transparent 34%), radial-gradient(circle at 84% 0%, color-mix(in srgb, ${tema.secondary} 22%, transparent), transparent 38%), linear-gradient(180deg, ${surfaceStrong} 0%, ${tema.bgStart} 100%)`
  );
  raiz.style.setProperty(
    "--historietas-bottom-nav-border",
    isBranco ? "#DADCE0" : borderSoft
  );
  raiz.style.setProperty(
    "--historietas-bottom-nav-shadow",
    isBranco || isEscuro || isFoco
      ? "none"
      : "0 14px 34px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.06)"
  );
  raiz.style.setProperty(
    "--historietas-bottom-nav-text",
    isBranco ? "#5F6368" : textSecondary
  );
  raiz.style.setProperty(
    "--historietas-bottom-nav-hover-bg",
    isBranco ? "#F1F3F4" : activeSurface
  );
  raiz.style.setProperty(
    "--historietas-bottom-nav-hover-text",
    isBranco ? "#202124" : textPrimary
  );
  raiz.style.setProperty("--historietas-bottom-nav-icon-text", tema.accent);
  raiz.style.setProperty(
    "--historietas-bottom-nav-icon-bg",
    isBranco ? "#F1F3F4" : surface
  );
  raiz.style.setProperty(
    "--historietas-bottom-nav-icon-border",
    isBranco ? "#E0E3E7" : borderSoft
  );
  raiz.style.setProperty(
    "--historietas-bottom-nav-main-bg",
    isBranco
      ? tema.accent
      : `linear-gradient(135deg, ${tema.accent} 0%, ${tema.secondary} 100%)`
  );
  raiz.style.setProperty(
    "--historietas-bottom-nav-main-border",
    isBranco ? tema.accent : `color-mix(in srgb, ${tema.accent} 55%, transparent)`
  );
  raiz.style.setProperty("--historietas-bottom-nav-main-shadow", "none");
  raiz.style.setProperty(
    "--historietas-bottom-nav-main-icon-bg",
    "rgba(255,255,255,0.16)"
  );
  raiz.style.setProperty(
    "--historietas-bottom-nav-main-icon-border",
    "rgba(255,255,255,0.18)"
  );
  raiz.style.setProperty(
    "--historietas-bottom-nav-shine",
    isBranco || isEscuro || isFoco
      ? "none"
      : "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)"
  );
  raiz.dataset.historietasTemaVisual = temaVisual;
  document.body.dataset.historietasTemaVisual = temaVisual;
}

function carregarJsonArray(chave: string) {
  try {
    const texto = localStorage.getItem(chave);
    const json: unknown = texto ? JSON.parse(texto) : [];

    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

function contarItens(chave: string) {
  return carregarJsonArray(chave).length;
}

function criarResumoLocal(): ResumoLocal {
  return {
    obras: contarItens("historietas-obras"),
    notificacoes: contarItens("historietas-notificacoes"),
    lancamentos: contarItens("historietas-lancamentos-salvos"),
    favoritas: contarItens("historietas-obras-favoritas"),
    concluidas: contarItens("historietas-obras-concluidas"),
    seguindoObras: contarItens("historietas-obras-seguidas"),
    seguindoAutores: contarItens("historietas-autores-seguidos"),
  };
}

function carregarPreferencias(): PreferenciasConta {
  try {
    const texto = localStorage.getItem(CONFIG_STORAGE_KEY);
    const json: unknown = texto ? JSON.parse(texto) : null;

    if (!json || typeof json !== "object") {
      return {
        ...preferenciasPadrao,
        temaVisual: carregarTemaVisualSalvo(),
      };
    }

    const preferencias = json as Partial<PreferenciasConta>;

    return {
      nomeExibicao:
        typeof preferencias.nomeExibicao === "string"
          ? preferencias.nomeExibicao
          : "",
      emailContato:
        typeof preferencias.emailContato === "string"
          ? preferencias.emailContato
          : "",
      receberAvisos:
        typeof preferencias.receberAvisos === "boolean"
          ? preferencias.receberAvisos
          : true,
      leituraConfortavel:
        typeof preferencias.leituraConfortavel === "boolean"
          ? preferencias.leituraConfortavel
          : true,
      reduzirEfeitos:
        typeof preferencias.reduzirEfeitos === "boolean"
          ? preferencias.reduzirEfeitos
          : false,
      temaVisual: obterTemaVisualSeguro(
        preferencias.temaVisual || carregarTemaVisualSalvo()
      ),
    };
  } catch {
    return {
      ...preferenciasPadrao,
      temaVisual: carregarTemaVisualSalvo(),
    };
  }
}

function salvarPreferencias(preferencias: PreferenciasConta) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(preferencias));
  salvarTemaVisual(preferencias.temaVisual);
  aplicarTemaVisual(preferencias.temaVisual);
}

function criarBackupLocal() {
  const backup: Record<string, unknown> = {};

  CHAVES_RESUMO.forEach((chave) => {
    try {
      const valor = localStorage.getItem(chave);
      backup[chave] = valor ? JSON.parse(valor) : null;
    } catch {
      backup[chave] = null;
    }
  });

  backup[CONFIG_STORAGE_KEY] = carregarPreferencias();
  backup.exportadoEm = new Date().toISOString();
  backup.projeto = "Historietas";

  return JSON.stringify(backup, null, 2);
}

async function copiarTexto(texto: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(texto);
    return;
  }

  const campoTemporario = document.createElement("textarea");
  campoTemporario.value = texto;
  campoTemporario.setAttribute("readonly", "true");
  campoTemporario.style.position = "fixed";
  campoTemporario.style.left = "-9999px";
  document.body.appendChild(campoTemporario);
  campoTemporario.select();
  document.execCommand("copy");
  document.body.removeChild(campoTemporario);
}

function criarLoginHrefConfiguracoes() {
  const params = new URLSearchParams({
    redirectTo: "/configuracoes",
  });

  return `/login?${params.toString()}`;
}

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [preferencias, setPreferencias] =
    useState<PreferenciasConta>(preferenciasPadrao);
  const [resumo, setResumo] = useState<ResumoLocal>(resumoPadrao);
  const [mensagem, setMensagem] = useState("");
  const [resumoAtualizadoEm, setResumoAtualizadoEm] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const [adminLiberado, setAdminLiberado] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  useEffect(() => {
    let cancelado = false;

    async function verificarAcesso() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (cancelado) {
          return;
        }

        if (error || !data.user) {
          router.replace(criarLoginHrefConfiguracoes());
          return;
        }

        setVerificandoAcesso(false);
      } catch {
        if (!cancelado) {
          router.replace(criarLoginHrefConfiguracoes());
        }
      }
    }

    verificarAcesso();

    return () => {
      cancelado = true;
    };
  }, [router]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 900px)");

    function atualizarModoDesktop() {
      setIsDesktop(mediaQuery.matches);
    }

    atualizarModoDesktop();
    mediaQuery.addEventListener("change", atualizarModoDesktop);

    return () => {
      mediaQuery.removeEventListener("change", atualizarModoDesktop);
    };
  }, []);

  useEffect(() => {
    if (verificandoAcesso) {
      return;
    }

    const preferenciasCarregadas = carregarPreferencias();

    setPreferencias(preferenciasCarregadas);
    aplicarTemaVisual(preferenciasCarregadas.temaVisual);
    setResumo(criarResumoLocal());
    setResumoAtualizadoEm(new Date().toLocaleTimeString("pt-BR"));
  }, [verificandoAcesso]);

  useEffect(() => {
    if (verificandoAcesso) {
      return;
    }

    let cancelado = false;

    async function verificarAdmin() {
      try {
        const { data: sessaoResposta } = await supabase.auth.getSession();
        const user = sessaoResposta.session?.user || null;

        if (!user) {
          if (!cancelado) {
            setAdminLiberado(false);
          }

          return;
        }

        const { data, error } = await supabase.rpc("usuario_e_admin");

        if (!cancelado) {
          setAdminLiberado(!error && data === true);
        }
      } catch {
        if (!cancelado) {
          setAdminLiberado(false);
        }
      }
    }

    verificarAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      verificarAdmin();
    });

    return () => {
      cancelado = true;
      subscription.unsubscribe();
    };
  }, [verificandoAcesso]);

  function atualizarPreferencia<K extends keyof PreferenciasConta>(
    campo: K,
    valor: PreferenciasConta[K]
  ) {
    setPreferencias((preferenciasAtuais) => ({
      ...preferenciasAtuais,
      [campo]: valor,
    }));
  }

  function atualizarTemaVisual(temaVisual: TemaVisual) {
    setPreferencias((preferenciasAtuais) => ({
      ...preferenciasAtuais,
      temaVisual,
    }));

    salvarTemaVisual(temaVisual);
    aplicarTemaVisual(temaVisual);
  }

  function salvar() {
    salvarPreferencias(preferencias);
    setMensagem("Configurações salvas.");

    window.setTimeout(() => {
      setMensagem("");
    }, 2200);
  }

  async function copiarBackup() {
    try {
      await copiarTexto(criarBackupLocal());
      setMensagem("Dados copiados para a área de transferência.");
    } catch {
      setMensagem("Não consegui copiar os dados agora.");
    }

    window.setTimeout(() => {
      setMensagem("");
    }, 2600);
  }

  function baixarBackup() {
    try {
      const backup = criarBackupLocal();
      const dataAtual = new Date().toISOString().slice(0, 10);
      const arquivo = new Blob([backup], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(arquivo);
      const link = document.createElement("a");

      link.href = url;
      link.download = `historietas-backup-${dataAtual}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMensagem("Backup baixado.");
    } catch {
      setMensagem("Não consegui baixar o backup agora.");
    }

    window.setTimeout(() => {
      setMensagem("");
    }, 2200);
  }

  function atualizarResumo() {
    setResumo(criarResumoLocal());
    setResumoAtualizadoEm(new Date().toLocaleTimeString("pt-BR"));
    setMensagem("Resumo atualizado.");

    window.setTimeout(() => {
      setMensagem("");
    }, 1600);
  }

  async function sairDaConta() {
    setMensagem("Saindo da conta...");

    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  if (verificandoAcesso) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${configuracoesPageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <div style={emptyAccessBoxStyle}>
            <h1 style={emptyAccessTitleStyle}>Verificando acesso...</h1>
            <p style={emptyAccessTextStyle}>Aguarde enquanto confirmo sua conta.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${configuracoesPageCss}`}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTitleHeaderStyle : titleHeaderStyle}>
          <Link
            href="/"
            style={isDesktop ? desktopTitleHomeLinkStyle : titleHomeLinkStyle}
            aria-label="Voltar para a Home"
          >
            <span
              className="historietas-config-hero-title"
              style={isDesktop ? desktopPageTitleTextStyle : pageTitleTextStyle}
            >
              CONFIGURAÇÕES
            </span>
          </Link>
        </header>

        {mensagem && <span style={messageStyle}>{mensagem}</span>}

        {adminLiberado && isDesktop && (
          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={accentSectionTitleStyle}>Moderação</h2>
            </div>

            <div style={desktopAdminAccessCardStyle}>
              <div style={adminAccessTextStyle}>
                <strong style={adminAccessTitleStyle}>Área de moderação</strong>
                <span style={adminAccessDescriptionStyle}>
                  Acesse as denúncias da Comunidade e revise conteúdos enviados
                  para análise.
                </span>
              </div>

              <Link href="/admin/comunidade" style={adminAccessLinkStyle}>
                Abrir moderação
              </Link>
            </div>
          </section>
        )}

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={accentSectionTitleStyle}>Conta</h2>
          </div>

          <div style={isDesktop ? desktopAccountCardStyle : cardStyle}>
            <label style={fieldStyle}>
              <span style={labelStyle}>Nome de exibição</span>

              <input
                value={preferencias.nomeExibicao}
                onChange={(event) =>
                  atualizarPreferencia("nomeExibicao", event.target.value)
                }
                placeholder="Ex: Nome do autor"
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>E-mail de contato</span>

              <input
                value={preferencias.emailContato}
                onChange={(event) =>
                  atualizarPreferencia("emailContato", event.target.value)
                }
                placeholder="Ex: seuemail@email.com"
                style={inputStyle}
                type="email"
              />
            </label>

          </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={accentSectionTitleStyle}>Resumo da conta</h2>
          </div>

          <div className="configuracoes-carousel" style={isDesktop ? desktopStatsGridStyle : statsGridStyle}>
            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{resumo.obras}</strong>
              <span style={statLabelStyle}>obras criadas</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{resumo.notificacoes}</strong>
              <span style={statLabelStyle}>notificações</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{resumo.lancamentos}</strong>
              <span style={statLabelStyle}>avisos ativos</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{resumo.favoritas}</strong>
              <span style={statLabelStyle}>na lista</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>{resumo.concluidas}</strong>
              <span style={statLabelStyle}>concluídas</span>
            </div>

            <div style={statCardStyle}>
              <strong style={statNumberStyle}>
                {resumo.seguindoObras + resumo.seguindoAutores}
              </strong>
              <span style={statLabelStyle}>seguindo</span>
            </div>
          </div>

          <p style={lastUpdateStyle}>
            Resumo atualizado às {resumoAtualizadoEm || "--:--"}.
          </p>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={accentSectionTitleStyle}>Ações</h2>
          </div>

          <div className="configuracoes-carousel" style={isDesktop ? desktopActionsStyle : actionsStyle}>
            <button type="button" onClick={salvar} style={primaryButtonStyle}>
              Salvar configurações
            </button>

            <button
              type="button"
              onClick={copiarBackup}
              style={secondaryButtonStyle}
            >
              Copiar dados
            </button>

            <button
              type="button"
              onClick={baixarBackup}
              style={secondaryButtonStyle}
            >
              Baixar backup
            </button>

            <button
              type="button"
              onClick={atualizarResumo}
              style={secondaryButtonStyle}
            >
              Atualizar resumo
            </button>

            <button type="button" onClick={sairDaConta} style={dangerButtonStyle}>
              Sair da conta
            </button>
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={accentSectionTitleStyle}>Tema visual</h2>
          </div>

          <div className="configuracoes-carousel" style={isDesktop ? desktopThemeGridStyle : themeGridStyle}>
            {ORDEM_TEMAS_VISUAIS.map((temaVisual) => {
              const tema = TEMAS_VISUAIS[temaVisual];
              const temaAtivo = preferencias.temaVisual === temaVisual;

              return (
                <button
                  key={temaVisual}
                  type="button"
                  onClick={() => atualizarTemaVisual(temaVisual)}
                  style={
                    temaAtivo
                      ? isDesktop
                        ? desktopThemeOptionActiveStyle
                        : themeOptionActiveStyle
                      : isDesktop
                      ? desktopThemeOptionStyle
                      : themeOptionStyle
                  }
                  aria-pressed={temaAtivo}
                >
                  <span
                    style={{
                      ...themePreviewStyle,
                      background: `linear-gradient(135deg, ${tema.accent} 0%, ${tema.secondary} 100%)`,
                      boxShadow: "none",
                    }}
                  >
                    {tema.icone}
                  </span>

                  <span style={themeTextBoxStyle}>
                    <strong style={themeTitleStyle}>{tema.nome}</strong>
                  </span>

                </button>
              );
            })}
          </div>

        </section>

      </section>
    </main>
  );
}

const configuracoesPageCss = `
  html[data-historietas-tema-visual] body {
    background: var(--historietas-bg-start, #0B0614) !important;
    color: var(--historietas-text-primary, #FFFFFF) !important;
  }


  .configuracoes-carousel {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .configuracoes-carousel::-webkit-scrollbar {
    display: none;
  }

  html[data-historietas-tema-visual] nav,
  html[data-historietas-tema-visual] [data-bottom-nav],
  html[data-historietas-tema-visual] [data-mobile-nav],
  html[data-historietas-tema-visual] nav:has(a[href="/publicar"]),
  html[data-historietas-tema-visual] div:has(> a[href="/publicar"]):has(> a[href="/biblioteca"]) {
    background: var(--historietas-bottom-nav-bg, var(--historietas-surface-strong, rgba(18,8,31,0.98))) !important;
    border-color: var(--historietas-bottom-nav-border, var(--historietas-border-soft, rgba(255,255,255,0.12))) !important;
    box-shadow: var(--historietas-bottom-nav-shadow, none) !important;
    color: var(--historietas-bottom-nav-text, var(--historietas-text-secondary, #D4D4D8)) !important;
  }

  html[data-historietas-tema-visual] nav::before,
  html[data-historietas-tema-visual] [data-bottom-nav]::before,
  html[data-historietas-tema-visual] [data-mobile-nav]::before {
    background: var(--historietas-bottom-nav-shine, none) !important;
  }

  html[data-historietas-tema-visual] nav a,
  html[data-historietas-tema-visual] [data-bottom-nav] a,
  html[data-historietas-tema-visual] [data-mobile-nav] a,
  html[data-historietas-tema-visual] nav button,
  html[data-historietas-tema-visual] [data-bottom-nav] button,
  html[data-historietas-tema-visual] [data-mobile-nav] button {
    color: var(--historietas-bottom-nav-text, var(--historietas-text-secondary, #D4D4D8)) !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual] nav a:hover,
  html[data-historietas-tema-visual] [data-bottom-nav] a:hover,
  html[data-historietas-tema-visual] [data-mobile-nav] a:hover,
  html[data-historietas-tema-visual] nav button:hover,
  html[data-historietas-tema-visual] [data-bottom-nav] button:hover,
  html[data-historietas-tema-visual] [data-mobile-nav] button:hover {
    background: var(--historietas-bottom-nav-hover-bg, var(--historietas-active-surface, rgba(255,255,255,0.055))) !important;
    border-color: var(--historietas-bottom-nav-border, var(--historietas-border-soft, rgba(255,255,255,0.10))) !important;
    color: var(--historietas-bottom-nav-hover-text, var(--historietas-text-primary, #FFFFFF)) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/configuracoes"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/configuracoes"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/configuracoes"] {
    background: var(--historietas-bottom-nav-hover-bg, var(--historietas-active-surface, rgba(249,115,22,0.16))) !important;
    border-color: color-mix(in srgb, var(--historietas-accent, #F97316) 32%, transparent) !important;
    color: var(--historietas-accent, #F97316) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/publicar"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"] {
    background: var(--historietas-bottom-nav-main-bg, linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)) !important;
    border-color: var(--historietas-bottom-nav-main-border, color-mix(in srgb, var(--historietas-accent, #F97316) 55%, transparent)) !important;
    box-shadow: var(--historietas-bottom-nav-main-shadow, none) !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] nav .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-icon {
    color: var(--historietas-bottom-nav-icon-text, var(--historietas-accent, #F97316)) !important;
    background: var(--historietas-bottom-nav-icon-bg, var(--historietas-surface, rgba(255,255,255,0.045))) !important;
    border-color: var(--historietas-bottom-nav-icon-border, var(--historietas-border-soft, rgba(255,255,255,0.055))) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/publicar"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"] .historietas-bottom-nav-icon {
    color: #FFFFFF !important;
    background: var(--historietas-bottom-nav-main-icon-bg, rgba(255,255,255,0.16)) !important;
    border-color: var(--historietas-bottom-nav-main-icon-border, rgba(255,255,255,0.18)) !important;
  }

  html[data-historietas-tema-visual="branco"] .historietas-config-logo-text,
  html[data-historietas-tema-visual="branco"] .historietas-config-hero-title {
    background: none !important;
    color: #1A73E8 !important;
    -webkit-text-fill-color: #1A73E8 !important;
    text-shadow: none !important;
  }

  html[data-historietas-tema-visual="branco"] input,
  html[data-historietas-tema-visual="branco"] textarea,
  html[data-historietas-tema-visual="branco"] select {
    color: #202124 !important;
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
`;

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(520px, 72vh)",
  pointerEvents: "none",
  zIndex: 0,
  background:
    "linear-gradient(180deg, var(--historietas-bg-start, rgba(10,6,18,0.98)) 0%, var(--historietas-bg-mid, rgba(14,7,25,0.94)) 42%, transparent 100%), radial-gradient(ellipse 72% 82% at 18% 44%, var(--historietas-glow-primary, rgba(124,58,237,0.24)) 0%, transparent 76%), radial-gradient(ellipse 48% 62% at 88% 32%, var(--historietas-glow-secondary, rgba(249,115,22,0.10)) 0%, transparent 78%)",
  WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 76%, transparent 100%)",
  maskImage: "linear-gradient(180deg, #000 0%, #000 76%, transparent 100%)",
};

const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background:
    "linear-gradient(180deg, var(--historietas-bg-start, rgba(10,6,18,0.98)) 0%, var(--historietas-bg-mid, rgba(14,7,25,0.96)) 34%, transparent 100%), radial-gradient(ellipse 62% 86% at 19% 52%, var(--historietas-glow-primary, rgba(124,58,237,0.32)) 0%, transparent 76%), radial-gradient(ellipse 38% 62% at 91% 54%, var(--historietas-glow-secondary, rgba(249,115,22,0.10)) 0%, transparent 76%)",
  WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 78%, transparent 100%)",
  maskImage: "linear-gradient(180deg, #000 0%, #000 78%, transparent 100%)",
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background:
    "radial-gradient(circle at 12% 0%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)), transparent 28%), radial-gradient(circle at 88% 14%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)), transparent 22%), radial-gradient(circle at 50% 100%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)), transparent 30%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 38%, var(--historietas-bg-end, #17101B) 100%)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(900px, calc(100% - 32px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "14px 0 0",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "10px",
  marginBottom: "10px",
  padding: "6px 0",
  minWidth: 0,
};

const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "24px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
};

const logoMarkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #F5F3FF) 0%, var(--historietas-title-mid, #C4B5FD) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "var(--historietas-logo-shadow, 0 0 26px rgba(139, 92, 246, 0.24))",
  overflow: "visible",
  whiteSpace: "nowrap",
};


const titleHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  flexWrap: "nowrap",
  width: "100%",
  margin: "0 auto 14px",
  padding: 0,
  minWidth: 0,
  textAlign: "center",
};

const titleHomeLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "23px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  width: "fit-content",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  flex: "0 1 auto",
  ...safeTextStyle,
};

const pageTitleTextStyle: CSSProperties = {
  display: "inline-block",
  margin: 0,
  marginLeft: 0,
  paddingRight: "0.2em",
  paddingBottom: "0.04em",
  whiteSpace: "nowrap",
  overflow: "visible",
  fontSize: "23px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  wordSpacing: "0.11em",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
  textAlign: "center",
  textShadow: "none",
};

const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  marginBottom: "18px",
};

const desktopTitleHomeLinkStyle: CSSProperties = {
  ...titleHomeLinkStyle,
};

const desktopPageTitleTextStyle: CSSProperties = {
  ...pageTitleTextStyle,
};

const heroStyle: CSSProperties = {
  position: "relative",
  borderRadius: "28px",
  border: "1px solid var(--historietas-border-soft, rgba(251,191,36,0.16))",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(31,16,52,0.98)) 0%, var(--historietas-surface-strong, rgba(12,7,23,0.99)) 100%)",
  boxShadow:
    "var(--historietas-hero-shadow, 0 18px 48px rgba(0,0,0,0.32), 0 0 36px rgba(124,58,237,0.12))",
  overflow: "hidden",
  minWidth: 0,
};

const heroGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at 18% 14%, var(--historietas-glow-secondary, rgba(249,115,22,0.28)), transparent 32%), radial-gradient(circle at 82% 14%, var(--historietas-glow-primary, rgba(124,58,237,0.52)), transparent 38%)",
  pointerEvents: "none",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "20px 16px",
  display: "grid",
  justifyItems: "center",
  gap: "10px",
  minWidth: 0,
  textAlign: "center",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(36px, 9.4vw, 60px)",
  lineHeight: 1.1,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  maxWidth: "100%",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 48%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: "0 auto",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.58,
  fontWeight: 650,
  maxWidth: "620px",
  ...safeTextStyle,
};

const heroActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
  margin: "4px auto 0",
  width: "min(420px, 100%)",
  minWidth: 0,
};

const primaryLinkStyle: CSSProperties = {
  minHeight: "44px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 12px",
  boxShadow: "none",
  ...safeTextStyle,
};

const secondaryLinkStyle: CSSProperties = {
  ...primaryLinkStyle,
  background: "var(--historietas-secondary-surface, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, transparent))",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 40%, transparent)",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  boxShadow: "none",
};

const desktopAdminAccessCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 180px",
  alignItems: "center",
  gap: "16px",
  padding: "18px",
  borderRadius: "26px",
  background:
    "linear-gradient(135deg, var(--historietas-active-surface, rgba(124,58,237,0.18)) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.98)) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, var(--historietas-border-soft, rgba(255,255,255,0.08)))",
  boxShadow: "var(--historietas-card-shadow, none)",
  minWidth: 0,
};

const adminAccessTextStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  minWidth: 0,
};

const adminAccessTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "18px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

const adminAccessDescriptionStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  lineHeight: 1.45,
  fontWeight: 750,
  ...safeTextStyle,
};

const adminAccessLinkStyle: CSSProperties = {
  ...primaryLinkStyle,
  minHeight: "42px",
};

const messageStyle: CSSProperties = {
  display: "block",
  marginTop: "12px",
  padding: "9px 12px",
  borderRadius: "16px",
  background:
    "linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(18,12,30,0.92) 100%)",
  border: "1px solid rgba(34, 197, 94, 0.24)",
  color: "#86EFAC",
  fontSize: "12px",
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

const emptyAccessBoxStyle: CSSProperties = {
  marginTop: "24px",
  borderRadius: "26px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(33,24,50,0.92)) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.98)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  padding: "22px",
  display: "grid",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  textAlign: "center",
};

const emptyAccessTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "28px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

const emptyAccessTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.55,
  fontWeight: 750,
  ...safeTextStyle,
};

const sectionStyle: CSSProperties = {
  marginTop: "20px",
  minWidth: 0,
};

const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  marginBottom: "10px",
  minWidth: 0,
  textAlign: "center",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "clamp(24px, 7vw, 34px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.06em",
  textAlign: "center",
  ...safeTextStyle,
};

const accentSectionTitleStyle: CSSProperties = {
  ...sectionTitleStyle,
  color: "var(--historietas-accent, #FDBA74)",
};

const cardStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: "14px",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(33,24,50,0.92)) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.98)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  boxShadow: "var(--historietas-card-shadow, 0 14px 36px rgba(0,0,0,0.20))",
  minWidth: 0,
  overflow: "hidden",
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
  textAlign: "center",
};

const labelStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  fontWeight: 950,
  textAlign: "center",
  textTransform: "uppercase",
  letterSpacing: "0.035em",
  ...safeTextStyle,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "44px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  background: "var(--historietas-input-bg, #18181B)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 14px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 750,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
};

const settingsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

const themeGridStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  minWidth: 0,
  width: "calc(100% + 32px)",
  maxWidth: "calc(100% + 32px)",
  margin: "0 -16px",
  overflowX: "auto",
  overflowY: "hidden",
  padding: "0 16px",
  boxSizing: "border-box",
  scrollSnapType: "x proximity",
  scrollPaddingLeft: "16px",
  scrollPaddingRight: "16px",
};

const themeOptionStyle: CSSProperties = {
  position: "relative",
  flex: "0 0 88px",
  width: "88px",
  minHeight: "74px",
  borderRadius: "16px",
  padding: "7px 4px",
  scrollSnapAlign: "start",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-surface, rgba(18,12,30,0.82))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  justifyItems: "center",
  alignContent: "center",
  gap: "6px",
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxShadow: "none",
  minWidth: 0,
  overflow: "hidden",
};

const themeOptionActiveStyle: CSSProperties = {
  ...themeOptionStyle,
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 46%, transparent)",
  background:
    "linear-gradient(135deg, var(--historietas-active-surface, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 25%, rgba(18,12,30,0.92))) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.92)) 100%)",
  boxShadow: "none",
};

const themePreviewStyle: CSSProperties = {
  width: "32px",
  height: "32px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  fontSize: "16px",
  fontWeight: 950,
  flex: "0 0 auto",
};

const themeTextBoxStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "2px",
  minWidth: 0,
  width: "100%",
  textAlign: "center",
};

const themeTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  textAlign: "center",
  ...safeTextStyle,
};

const preferenceStyle: CSSProperties = {
  minHeight: "78px",
  borderRadius: "17px",
  padding: "8px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-surface, rgba(18,12,30,0.82))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  display: "grid",
  gridTemplateColumns: "40px minmax(0, 1fr)",
  alignItems: "center",
  columnGap: "9px",
  rowGap: "1px",
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxShadow: "none",
  minWidth: 0,
  overflow: "hidden",
};

const preferenceActiveStyle: CSSProperties = {
  ...preferenceStyle,
  border: "1px solid rgba(249, 115, 22, 0.30)",
  background:
    "linear-gradient(135deg, var(--historietas-active-surface, rgba(249,115,22,0.16)) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.92)) 100%)",
  boxShadow: "none",
};

const preferenceIconStyle: CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "15px",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "19px",
  gridRow: "1 / span 2",
};

const preferenceTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "15.5px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  textAlign: "center",
  alignSelf: "end",
  ...safeTextStyle,
};

const preferenceTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11.2px",
  lineHeight: 1.14,
  fontWeight: 650,
  textAlign: "center",
  alignSelf: "start",
  ...safeTextStyle,
};

const statsGridStyle: CSSProperties = {
  display: "flex",
  gap: "7px",
  minWidth: 0,
  width: "calc(100% + 32px)",
  maxWidth: "calc(100% + 32px)",
  margin: "0 -16px",
  overflowX: "auto",
  overflowY: "hidden",
  padding: "0 16px",
  boxSizing: "border-box",
  scrollSnapType: "x proximity",
  scrollPaddingLeft: "16px",
  scrollPaddingRight: "16px",
};

const statCardStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: "1px",
  flex: "0 0 78px",
  width: "78px",
  minHeight: "46px",
  padding: "5px 4px",
  borderRadius: "13px",
  scrollSnapAlign: "start",
  background: "var(--historietas-surface, rgba(255,255,255,0.055))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  boxShadow: "none",
  minWidth: 0,
  overflow: "hidden",
  textAlign: "center",
};

const statNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "17px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const statLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7px",
  lineHeight: 1.1,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  textAlign: "center",
  ...safeTextStyle,
};

const lastUpdateStyle: CSSProperties = {
  margin: "10px auto 0",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 750,
  textAlign: "center",
  ...safeTextStyle,
};

const actionsStyle: CSSProperties = {
  display: "flex",
  gap: "7px",
  padding: "10px 16px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(33,24,50,0.90)) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.98)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  minWidth: 0,
  width: "calc(100% + 32px)",
  maxWidth: "calc(100% + 32px)",
  margin: "0 -16px",
  overflowX: "auto",
  overflowY: "hidden",
  boxSizing: "border-box",
  scrollSnapType: "x proximity",
  scrollPaddingLeft: "16px",
  scrollPaddingRight: "16px",
};

const buttonBaseStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  padding: "0 10px",
  fontSize: "10.5px",
  flex: "0 0 132px",
  lineHeight: 1.12,
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "132px",
  boxShadow: "none",
  scrollSnapAlign: "start",
  ...safeTextStyle,
};

const primaryButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 52%, transparent)",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 74%, #FFFFFF) 100%)",
  color: "#FFFFFF",
  boxShadow: "none",
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 36%, rgba(255,255,255,0.08))",
  background: "var(--historietas-secondary-surface, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, rgba(255,255,255,0.035)))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  boxShadow: "none",
};

const dangerButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  border: "1px solid rgba(239, 68, 68, 0.26)",
  background: "var(--historietas-danger-surface, rgba(239, 68, 68, 0.105))",
  color: "var(--historietas-danger-button-text, #FCA5A5)",
  boxShadow: "none",
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 56px))",
  padding: "18px 0 8px",
};

const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "32px",
  boxShadow:
    "var(--historietas-hero-shadow, 0 24px 62px rgba(0,0,0,0.34), 0 0 42px var(--historietas-glow-primary, rgba(124,58,237,0.14)))",
};

const desktopHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  padding: "34px 42px",
  gap: "14px",
  maxWidth: "900px",
  margin: "0 auto",
  textAlign: "center",
  justifyItems: "center",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  fontSize: "clamp(52px, 5vw, 68px)",
  lineHeight: 1.08,
  maxWidth: "820px",
};

const desktopHeroActionsStyle: CSSProperties = {
  ...heroActionsStyle,
  gridTemplateColumns: "repeat(2, minmax(190px, 240px))",
  justifyContent: "center",
  maxWidth: "520px",
};

const desktopAccountCardStyle: CSSProperties = {
  ...cardStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
  padding: "18px",
};

const desktopThemeGridStyle: CSSProperties = {
  ...themeGridStyle,
  gap: "10px",
  width: "100%",
  maxWidth: "100%",
  margin: 0,
  padding: "0 1px 0",
  scrollPaddingLeft: "0px",
  scrollPaddingRight: "0px",
};

const desktopThemeOptionStyle: CSSProperties = {
  ...themeOptionStyle,
  flex: "0 0 98px",
  width: "98px",
  minHeight: "82px",
  padding: "8px 6px",
};

const desktopThemeOptionActiveStyle: CSSProperties = {
  ...themeOptionActiveStyle,
  flex: "0 0 98px",
  width: "98px",
  minHeight: "82px",
  padding: "8px 6px",
};

const desktopSettingsGridStyle: CSSProperties = {
  ...settingsGridStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "12px",
};

const desktopPreferenceStyle: CSSProperties = {
  ...preferenceStyle,
  minHeight: "84px",
  padding: "10px",
};

const desktopPreferenceActiveStyle: CSSProperties = {
  ...preferenceActiveStyle,
  minHeight: "84px",
  padding: "10px",
};

const desktopStatsGridStyle: CSSProperties = {
  ...statsGridStyle,
  gap: "8px",
  width: "100%",
  maxWidth: "100%",
  margin: 0,
  padding: "0 1px 0",
  scrollPaddingLeft: "0px",
  scrollPaddingRight: "0px",
};

const desktopActionsStyle: CSSProperties = {
  ...actionsStyle,
  gap: "8px",
  padding: "11px",
  borderRadius: "24px",
  width: "100%",
  maxWidth: "100%",
  margin: 0,
  scrollPaddingLeft: "0px",
  scrollPaddingRight: "0px",
};