"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { supabase } from "../../lib/supabase/client";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
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
  username: string;
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

type UsuarioConfiguracoes = {
  id: string;
  nome: string;
  username: string;
  email: string;
};

type IconName =
  | "user"
  | "mail"
  | "lock"
  | "shield"
  | "bell"
  | "book"
  | "bookmark"
  | "clock"
  | "star"
  | "trophy"
  | "palette"
  | "moon"
  | "download"
  | "copy"
  | "database"
  | "help"
  | "file"
  | "logout"
  | "admin"
  | "chart"
  | "pen"
  | "comment"
  | "settings"
  | "search"
  | "arrowLeft"
  | "chevronRight"
  | "check"
  | "layers"
  | "spark";

const CONFIG_STORAGE_KEY = "historietas-configuracoes-conta";
const THEME_STORAGE_KEY = "historietas-tema-visual";

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
  username: "",
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

const TEMAS_VISUAIS: Record<
  TemaVisual,
  {
    nome: string;
    descricao: string;
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
    activeSurface?: string;
    secondarySurface?: string;
    secondaryButtonText?: string;
    dangerSurface?: string;
    dangerButtonText?: string;
  }
> = {
  branco: {
    nome: "Branco",
    descricao: "Modo claro limpo.",
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
    activeSurface: "rgba(26,115,232,0.10)",
    secondarySurface: "rgba(1,135,95,0.10)",
    secondaryButtonText: "#188038",
    dangerSurface: "rgba(217,48,37,0.10)",
    dangerButtonText: "#B3261E",
  },
  escuro: {
    nome: "Escuro",
    descricao: "Fundo preto e leitura confortável.",
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
    activeSurface: "rgba(124,58,237,0.14)",
    secondarySurface: "rgba(124,58,237,0.12)",
    secondaryButtonText: "#FFFFFF",
    dangerSurface: "rgba(239,68,68,0.12)",
    dangerButtonText: "#FCA5A5",
  },
  foco: {
    nome: "Foco",
    descricao: "Escuro suave para concentração.",
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
    descricao: "Roxo e laranja padrão do Historietas.",
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
    descricao: "Violeta profundo e azul.",
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
    descricao: "Rosa e vinho suave.",
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
    descricao: "Vermelho sombrio.",
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
    descricao: "Laranja e vermelho intenso.",
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
    descricao: "Azul e ciano neon.",
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
    descricao: "Roxo dramático.",
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
    descricao: "Dourado e cobre.",
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
    descricao: "Azul investigativo.",
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
    descricao: "Verde ácido escuro.",
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
    descricao: "Verde espectral.",
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
    descricao: "Marrom antigo e cobre.",
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
    descricao: "Azul aço e grafite.",
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
    descricao: "Amarelo e coral.",
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
    descricao: "Verde arcade e azul.",
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

function criarStorageKeyUsuarioConfiguracoes(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : chave;
}

function lerStorageUsuarioConfiguracoes(chave: string, userId = "") {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(criarStorageKeyUsuarioConfiguracoes(chave, userId));
  } catch {
    return null;
  }
}

function salvarJsonStorageUsuarioConfiguracoes(
  chave: string,
  userId: string,
  valor: unknown,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      criarStorageKeyUsuarioConfiguracoes(chave, userId),
      JSON.stringify(valor),
    );
  } catch {
    // localStorage é fallback; as configurações continuam em memória.
  }
}

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
  raiz.style.setProperty("--historietas-surface", tema.surface || "rgba(255,255,255,0.055)");
  raiz.style.setProperty("--historietas-surface-strong", tema.surfaceStrong || "#0B0B0F");
  raiz.style.setProperty("--historietas-border-soft", tema.borderSoft || "rgba(255,255,255,0.10)");
  raiz.style.setProperty("--historietas-input-bg", tema.inputBg || "#101014");
  raiz.style.setProperty("--historietas-input-text", tema.inputText || "#FFFFFF");
  raiz.style.setProperty("--historietas-title-from", tema.titleFrom || "#FFFFFF");
  raiz.style.setProperty("--historietas-title-mid", tema.titleMid || "#F5F3FF");
  raiz.style.setProperty("--historietas-title-to", tema.titleTo || "#FDBA74");
  raiz.style.setProperty("--historietas-active-surface", tema.activeSurface || "rgba(124,58,237,0.18)");
  raiz.style.setProperty("--historietas-secondary-surface", tema.secondarySurface || "rgba(255,255,255,0.06)");
  raiz.style.setProperty("--historietas-secondary-button-text", tema.secondaryButtonText || "#DDD6FE");
  raiz.style.setProperty("--historietas-danger-surface", tema.dangerSurface || "rgba(239,68,68,0.12)");
  raiz.style.setProperty("--historietas-danger-button-text", tema.dangerButtonText || "#FCA5A5");

  raiz.style.setProperty("--historietas-bottom-nav-bg", isBranco ? "#FFFFFF" : "#04000A");
  raiz.style.setProperty("--historietas-bottom-nav-border", isBranco ? "#DADCE0" : "rgba(59,7,100,0.52)");
  raiz.style.setProperty("--historietas-bottom-nav-text", isBranco ? "#5F6368" : "#9980D8");
  raiz.style.setProperty("--historietas-bottom-nav-hover-bg", isBranco ? "#F1F3F4" : "rgba(59,7,100,0.20)");
  raiz.style.setProperty("--historietas-bottom-nav-hover-text", isBranco ? "#202124" : "#FFFFFF");
  raiz.style.setProperty("--historietas-bottom-nav-icon-text", isBranco ? tema.accent : "#AD95EA");
  raiz.style.setProperty("--historietas-bottom-nav-icon-bg", isBranco ? "#F1F3F4" : "rgba(59,7,100,0.28)");
  raiz.style.setProperty("--historietas-bottom-nav-icon-border", isBranco ? "#E0E3E7" : "rgba(76,29,149,0.34)");
  raiz.style.setProperty("--historietas-bottom-nav-main-bg", isBranco ? tema.accent : "#08030F");
  raiz.style.setProperty("--historietas-bottom-nav-main-border", isBranco ? tema.accent : "rgba(255,255,255,0.10)");

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
      username:
        typeof preferencias.username === "string"
          ? normalizarUsernameConfiguracoes(preferencias.username)
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
        preferencias.temaVisual || carregarTemaVisualSalvo(userId),
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

