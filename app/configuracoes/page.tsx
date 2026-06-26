"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { useNotificacoes } from "../../components/NotificacoesProvider";

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

function criarStorageKeyUsuarioConfiguracoes(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : chave;
}

function lerStorageUsuarioConfiguracoes(chave: string, userId = "") {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(
      criarStorageKeyUsuarioConfiguracoes(chave, userId)
    );
  } catch {
    return null;
  }
}

function salvarJsonStorageUsuarioConfiguracoes(
  chave: string,
  userId: string,
  valor: unknown
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      criarStorageKeyUsuarioConfiguracoes(chave, userId),
      JSON.stringify(valor)
    );
  } catch {
    // localStorage é fallback; as configurações continuam em memória.
  }
}

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
    bgStart: "#070212",
    bgMid: "#070212",
    bgEnd: "#070212",
    glowPrimary: "transparent",
    glowSecondary: "transparent",
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

function carregarTemaVisualSalvo(userId = "") {
  try {
    const texto = lerStorageUsuarioConfiguracoes(THEME_STORAGE_KEY, userId);

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

function dispararEventoTemaVisualAtualizado() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event("historietas:tema-visual-atualizado"));
}

function salvarTemaVisual(temaVisual: TemaVisual, userId = "") {
  salvarJsonStorageUsuarioConfiguracoes(THEME_STORAGE_KEY, userId, temaVisual);
  dispararEventoTemaVisualAtualizado();
}

function aplicarTemaVisual(temaVisual: TemaVisual) {
  if (typeof document === "undefined") {
    return;
  }

  const tema = TEMAS_VISUAIS[temaVisual];
  const raiz = document.documentElement;
  const isBranco = temaVisual === "branco";

  raiz.style.setProperty("--historietas-accent", tema.accent);
  raiz.style.setProperty("--historietas-secondary", tema.secondary);
  raiz.style.setProperty("--historietas-bg-start", tema.bgStart);
  raiz.style.setProperty("--historietas-bg-mid", tema.bgMid);
  raiz.style.setProperty("--historietas-bg-end", tema.bgEnd);
  raiz.style.setProperty("--historietas-glow-primary", tema.glowPrimary);
  raiz.style.setProperty("--historietas-glow-secondary", tema.glowSecondary);
  raiz.style.setProperty("--historietas-text-primary", tema.textPrimary || "#FFFFFF");
  raiz.style.setProperty("--historietas-text-secondary", tema.textSecondary || "#D4D4D8");
  raiz.style.setProperty("--historietas-surface", tema.surface || "rgba(4,0,10,0.72)");
  raiz.style.setProperty("--historietas-surface-strong", tema.surfaceStrong || "#04000A");
  raiz.style.setProperty("--historietas-border-soft", tema.borderSoft || "rgba(255,255,255,0.08)");
  raiz.style.setProperty("--historietas-input-bg", tema.inputBg || "#04000A");
  raiz.style.setProperty("--historietas-input-text", tema.inputText || "#FFFFFF");
  raiz.style.setProperty("--historietas-title-from", tema.titleFrom || "#FFFFFF");
  raiz.style.setProperty("--historietas-title-mid", tema.titleMid || "#F5F3FF");
  raiz.style.setProperty("--historietas-title-to", tema.titleTo || "#FDBA74");
  raiz.style.setProperty("--historietas-hero-shadow", tema.heroShadow || "none");
  raiz.style.setProperty("--historietas-card-shadow", tema.cardShadow || "none");
  raiz.style.setProperty("--historietas-logo-shadow", tema.logoShadow || "none");
  raiz.style.setProperty("--historietas-active-surface", tema.activeSurface || "rgba(59,7,100,0.54)");
  raiz.style.setProperty("--historietas-secondary-surface", tema.secondarySurface || "rgba(255,255,255,0.06)");
  raiz.style.setProperty("--historietas-secondary-button-text", tema.secondaryButtonText || "#DDD6FE");
  raiz.style.setProperty("--historietas-danger-surface", tema.dangerSurface || "rgba(239,68,68,0.10)");
  raiz.style.setProperty("--historietas-danger-button-text", tema.dangerButtonText || "#FCA5A5");

  raiz.style.setProperty("--historietas-bottom-nav-bg", isBranco ? "#FFFFFF" : "#04000A");
  raiz.style.setProperty("--historietas-bottom-nav-border", isBranco ? "#DADCE0" : "rgba(59,7,100,0.52)");
  raiz.style.setProperty("--historietas-bottom-nav-shadow", "none");
  raiz.style.setProperty("--historietas-bottom-nav-text", isBranco ? "#5F6368" : "#9980D8");
  raiz.style.setProperty("--historietas-bottom-nav-hover-bg", isBranco ? "#F1F3F4" : "rgba(59,7,100,0.20)");
  raiz.style.setProperty("--historietas-bottom-nav-hover-text", isBranco ? "#202124" : "#FFFFFF");
  raiz.style.setProperty("--historietas-bottom-nav-icon-text", isBranco ? tema.accent : "#AD95EA");
  raiz.style.setProperty("--historietas-bottom-nav-icon-bg", isBranco ? "#F1F3F4" : "rgba(59,7,100,0.28)");
  raiz.style.setProperty("--historietas-bottom-nav-icon-border", isBranco ? "#E0E3E7" : "rgba(76,29,149,0.34)");
  raiz.style.setProperty("--historietas-bottom-nav-main-bg", isBranco ? tema.accent : "#08030F");
  raiz.style.setProperty("--historietas-bottom-nav-main-border", isBranco ? tema.accent : "rgba(255,255,255,0.10)");
  raiz.style.setProperty("--historietas-bottom-nav-main-shadow", "none");
  raiz.style.setProperty("--historietas-bottom-nav-main-icon-bg", isBranco ? "rgba(255,255,255,0.16)" : "#04000A");
  raiz.style.setProperty("--historietas-bottom-nav-main-icon-border", isBranco ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.10)");
  raiz.style.setProperty("--historietas-bottom-nav-shine", "none");

  raiz.dataset.historietasTemaVisual = temaVisual;
  document.body.dataset.historietasTemaVisual = temaVisual;
}