function pegarTexto(valor: unknown, fallback = "") {
  return typeof valor === "string" && valor.trim() ? valor.trim() : fallback;
}

function normalizarUsernameConfiguracoes(valor: string) {
  return valor
    .trim()
    .replace(/^@+/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._]+/g, ".")
    .replace(/[._]{2,}/g, ".")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 30);
}

function idUsuarioSupabaseValido(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

type PerfilConfiguracoesSupabase = {
  nome: string;
  username: string;
};

async function carregarPerfilConfiguracoesSupabase(
  userId: string,
): Promise<PerfilConfiguracoesSupabase | null> {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || !idUsuarioSupabaseValido(userIdLimpo)) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("nome,username")
      .eq("user_id", userIdLimpo)
      .maybeSingle();

    if (error || !data || typeof data !== "object" || Array.isArray(data)) {
      return null;
    }

    const perfil = data as Record<string, unknown>;

    return {
      nome: pegarTexto(perfil.nome),
      username: normalizarUsernameConfiguracoes(pegarTexto(perfil.username)),
    };
  } catch {
    return null;
  }
}

function traduzirErroUsernameConfiguracoes(mensagem: string) {
  const mensagemNormalizada = mensagem.toLowerCase();

  if (
    mensagemNormalizada.includes("profiles_username_unique") ||
    mensagemNormalizada.includes("duplicate") ||
    mensagemNormalizada.includes("unique")
  ) {
    return "Esse @username já está em uso.";
  }

  return "Não consegui salvar esse @username agora.";
}

async function salvarPerfilConfiguracoesSupabase({
  userId,
  nome,
  username,
}: {
  userId: string;
  nome: string;
  username: string;
}) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || !idUsuarioSupabaseValido(userIdLimpo)) {
    return { ok: false, erro: "Usuário inválido." };
  }

  const usernameLimpo = normalizarUsernameConfiguracoes(username);
  const nomeLimpo = nome.trim() || "Usuário";
  const atualizadoEm = new Date().toISOString();

  try {
    const { data: perfilExistente, error: erroBusca } = await supabase
      .from("profiles")
      .select("id,user_id")
      .eq("user_id", userIdLimpo)
      .maybeSingle();

    if (erroBusca) {
      return { ok: false, erro: erroBusca.message };
    }

    const perfilId =
      perfilExistente && typeof perfilExistente === "object"
        ? pegarTexto((perfilExistente as Record<string, unknown>).id)
        : "";

    const payload = {
      nome: nomeLimpo,
      username: usernameLimpo || null,
      atualizado_em: atualizadoEm,
    };

    if (perfilId) {
      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", perfilId);

      return {
        ok: !error,
        erro: error?.message || "",
      };
    }

    const { error } = await supabase.from("profiles").insert({
      id: userIdLimpo,
      user_id: userIdLimpo,
      avatar_url: "",
      bio: "",
      tipo: "leitor",
      criado_em: atualizadoEm,
      is_admin: false,
      sobre_bio: "",
      ...payload,
    });

    return {
      ok: !error,
      erro: error?.message || "",
    };
  } catch (error) {
    return {
      ok: false,
      erro: error instanceof Error ? error.message : "Erro inesperado.",
    };
  }
}

function obterIniciais(nome: string, email: string) {
  const base = nome.trim() || email.trim() || "Historietas";
  const partes = base
    .replace(/@.*/, "")
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length >= 2) {
    return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  }

  return (partes[0] || "H").slice(0, 2).toUpperCase();
}

function SvgIcon({
  name,
  size = 24,
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const paths: Record<IconName, ReactNode> = {
    user: (
      <>
        <path {...common} d="M20 21a8 8 0 0 0-16 0" />
        <circle {...common} cx="12" cy="7" r="4" />
      </>
    ),
    mail: (
      <>
        <rect {...common} x="3" y="5" width="18" height="14" rx="2" />
        <path {...common} d="m3 7 9 6 9-6" />
      </>
    ),
    lock: (
      <>
        <rect {...common} x="5" y="10" width="14" height="10" rx="2" />
        <path {...common} d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    shield: <path {...common} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
    bell: (
      <>
        <path {...common} d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path {...common} d="M10 21h4" />
      </>
    ),
    book: (
      <>
        <path {...common} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path {...common} d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
      </>
    ),
    bookmark: <path {...common} d="M6 3h12v18l-6-4-6 4V3Z" />,
    clock: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M12 7v5l3 3" />
      </>
    ),
    star: (
      <path
        {...common}
        d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.9-5.4 2.9 1-6-4.3-4.2 6-.9L12 3Z"
      />
    ),
    trophy: (
      <>
        <path {...common} d="M8 21h8" />
        <path {...common} d="M12 17v4" />
        <path {...common} d="M7 4h10v6a5 5 0 0 1-10 0V4Z" />
        <path {...common} d="M5 5H3v3a3 3 0 0 0 3 3h1" />
        <path {...common} d="M19 5h2v3a3 3 0 0 1-3 3h-1" />
      </>
    ),
    palette: (
      <>
        <circle {...common} cx="13.5" cy="6.5" r=".5" />
        <circle {...common} cx="17.5" cy="10.5" r=".5" />
        <circle {...common} cx="8.5" cy="7.5" r=".5" />
        <circle {...common} cx="6.5" cy="12.5" r=".5" />
        <path
          {...common}
          d="M12 3a9 9 0 0 0 0 18h1.4a2.6 2.6 0 0 0 2.2-4c-.5-.8.1-1.9 1-1.9H18a6 6 0 0 0 0-12h-6Z"
        />
      </>
    ),
    moon: <path {...common} d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
    download: (
      <>
        <path {...common} d="M12 3v12" />
        <path {...common} d="m7 10 5 5 5-5" />
        <path {...common} d="M5 21h14" />
      </>
    ),
    copy: (
      <>
        <rect {...common} x="9" y="9" width="12" height="12" rx="2" />
        <rect {...common} x="3" y="3" width="12" height="12" rx="2" />
      </>
    ),
    database: (
      <>
        <ellipse {...common} cx="12" cy="5" rx="8" ry="3" />
        <path {...common} d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
        <path {...common} d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
      </>
    ),
    help: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M9.5 9a2.7 2.7 0 0 1 5.1 1.3c0 2-2.6 2.2-2.6 4" />
        <path {...common} d="M12 18h.01" />
      </>
    ),
    file: (
      <>
        <path {...common} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path {...common} d="M14 2v6h6" />
      </>
    ),
    logout: (
      <>
        <path {...common} d="M10 17l5-5-5-5" />
        <path {...common} d="M15 12H3" />
        <path {...common} d="M21 3v18" />
      </>
    ),
    admin: (
      <>
        <path {...common} d="M12 3 3 8l9 5 9-5-9-5Z" />
        <path {...common} d="m3 13 9 5 9-5" />
      </>
    ),
    chart: (
      <>
        <path {...common} d="M4 19V5" />
        <path {...common} d="M4 19h16" />
        <path {...common} d="M8 16v-5" />
        <path {...common} d="M12 16V8" />
        <path {...common} d="M16 16v-3" />
      </>
    ),
    pen: (
      <>
        <path {...common} d="M12 20h9" />
        <path {...common} d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),
    comment: (
      <>
        <path {...common} d="M21 12a8 8 0 0 1-8 8H7l-4 3v-6a8 8 0 1 1 18-5Z" />
      </>
    ),
    settings: (
      <>
        <circle {...common} cx="12" cy="12" r="3" />
        <path
          {...common}
          d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3-.2-.1a1.7 1.7 0 0 0-2-.2 1.7 1.7 0 0 0-1 1.5V21h-3.4v-.3a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-2 .2l-.2.1-2-3 .1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.4-1H3v-4h.2a1.7 1.7 0 0 0 1.4-1 1.7 1.7 0 0 0-.3-1.9L4.2 7l2-3 .2.1a1.7 1.7 0 0 0 2 .2 1.7 1.7 0 0 0 1-1.5V2h3.4v.3a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 2-.2l.2-.1 2 3-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.4 1h.2v4h-.2a1.7 1.7 0 0 0-1.4 1Z"
        />
      </>
    ),
    search: (
      <>
        <circle {...common} cx="11" cy="11" r="7" />
        <path {...common} d="m20 20-3.5-3.5" />
      </>
    ),
    arrowLeft: (
      <>
        <path {...common} d="M19 12H5" />
        <path {...common} d="m12 19-7-7 7-7" />
      </>
    ),
    chevronRight: <path {...common} d="m9 18 6-6-6-6" />,
    check: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="m8 12 2.6 2.6L16 9" />
      </>
    ),
    layers: (
      <>
        <path {...common} d="m12 2 9 5-9 5-9-5 9-5Z" />
        <path {...common} d="m3 12 9 5 9-5" />
        <path {...common} d="m3 17 9 5 9-5" />
      </>
    ),
    spark: (
      <>
        <path {...common} d="M12 2v5" />
        <path {...common} d="M12 17v5" />
        <path {...common} d="M4.9 4.9 8.4 8.4" />
        <path {...common} d="m15.6 15.6 3.5 3.5" />
        <path {...common} d="M2 12h5" />
        <path {...common} d="M17 12h5" />
        <path {...common} d="m4.9 19.1 3.5-3.5" />
        <path {...common} d="m15.6 8.4 3.5-3.5" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}

function ValorLinha({ children, danger = false }: { children: ReactNode; danger?: boolean }) {
  return (
    <span style={danger ? rowValueDangerStyle : rowValueStyle}>
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 style={sectionTitleStyle}>{children}</h2>;
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section style={sectionStyle}>
      <SectionTitle>{title}</SectionTitle>
      <div style={listCardStyle}>{children}</div>
    </section>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  right,
  href,
  onClick,
  danger = false,
  hideChevron = false,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  hideChevron?: boolean;
}) {
  const content = (
    <>
      <span style={rowIconStyle}>
        <SvgIcon name={icon} size={23} strokeWidth={2.15} />
      </span>

      <span style={rowTextBoxStyle}>
        <span style={danger ? rowTitleDangerStyle : rowTitleStyle}>{title}</span>
        {subtitle ? <span style={rowSubtitleStyle}>{subtitle}</span> : null}
      </span>

      {right ? <span style={rowRightStyle}>{right}</span> : null}

      {!hideChevron ? (
        <span style={rowChevronStyle}>
          <SvgIcon name="chevronRight" size={22} strokeWidth={2.6} />
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} style={rowLinkStyle}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} style={rowButtonStyle}>
        {content}
      </button>
    );
  }

  return <div style={rowStaticStyle}>{content}</div>;
}