function carregarJsonArray(chave: string, userId = "") {
  try {
    const texto = lerStorageUsuarioConfiguracoes(chave, userId);
    const json: unknown = texto ? JSON.parse(texto) : [];

    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

function contarItens(chave: string, userId = "") {
  return carregarJsonArray(chave, userId).length;
}

function criarResumoLocal(userId = ""): ResumoLocal {
  return {
    obras: contarItens("historietas-obras", userId),
    notificacoes: contarItens("historietas-notificacoes", userId),
    lancamentos: contarItens("historietas-lancamentos-salvos", userId),
    favoritas: contarItens("historietas-obras-favoritas", userId),
    concluidas: contarItens("historietas-obras-concluidas", userId),
    seguindoObras: contarItens("historietas-obras-seguidas", userId),
    seguindoAutores: contarItens("historietas-autores-seguidos", userId),
  };
}

function carregarPreferencias(userId = ""): PreferenciasConta {
  try {
    const texto = lerStorageUsuarioConfiguracoes(CONFIG_STORAGE_KEY, userId);
    const json: unknown = texto ? JSON.parse(texto) : null;

    if (!json || typeof json !== "object") {
      return {
        ...preferenciasPadrao,
        temaVisual: carregarTemaVisualSalvo(userId),
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
        preferencias.temaVisual || carregarTemaVisualSalvo(userId)
      ),
    };
  } catch {
    return {
      ...preferenciasPadrao,
      temaVisual: carregarTemaVisualSalvo(userId),
    };
  }
}

function salvarPreferencias(preferencias: PreferenciasConta, userId = "") {
  salvarJsonStorageUsuarioConfiguracoes(CONFIG_STORAGE_KEY, userId, preferencias);
  salvarTemaVisual(preferencias.temaVisual, userId);
  aplicarTemaVisual(preferencias.temaVisual);
  dispararEventoTemaVisualAtualizado();
}

function criarBackupLocal(userId = "") {
  const backup: Record<string, unknown> = {};

  CHAVES_RESUMO.forEach((chave) => {
    try {
      const valor = lerStorageUsuarioConfiguracoes(chave, userId);
      backup[chave] = valor ? JSON.parse(valor) : null;
    } catch {
      backup[chave] = null;
    }
  });

  backup[CONFIG_STORAGE_KEY] = carregarPreferencias(userId);
  backup.exportadoEm = new Date().toISOString();
  backup.projeto = "Historietas";
  backup.userId = userId;

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
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [preferencias, setPreferencias] =
    useState<PreferenciasConta>(preferenciasPadrao);
  const [resumo, setResumo] = useState<ResumoLocal>(resumoPadrao);
  const [mensagem, setMensagem] = useState("");
  const [resumoAtualizadoEm, setResumoAtualizadoEm] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const [adminLiberado, setAdminLiberado] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { notificacoesNaoLidas } = useNotificacoes();

  useEffect(() => {
    let cancelado = false;

    async function verificarAcesso() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (cancelado) {
          return;
        }

        if (error || !data.user) {
          setUsuarioIdLogado("");
          router.replace(criarLoginHrefConfiguracoes());
          return;
        }

        setUsuarioIdLogado(data.user.id);
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

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", atualizarModoDesktop);

      return () => {
        mediaQuery.removeEventListener("change", atualizarModoDesktop);
      };
    }

    mediaQuery.addListener(atualizarModoDesktop);

    return () => {
      mediaQuery.removeListener(atualizarModoDesktop);
    };
  }, []);

  useEffect(() => {
    if (verificandoAcesso) {
      return;
    }

    const carregarPreferenciasTimer = window.setTimeout(() => {
      const preferenciasCarregadas = carregarPreferencias(usuarioIdLogado);

      setPreferencias(preferenciasCarregadas);
      aplicarTemaVisual(preferenciasCarregadas.temaVisual);
      setResumo(criarResumoLocal(usuarioIdLogado));
      setResumoAtualizadoEm(new Date().toLocaleTimeString("pt-BR"));
    }, 0);

    return () => {
      window.clearTimeout(carregarPreferenciasTimer);
    };
  }, [verificandoAcesso, usuarioIdLogado]);

  useEffect(() => {
    if (verificandoAcesso) {
      return;
    }

    let cancelado = false;

    async function verificarAdmin() {
      try {
        const { data, error: userError } = await supabase.auth.getUser();
        const user = data.user || null;

        if (!user || userError) {
          if (!cancelado) {
            setAdminLiberado(false);
          }

          return;
        }

        const { data: adminLiberadoResposta, error } = await supabase.rpc(
          "usuario_e_admin"
        );

        if (!cancelado) {
          setAdminLiberado(!error && adminLiberadoResposta === true);
        }
      } catch {
        if (!cancelado) {
          setAdminLiberado(false);
        }
      }
    }

    void verificarAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setAdminLiberado(false);
        return;
      }

      void verificarAdmin();
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

    salvarTemaVisual(temaVisual, usuarioIdLogado);
    aplicarTemaVisual(temaVisual);
  }

  function salvar() {
    salvarPreferencias(preferencias, usuarioIdLogado);
    setMensagem("Configurações salvas.");

    window.setTimeout(() => {
      setMensagem("");
    }, 2200);
  }

  async function copiarBackup() {
    try {
      await copiarTexto(criarBackupLocal(usuarioIdLogado));
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
      const backup = criarBackupLocal(usuarioIdLogado);
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
    setResumo(criarResumoLocal(usuarioIdLogado));
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
          {isDesktop ? (
            <Link
              href="/notificacoes"
              style={desktopNotificationButtonStyle}
              aria-label={
                notificacoesNaoLidas > 0
                  ? `Notificações: ${notificacoesNaoLidas} não lidas`
                  : "Notificações"
              }
            >
              N

              {notificacoesNaoLidas > 0 ? (
                <span style={desktopNotificationBadgeStyle}>
                  {notificacoesNaoLidas > 99
                    ? "99+"
                    : notificacoesNaoLidas}
                </span>
              ) : null}
            </Link>
          ) : null}
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
  html[data-historietas-tema-visual] body,
  html[data-historietas-tema-visual] main,
  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #070212 !important;
    color: var(--historietas-text-primary, #FFFFFF) !important;
  }

  html[data-historietas-tema-visual] main > div[aria-hidden="true"],
  html[data-historietas-tema-visual="original"] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
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
  html[data-historietas-tema-visual] [data-mobile-nav] {
    background: var(--historietas-bottom-nav-bg, #04000A) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/configuracoes"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/configuracoes"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/configuracoes"] {
    background: var(--historietas-bottom-nav-active-bg, rgba(59, 7, 100, 0.54)) !important;
    border-color: var(--historietas-bottom-nav-active-border, rgba(109, 40, 217, 0.48)) !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] nav a[href="/configuracoes"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/configuracoes"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/configuracoes"] .historietas-bottom-nav-icon {
    color: #FFFFFF !important;
    background: var(--historietas-bottom-nav-active-icon-bg, #3B0764) !important;
    border-color: var(--historietas-bottom-nav-active-icon-border, rgba(167, 139, 250, 0.46)) !important;
  }

  html[data-historietas-tema-visual] input::placeholder,
  html[data-historietas-tema-visual] textarea::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  html[data-historietas-tema-visual] input,
  html[data-historietas-tema-visual] textarea,
  html[data-historietas-tema-visual] select {
    color: #FFFFFF !important;
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
  height: "min(340px, 48vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  WebkitMaskImage: "none",
  maskImage: "none",
  opacity: 0,
};

const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  WebkitMaskImage: "none",
  maskImage: "none",
  opacity: 0,
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "#070212",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
  isolation: "isolate",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(900px, calc(100% - 32px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "14px 0 22px",
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
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #DDD6FE 44%, #A78BFA 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "none",
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
  background: "none",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textAlign: "center",
  textShadow: "none",
};

const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  position: "relative",
  marginBottom: "18px",
};

const desktopNotificationButtonStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  right: 0,
  transform: "translateY(-50%)",
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-surface-strong, #04000A)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 950,
  boxShadow: "none",
  zIndex: 2,
};

const desktopNotificationBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "-7px",
  right: "-9px",
  minWidth: "18px",
  height: "18px",
  padding: "0 4px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid var(--historietas-bg-start, #070212)",
  background: "#EF4444",
  color: "#FFFFFF",
  fontSize: "9px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.38)",
  pointerEvents: "none",
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
  border: "1px solid rgba(255,255,255,0.06)",
  background: "linear-gradient(135deg, #070212 0%, #04000A 58%, #020006 100%)",
  boxShadow: "none",
  overflow: "hidden",
  minWidth: 0,
};

const heroGlowStyle: CSSProperties = {
  display: "none",
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
  fontSize: "clamp(34px, 8.8vw, 54px)",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.07em",
  maxWidth: "100%",
  color: "#FFFFFF",
  background: "none",
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
  textAlign: "center",
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
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
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
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  boxShadow: "none",
};

const desktopAdminAccessCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 180px",
  alignItems: "center",
  gap: "16px",
  padding: "18px",
  borderRadius: "26px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
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
  minHeight: "38px",
  borderRadius: "999px",
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  fontSize: "12px",
  fontWeight: 950,
  boxShadow: "none",
  ...safeTextStyle,
};

const messageStyle: CSSProperties = {
  margin: "10px auto 0",
  width: "fit-content",
  maxWidth: "100%",
  padding: "8px 10px",
  borderRadius: "999px",
  background: "rgba(34,197,94,0.12)",
  border: "1px solid rgba(34,197,94,0.24)",
  color: "#86EFAC",
  fontSize: "11px",
  fontWeight: 900,
  textAlign: "center",
  ...safeTextStyle,
};

const emptyAccessBoxStyle: CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: "10px",
  padding: "24px",
  background: "#070212",
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
  marginTop: "14px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  marginBottom: "10px",
  textAlign: "center",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "clamp(24px, 5vw, 30px)",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

const accentSectionTitleStyle: CSSProperties = {
  ...sectionTitleStyle,
  color: "#FFFFFF",
};

const cardStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: "14px",
  borderRadius: "22px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
};

const labelStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  textAlign: "center",
  ...safeTextStyle,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#04000A",
  color: "#FFFFFF",
  padding: "0 14px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 800,
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  minWidth: 0,
  boxShadow: "none",
};

const settingsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
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
  flex: "0 0 86px",
  width: "86px",
  minHeight: "78px",
  padding: "8px 6px",
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(4, 0, 10, 0.72)",
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
  border: "1px solid rgba(249,115,22,0.34)",
  background: "rgba(8, 3, 15, 0.92)",
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
  border: "1px solid rgba(255,255,255,0.12)",
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
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(4, 0, 10, 0.72)",
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
  border: "1px solid rgba(249,115,22,0.30)",
  background: "rgba(8, 3, 15, 0.92)",
  boxShadow: "none",
};

const preferenceIconStyle: CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "15px",
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
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
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  minWidth: 0,
  overflow: "hidden",
  textAlign: "center",
};

const statNumberStyle: CSSProperties = {
  color: "#FFFFFF",
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
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
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
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#08030F",
  color: "#FFFFFF",
  boxShadow: "none",
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
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
  padding: "18px 0 28px",
};

const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "32px",
  boxShadow: "none",
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