function Toggle({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-label={ariaLabel}
      aria-pressed={checked}
      style={checked ? toggleOnStyle : toggleOffStyle}
    >
      <span style={checked ? toggleKnobOnStyle : toggleKnobOffStyle} />
    </button>
  );
}

function SettingsInput({
  icon,
  label,
  value,
  placeholder,
  type = "text",
  helperText,
  error = false,
  onChange,
}: {
  icon: IconName;
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  helperText?: string;
  error?: boolean;
  onChange: (valor: string) => void;
}) {
  return (
    <label style={inputRowStyle}>
      <span style={rowIconStyle}>
        <SvgIcon name={icon} size={23} strokeWidth={2.15} />
      </span>

      <span style={inputTextBoxStyle}>
        <span style={inputLabelStyle}>{label}</span>
        <input
          className="configuracoes-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          style={inputStyle}
        />

        {helperText ? (
          <span style={error ? inputErrorStyle : inputHelperStyle}>
            {helperText}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [usuario, setUsuario] = useState<UsuarioConfiguracoes | null>(null);
  const [preferencias, setPreferencias] =
    useState<PreferenciasConta>(preferenciasPadrao);
  const [resumo, setResumo] = useState<ResumoLocal>(resumoPadrao);
  const [erroUsername, setErroUsername] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [mostrarTemas, setMostrarTemas] = useState(false);
  const [adminLiberado, setAdminLiberado] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { notificacoesNaoLidas } = useNotificacoes();

  const usuarioIdLogado = usuario?.id || "";
  const temaAtual = TEMAS_VISUAIS[preferencias.temaVisual];

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

        const perfilRemoto = await carregarPerfilConfiguracoesSupabase(data.user.id);
        const nome =
          pegarTexto(perfilRemoto?.nome) ||
          pegarTexto(data.user.user_metadata?.nome) ||
          pegarTexto(data.user.user_metadata?.name) ||
          pegarTexto(data.user.email) ||
          "Usuário";
        const username =
          perfilRemoto?.username ||
          normalizarUsernameConfiguracoes(
            pegarTexto(data.user.user_metadata?.username),
          );

        const usuarioCarregado: UsuarioConfiguracoes = {
          id: data.user.id,
          nome,
          username,
          email: data.user.email || "",
        };
        const preferenciasCarregadas = carregarPreferencias(usuarioCarregado.id);

        setUsuario(usuarioCarregado);
        setPreferencias({
          ...preferenciasCarregadas,
          nomeExibicao:
            perfilRemoto?.nome ||
            preferenciasCarregadas.nomeExibicao ||
            usuarioCarregado.nome,
          username:
            perfilRemoto?.username ||
            preferenciasCarregadas.username ||
            usuarioCarregado.username,
          emailContato:
            preferenciasCarregadas.emailContato || usuarioCarregado.email,
        });
        aplicarTemaVisual(preferenciasCarregadas.temaVisual);
        setResumo(criarResumoLocal(usuarioCarregado.id));
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
          "usuario_e_admin",
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

  const buscaNormalizada = busca.trim().toLowerCase();

  function deveMostrar(...termos: string[]) {
    if (!buscaNormalizada) {
      return true;
    }

    return termos.join(" ").toLowerCase().includes(buscaNormalizada);
  }

  const totalBiblioteca = useMemo(
    () => resumo.favoritas + resumo.concluidas + resumo.seguindoObras,
    [resumo.concluidas, resumo.favoritas, resumo.seguindoObras],
  );

  function atualizarPreferencia<K extends keyof PreferenciasConta>(
    campo: K,
    valor: PreferenciasConta[K],
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

  async function salvar() {
    if (salvando) {
      return;
    }

    const usernameLimpo = normalizarUsernameConfiguracoes(preferencias.username);

    if (preferencias.username.trim() && usernameLimpo.length < 3) {
      setErroUsername("Use pelo menos 3 caracteres no @username.");
      return;
    }

    const preferenciasNormalizadas: PreferenciasConta = {
      ...preferencias,
      nomeExibicao: preferencias.nomeExibicao.trim(),
      username: usernameLimpo,
      emailContato: preferencias.emailContato.trim(),
    };

    setSalvando(true);
    setErroUsername("");

    const resultadoPerfil = await salvarPerfilConfiguracoesSupabase({
      userId: usuarioIdLogado,
      nome: preferenciasNormalizadas.nomeExibicao || usuario?.nome || "Usuário",
      username: usernameLimpo,
    });

    if (!resultadoPerfil.ok) {
      setErroUsername(traduzirErroUsernameConfiguracoes(resultadoPerfil.erro));
      setSalvando(false);
      return;
    }

    try {
      await supabase.auth.updateUser({
        data: {
          nome: preferenciasNormalizadas.nomeExibicao || usuario?.nome || "Usuário",
          username: usernameLimpo,
        },
      });
    } catch {
      // A tabela profiles já foi atualizada; metadata do Auth é complementar.
    }

    salvarPreferencias(preferenciasNormalizadas, usuarioIdLogado);
    setPreferencias(preferenciasNormalizadas);
    setUsuario((usuarioAtual) =>
      usuarioAtual
        ? {
            ...usuarioAtual,
            nome: preferenciasNormalizadas.nomeExibicao || usuarioAtual.nome,
            username: usernameLimpo,
            email: preferenciasNormalizadas.emailContato || usuarioAtual.email,
          }
        : usuarioAtual,
    );
    setResumo(criarResumoLocal(usuarioIdLogado));
    setSalvando(false);
  }

  async function copiarBackup() {
    try {
      await copiarTexto(criarBackupLocal(usuarioIdLogado));
    } catch {
      // A ação de copiar não mostra bloco visual na página.
    }
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

    } catch {
      // A ação de baixar backup não mostra bloco visual na página.
    }
  }

  async function sairDaConta() {
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
      </main>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${configuracoesPageCss}`}</style>

      <section style={containerStyle}>
        <header style={headerStyle}>
          <button
            type="button"
            onClick={() => router.back()}
            style={backButtonStyle}
            aria-label="Voltar"
          >
            <SvgIcon name="arrowLeft" size={25} strokeWidth={2.4} />
          </button>

          <h1 style={pageTitleStyle}>Configurações e atividade</h1>
        </header>

        <label style={searchBoxStyle} htmlFor="buscar-configuracoes">
          <SvgIcon name="search" size={23} strokeWidth={2.3} />
          <input
            id="buscar-configuracoes"
            className="configuracoes-input"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Pesquisar"
            style={searchInputStyle}
          />
        </label>

        <section style={profileCardStyle}>
          <div style={avatarStyle}>
            {obterIniciais(preferencias.nomeExibicao, preferencias.emailContato)}
          </div>

          <div style={profileTextStyle}>
            <strong style={profileNameStyle}>
              {preferencias.nomeExibicao || usuario?.nome || "Conta Historietas"}
            </strong>
            <span style={profileUsernameStyle}>
              {preferencias.username ? `@${preferencias.username}` : "@username não definido"}
            </span>
            <span style={profileEmailStyle}>
              {preferencias.emailContato || usuario?.email || "E-mail não informado"}
            </span>
          </div>
        </section>


        {deveMostrar("conta", "nome", "username", "usuário", "email", "senha", "privacidade", "salvar") ? (
          <SettingsSection title="Sua conta">
            {deveMostrar("nome", "exibição", "autor") ? (
              <SettingsInput
                icon="user"
                label="Nome de exibição"
                value={preferencias.nomeExibicao}
                onChange={(valor) => atualizarPreferencia("nomeExibicao", valor)}
                placeholder="Ex: Nome do autor"
              />
            ) : null}

            {deveMostrar("username", "usuário", "perfil", "arroba") ? (
              <SettingsInput
                icon="user"
                label="@username"
                value={preferencias.username}
                onChange={(valor) => {
                  setErroUsername("");
                  atualizarPreferencia(
                    "username",
                    normalizarUsernameConfiguracoes(valor),
                  );
                }}
                placeholder="ex: username"
                helperText={
                  erroUsername ||
                  "Nome pode repetir. @username não pode repetir."
                }
                error={Boolean(erroUsername)}
              />
            ) : null}

            {deveMostrar("email", "contato") ? (
              <SettingsInput
                icon="mail"
                label="E-mail de contato"
                value={preferencias.emailContato}
                onChange={(valor) => atualizarPreferencia("emailContato", valor)}
                placeholder="Ex: seuemail@email.com"
                type="email"
              />
            ) : null}

            {deveMostrar("salvar", "alterações", "configurações") ? (
              <SettingsRow
                icon="check"
                title={salvando ? "Salvando..." : "Salvar alterações"}
                subtitle="Grava suas preferências nesta conta"
                onClick={salvar}
              />
            ) : null}

            {deveMostrar("privacidade", "conta") ? (
              <SettingsRow
                icon="shield"
                title="Privacidade da conta"
                subtitle="Em breve: público, privado ou seguidores"
                right={<ValorLinha>Em breve</ValorLinha>}
              />
            ) : null}

            {deveMostrar("senha", "segurança") ? (
              <SettingsRow
                icon="lock"
                title="Senha e segurança"
                subtitle="Gerenciada pela sua autenticação"
                right={<ValorLinha>Conta</ValorLinha>}
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {adminLiberado && deveMostrar("moderação", "admin", "comunidade") ? (
          <SettingsSection title="Moderação">
            <SettingsRow
              icon="admin"
              title="Área de moderação"
              subtitle="Revisar denúncias e conteúdos enviados"
              href="/admin/comunidade"
            />
          </SettingsSection>
        ) : null}

        {deveMostrar(
          "historietas",
          "obras",
          "biblioteca",
          "notificações",
          "comunidade",
          "top 5",
          "diário",
        ) ? (
          <SettingsSection title="Como você usa o Historietas">
            {deveMostrar("obras", "criadas") ? (
              <SettingsRow
                icon="book"
                title="Obras criadas"
                subtitle="Total publicado ou salvo no seu dispositivo"
                right={<ValorLinha>{resumo.obras}</ValorLinha>}
                href="/perfil-autor?aba=obras"
              />
            ) : null}

            {deveMostrar("biblioteca", "lista", "favoritas", "concluidas") ? (
              <SettingsRow
                icon="bookmark"
                title="Biblioteca"
                subtitle="Favoritas, concluídas e obras seguidas"
                right={<ValorLinha>{totalBiblioteca}</ValorLinha>}
                href="/perfil-autor?aba=biblioteca"
              />
            ) : null}

            {deveMostrar("notificações", "avisos") ? (
              <SettingsRow
                icon="bell"
                title="Notificações"
                subtitle="Mensagens, avisos e atividade recente"
                right={<ValorLinha>{notificacoesNaoLidas}</ValorLinha>}
                href="/notificacoes"
              />
            ) : null}

            {deveMostrar("comunidade", "autor") ? (
              <SettingsRow
                icon="comment"
                title="Comunidade do autor"
                subtitle="Interações e publicações da comunidade"
                href="/perfil-autor?aba=comunidade"
              />
            ) : null}

            {deveMostrar("top 5", "favoritas") ? (
              <SettingsRow
                icon="trophy"
                title="TOP 5"
                subtitle="Escolha suas cinco obras favoritas"
                href="/perfil-autor/top-5"
              />
            ) : null}

            {deveMostrar("histórico", "leitura", "diário") ? (
              <SettingsRow
                icon="clock"
                title="Histórico de leitura"
                subtitle="Diário, leituras recentes e avaliações"
                href="/perfil-autor?aba=diario"
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar("preferências", "tema", "aparência", "efeitos", "avisos") ? (
          <SettingsSection title="Preferências">
            {deveMostrar("tema", "visual", "aparência") ? (
              <>
                <SettingsRow
                  icon="palette"
                  title="Tema visual"
                  subtitle="Altere as cores principais do Historietas"
                  right={<ValorLinha>{temaAtual.nome}</ValorLinha>}
                  onClick={() => setMostrarTemas((atual) => !atual)}
                />

                {mostrarTemas ? (
                  <div style={themeListStyle}>
                    {ORDEM_TEMAS_VISUAIS.map((temaVisual) => {
                      const tema = TEMAS_VISUAIS[temaVisual];
                      const ativo = preferencias.temaVisual === temaVisual;

                      return (
                        <button
                          key={temaVisual}
                          type="button"
                          onClick={() => atualizarTemaVisual(temaVisual)}
                          style={ativo ? themeOptionActiveStyle : themeOptionStyle}
                          aria-pressed={ativo}
                        >
                          <span
                            style={{
                              ...themeSwatchStyle,
                              background: `linear-gradient(135deg, ${tema.accent} 0%, ${tema.secondary} 100%)`,
                            }}
                          />

                          <span style={themeTextStyle}>
                            <strong style={themeNameStyle}>{tema.nome}</strong>
                            <span style={themeDescriptionStyle}>{tema.descricao}</span>
                          </span>

                          {ativo ? (
                            <span style={themeCheckStyle}>
                              <SvgIcon name="check" size={21} strokeWidth={2.2} />
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </>
            ) : null}

            {deveMostrar("receber", "avisos") ? (
              <SettingsRow
                icon="bell"
                title="Receber avisos"
                subtitle="Ativa alertas importantes do site"
                right={
                  <Toggle
                    checked={preferencias.receberAvisos}
                    onChange={() =>
                      atualizarPreferencia(
                        "receberAvisos",
                        !preferencias.receberAvisos,
                      )
                    }
                    ariaLabel="Ativar ou desativar avisos"
                  />
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("leitura", "confortável") ? (
              <SettingsRow
                icon="moon"
                title="Leitura confortável"
                subtitle="Reduz contraste e deixa a leitura mais suave"
                right={
                  <Toggle
                    checked={preferencias.leituraConfortavel}
                    onChange={() =>
                      atualizarPreferencia(
                        "leituraConfortavel",
                        !preferencias.leituraConfortavel,
                      )
                    }
                    ariaLabel="Ativar ou desativar leitura confortável"
                  />
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("efeitos", "reduzir") ? (
              <SettingsRow
                icon="spark"
                title="Reduzir efeitos"
                subtitle="Diminui brilhos, transições e animações"
                right={
                  <Toggle
                    checked={preferencias.reduzirEfeitos}
                    onChange={() =>
                      atualizarPreferencia("reduzirEfeitos", !preferencias.reduzirEfeitos)
                    }
                    ariaLabel="Ativar ou desativar redução de efeitos"
                  />
                }
                hideChevron
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar("dados", "backup", "copiar", "baixar", "download") ? (
          <SettingsSection title="Dados e arquivos">
            {deveMostrar("copiar", "dados") ? (
              <SettingsRow
                icon="copy"
                title="Copiar dados"
                subtitle="Copia um backup em texto para a área de transferência"
                onClick={copiarBackup}
              />
            ) : null}

            {deveMostrar("baixar", "backup", "download") ? (
              <SettingsRow
                icon="download"
                title="Baixar backup"
                subtitle="Salva um arquivo JSON com seus dados locais"
                onClick={baixarBackup}
              />
            ) : null}

            {deveMostrar("resumo", "dados") ? (
              <SettingsRow
                icon="database"
                title="Resumo da conta"
                subtitle={`${resumo.obras} obras, ${resumo.favoritas} na lista, ${
                  resumo.seguindoObras + resumo.seguindoAutores
                } seguindo`}
                hideChevron
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar("suporte", "ajuda", "termos", "políticas", "sobre") ? (
          <SettingsSection title="Suporte e sobre">
            {deveMostrar("ajuda", "suporte") ? (
              <SettingsRow
                icon="help"
                title="Central de ajuda"
                subtitle="Dúvidas, problemas e orientação"
                right={<ValorLinha>Em breve</ValorLinha>}
              />
            ) : null}

            {deveMostrar("termos", "políticas", "privacidade") ? (
              <SettingsRow
                icon="file"
                title="Termos e políticas"
                subtitle="Privacidade, uso da plataforma e regras"
                right={<ValorLinha>Em breve</ValorLinha>}
              />
            ) : null}

            {deveMostrar("sobre", "versão") ? (
              <SettingsRow
                icon="settings"
                title="Sobre o Historietas"
                subtitle="Versão local de desenvolvimento"
                right={<ValorLinha>Beta</ValorLinha>}
                hideChevron
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar("sair", "conta", "login") ? (
          <section style={sectionStyle}>
            <div style={listCardTransparentStyle}>
              <SettingsRow
                icon="logout"
                title="Sair da conta"
                subtitle="Encerrar sessão neste dispositivo"
                onClick={sairDaConta}
                danger
              />
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

const configuracoesPageCss = `
  html[data-historietas-tema-visual] body,
  html[data-historietas-tema-visual] main,
  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: var(--historietas-bg-start, #050509) !important;
    color: var(--historietas-text-primary, #FFFFFF) !important;
  }

  html[data-historietas-tema-visual] input::placeholder,
  html[data-historietas-tema-visual] textarea::placeholder {
    color: rgba(212,212,216,0.56) !important;
  }

  html[data-historietas-tema-visual] input,
  html[data-historietas-tema-visual] textarea,
  html[data-historietas-tema-visual] select {
    color: var(--historietas-input-text, #FFFFFF) !important;
  }

  .configuracoes-input {
    appearance: none;
  }

  .configuracoes-input::-webkit-search-cancel-button {
    appearance: none;
  }
`;

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "#050509",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily:
    "Inter, Poppins, Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const containerStyle: CSSProperties = {
  width: "min(760px, calc(100% - 32px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "16px 0 120px",
  boxSizing: "border-box",
  minWidth: 0,
};

const headerStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "40px minmax(0, 1fr)",
  alignItems: "center",
  gap: "10px",
  marginBottom: "16px",
};

const backButtonStyle: CSSProperties = {
  width: "40px",
  height: "40px",
  border: "0",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const pageTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(20px, 5.2vw, 25px)",
  lineHeight: 1.08,
  fontWeight: 900,
  letterSpacing: "-0.04em",
  textAlign: "left",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const searchBoxStyle: CSSProperties = {
  minHeight: "48px",
  borderRadius: "15px",
  background: "rgba(255,255,255,0.11)",
  border: "1px solid rgba(255,255,255,0.05)",
  color: "rgba(255,255,255,0.55)",
  display: "grid",
  gridTemplateColumns: "23px minmax(0, 1fr)",
  alignItems: "center",
  gap: "10px",
  padding: "0 15px",
  marginBottom: "18px",
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minHeight: "46px",
  border: "0",
  outline: "none",
  background: "transparent",
  color: "var(--historietas-input-text, #FFFFFF)",
  fontSize: "16px",
  fontWeight: 650,
  fontFamily: "inherit",
  minWidth: 0,
};

const profileCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "52px minmax(0, 1fr)",
  alignItems: "center",
  gap: "12px",
  padding: "14px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.09)",
  border: "1px solid rgba(255,255,255,0.06)",
  marginBottom: "18px",
};

const avatarStyle: CSSProperties = {
  width: "52px",
  height: "52px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  background:
    "linear-gradient(135deg, rgba(148,163,184,0.90), rgba(75,85,99,0.95))",
  fontSize: "21px",
  fontWeight: 760,
  letterSpacing: "-0.035em",
  flex: "0 0 auto",
};

const profileTextStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

const profileNameStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "17px",
  lineHeight: 1.08,
  fontWeight: 780,
  letterSpacing: "-0.025em",
  ...safeTextStyle,
};

const profileUsernameStyle: CSSProperties = {
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  fontSize: "13px",
  lineHeight: 1.15,
  fontWeight: 760,
  ...safeTextStyle,
};

const profileEmailStyle: CSSProperties = {
  color: "rgba(255,255,255,0.52)",
  fontSize: "13px",
  lineHeight: 1.18,
  fontWeight: 520,
  ...safeTextStyle,
};

const sectionStyle: CSSProperties = {
  marginTop: "18px",
  minWidth: 0,
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "rgba(255,255,255,0.52)",
  fontSize: "13px",
  lineHeight: 1.15,
  fontWeight: 760,
  letterSpacing: "-0.01em",
  ...safeTextStyle,
};

const listCardStyle: CSSProperties = {
  overflow: "hidden",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.09)",
  border: "1px solid rgba(255,255,255,0.045)",
};

const listCardTransparentStyle: CSSProperties = {
  overflow: "hidden",
  borderRadius: "20px",
  background: "transparent",
};

const rowBaseStyle: CSSProperties = {
  width: "100%",
  minHeight: "58px",
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr) auto 22px",
  alignItems: "center",
  gap: "9px",
  padding: "8px 12px",
  boxSizing: "border-box",
  border: "0",
  borderBottom: "1px solid rgba(255,255,255,0.065)",
  background: "transparent",
  color: "inherit",
  fontFamily: "inherit",
  textAlign: "left",
  textDecoration: "none",
  cursor: "pointer",
};

const rowButtonStyle: CSSProperties = {
  ...rowBaseStyle,
};

const rowLinkStyle: CSSProperties = {
  ...rowBaseStyle,
};

const rowStaticStyle: CSSProperties = {
  ...rowBaseStyle,
  cursor: "default",
};

const rowIconStyle: CSSProperties = {
  width: "32px",
  height: "32px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "rgba(255,255,255,0.78)",
  flex: "0 0 auto",
};

const rowTextBoxStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

const rowTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "16px",
  lineHeight: 1.1,
  fontWeight: 760,
  letterSpacing: "-0.02em",
  ...safeTextStyle,
};

const rowTitleDangerStyle: CSSProperties = {
  ...rowTitleStyle,
  color: "#FCA5A5",
};

const rowSubtitleStyle: CSSProperties = {
  color: "rgba(255,255,255,0.52)",
  fontSize: "12px",
  lineHeight: 1.22,
  fontWeight: 520,
  ...safeTextStyle,
};

const rowRightStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  minWidth: 0,
};

const rowValueStyle: CSSProperties = {
  color: "rgba(255,255,255,0.56)",
  fontSize: "13px",
  lineHeight: 1,
  fontWeight: 650,
  whiteSpace: "nowrap",
};

const rowValueDangerStyle: CSSProperties = {
  ...rowValueStyle,
  color: "#FCA5A5",
};

const rowChevronStyle: CSSProperties = {
  width: "22px",
  height: "22px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "rgba(255,255,255,0.46)",
};

const inputRowStyle: CSSProperties = {
  width: "100%",
  minHeight: "76px",
  display: "grid",
  gridTemplateColumns: "40px minmax(0, 1fr)",
  alignItems: "center",
  gap: "10px",
  padding: "12px 14px",
  boxSizing: "border-box",
  borderBottom: "1px solid rgba(255,255,255,0.065)",
};

const inputTextBoxStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

const inputLabelStyle: CSSProperties = {
  color: "rgba(255,255,255,0.60)",
  fontSize: "12px",
  lineHeight: 1,
  fontWeight: 880,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
};

const inputStyle: CSSProperties = {
  width: "100%",
  border: "0",
  outline: "none",
  background: "transparent",
  color: "var(--historietas-input-text, #FFFFFF)",
  fontSize: "17px",
  lineHeight: 1.2,
  fontWeight: 760,
  fontFamily: "inherit",
  padding: 0,
  minWidth: 0,
};

const inputHelperStyle: CSSProperties = {
  color: "rgba(255,255,255,0.46)",
  fontSize: "12px",
  lineHeight: 1.25,
  fontWeight: 620,
  ...safeTextStyle,
};

const inputErrorStyle: CSSProperties = {
  ...inputHelperStyle,
  color: "#FCA5A5",
};

const toggleBaseStyle: CSSProperties = {
  width: "52px",
  height: "31px",
  borderRadius: "999px",
  border: "0",
  padding: "3px",
  display: "inline-flex",
  alignItems: "center",
  cursor: "pointer",
  transition: "background 160ms ease",
};

const toggleOnStyle: CSSProperties = {
  ...toggleBaseStyle,
  justifyContent: "flex-end",
  background: "var(--historietas-accent, #F97316)",
};

const toggleOffStyle: CSSProperties = {
  ...toggleBaseStyle,
  justifyContent: "flex-start",
  background: "rgba(255,255,255,0.18)",
};

const toggleKnobBaseStyle: CSSProperties = {
  width: "25px",
  height: "25px",
  borderRadius: "999px",
  background: "#FFFFFF",
  boxShadow: "0 4px 10px rgba(0,0,0,0.28)",
};

const toggleKnobOnStyle: CSSProperties = {
  ...toggleKnobBaseStyle,
};

const toggleKnobOffStyle: CSSProperties = {
  ...toggleKnobBaseStyle,
};

const themeListStyle: CSSProperties = {
  padding: "6px 0",
  borderTop: "1px solid rgba(255,255,255,0.065)",
};

const themeOptionStyle: CSSProperties = {
  width: "100%",
  minHeight: "62px",
  display: "grid",
  gridTemplateColumns: "38px minmax(0, 1fr) 28px",
  alignItems: "center",
  gap: "12px",
  padding: "10px 14px",
  border: "0",
  borderBottom: "1px solid rgba(255,255,255,0.055)",
  background: "transparent",
  color: "inherit",
  fontFamily: "inherit",
  textAlign: "left",
  cursor: "pointer",
};

const themeOptionActiveStyle: CSSProperties = {
  ...themeOptionStyle,
  background: "rgba(255,255,255,0.055)",
};

const themeSwatchStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.13)",
};

const themeTextStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

const themeNameStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "15px",
  lineHeight: 1.1,
  fontWeight: 850,
};

const themeDescriptionStyle: CSSProperties = {
  color: "rgba(255,255,255,0.52)",
  fontSize: "12px",
  lineHeight: 1.2,
  fontWeight: 620,
  ...safeTextStyle,
};

const themeCheckStyle: CSSProperties = {
  width: "26px",
  height: "26px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--historietas-accent, #F97316)",
};

const emptyAccessTextStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.58)",
  fontSize: "14px",
  lineHeight: 1.45,
  fontWeight: 650,
  ...safeTextStyle,
};
