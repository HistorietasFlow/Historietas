"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "../../lib/supabase/client";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import { criarSlugBase, normalizarTexto } from "../../lib/utils";

type CapituloLocal = {
  id: string;
  titulo: string;
  texto: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
};

type ArquivoObraLocal = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: "texto" | "documento" | "imagem" | "outro";
  criadoEm: string;
};

type ObraLocal = {
  id: string;
  titulo: string;
  autor: string;
  autorId?: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  arquivoObra?: ArquivoObraLocal | null;
  publicado: boolean;
  capitulos: CapituloLocal[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  slug: string;
  link: string;
};

type SupabaseObraRow = {
  id: string;
  user_id: string;
  titulo: string | null;
  autor: string | null;
  genero: string | null;
  formato: string | null;
  classificacao_indicativa: string | null;
  sinopse: string | null;
  tags: string[] | null;
  capa_url: string | null;
  capa_nome: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  arquivo_tipo: string | null;
  arquivo_tamanho: number | null;
  arquivo_categoria: string | null;
  publicado: boolean | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
  atualizado_em: string | null;
};

type SupabaseCapituloRow = {
  id: string;
  obra_id: string;
  user_id: string;
  titulo: string | null;
  texto?: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

type PerfilExplorarRow = {
  id?: string | null;
  user_id?: string | null;
  nome?: string | null;
};

type OrdenacaoExplorar =
  | "relevancia"
  | "mais-curtidas"
  | "mais-salvas"
  | "mais-comentadas"
  | "mais-recentes"
  | "mais-capitulos";

type FiltroColecaoExplorar =
  | "todos"
  | "favoritas"
  | "concluidas"
  | "lendo"
  | "sem-leitura";

type TemaVisualExplorar =
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
  | "comedia";

type TemaVisualExplorarConfig = {
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

const TEMAS_VISUAIS_EXPLORAR: Record<TemaVisualExplorar, TemaVisualExplorarConfig> = {
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
    secondarySurface: "rgba(1,135,95,0.10)",
    secondaryButtonText: "#188038",
    dangerSurface: "rgba(217,48,37,0.10)",
    dangerButtonText: "#B3261E",
  },
  escuro: {
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
    heroShadow: "none",
    cardShadow: "none",
    logoShadow: "none",
    activeSurface: "rgba(167,139,250,0.12)",
    secondarySurface: "rgba(39,39,42,0.72)",
    secondaryButtonText: "#E4E4E7",
    dangerSurface: "rgba(127,29,29,0.18)",
    dangerButtonText: "#FCA5A5",
  },
  original: {
    accent: "#F97316",
    secondary: "#7C3AED",
    bgStart: "#070212",
    bgMid: "#070212",
    bgEnd: "#070212",
    glowPrimary: "transparent",
    glowSecondary: "transparent",
  },
  fantasia: {
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
    dangerButtonText: "#FCA5A5",
  },
  acao: {
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
  historico: {
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
};

const STORAGE_KEY = "historietas-obras";
const FILE_BACKUP_STORAGE_KEY = "historietas-arquivos-obras-backup";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const THEME_STORAGE_KEY = "historietas-tema-visual";

type ArquivosObrasBackup = Record<string, ArquivoObraLocal>;

const categorias = [
  "Ação",
  "Aventura",
  "Comédia",
  "Drama",
  "Fantasia",
  "Ficção",
  "Mistério",
  "Romance",
  "Suspense",
  "Terror",
  "Sobrenatural",
  "Histórico",
  "Biografia",
];

function obterTemaVisualExplorarSeguro(valor: unknown): TemaVisualExplorar {
  if (typeof valor === "string" && valor in TEMAS_VISUAIS_EXPLORAR) {
    return valor as TemaVisualExplorar;
  }

  return "original";
}

function carregarTemaVisualExplorarSalvo() {
  try {
    const texto = localStorage.getItem(THEME_STORAGE_KEY);

    if (!texto) {
      return "original";
    }

    try {
      return obterTemaVisualExplorarSeguro(JSON.parse(texto));
    } catch {
      return obterTemaVisualExplorarSeguro(texto);
    }
  } catch {
    return "original";
  }
}

function aplicarTemaVisualExplorar(temaVisual: TemaVisualExplorar) {
  if (typeof document === "undefined") {
    return;
  }

  const tema = TEMAS_VISUAIS_EXPLORAR[temaVisual];
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
  raiz.style.setProperty(
    "--historietas-hero-shadow",
    tema.heroShadow ||
      "0 18px 48px rgba(0,0,0,0.32), 0 0 36px rgba(124,58,237,0.12)"
  );
  raiz.style.setProperty(
    "--historietas-card-shadow",
    tema.cardShadow || "0 14px 36px rgba(0,0,0,0.20)"
  );
  raiz.style.setProperty(
    "--historietas-logo-shadow",
    tema.logoShadow || "0 0 26px rgba(139, 92, 246, 0.24)"
  );
  raiz.style.setProperty(
    "--historietas-active-surface",
    tema.activeSurface ||
      "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 25%, rgba(18,12,30,0.92))"
  );
  raiz.style.setProperty(
    "--historietas-secondary-surface",
    tema.secondarySurface ||
      "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, rgba(255,255,255,0.035))"
  );
  raiz.style.setProperty(
    "--historietas-secondary-button-text",
    tema.secondaryButtonText || "#DDD6FE"
  );
  raiz.style.setProperty(
    "--historietas-danger-surface",
    tema.dangerSurface || "rgba(239, 68, 68, 0.105)"
  );
  raiz.style.setProperty(
    "--historietas-danger-button-text",
    tema.dangerButtonText || "#FCA5A5"
  );

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

function criarStorageKeyUsuarioExplorar(chave: string, userId: string) {
  const usuarioId = userId.trim();

  return usuarioId ? `${chave}:${usuarioId}` : chave;
}

function normalizarListaIdsExplorar(valor: unknown) {
  return Array.isArray(valor)
    ? valor
        .filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
        .map((id) => id.trim())
    : [];
}

function carregarListaIdsUsuarioExplorar(chave: string, userId: string) {
  try {
    const chaveUsuario = criarStorageKeyUsuarioExplorar(chave, userId);
    const texto = localStorage.getItem(chaveUsuario);
    const json: unknown = texto ? JSON.parse(texto) : [];

    return normalizarListaIdsExplorar(json);
  } catch {
    return [] as string[];
  }
}

function salvarListaIdsUsuarioExplorar(
  chave: string,
  userId: string,
  lista: string[]
) {
  const listaNormalizada = Array.from(new Set(normalizarListaIdsExplorar(lista)));

  try {
    localStorage.setItem(chave, JSON.stringify(listaNormalizada));

    if (userId.trim()) {
      localStorage.setItem(
        criarStorageKeyUsuarioExplorar(chave, userId),
        JSON.stringify(listaNormalizada)
      );
    }
  } catch {
    // localStorage é apoio; a página continua com o estado em memória.
  }
}

function obterIdentificadoresObraExplorar(
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">
) {
  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ].filter((valor): valor is string => typeof valor === "string" && Boolean(valor.trim()))
    )
  );
}

function colecaoTemObraExplorar(
  colecao: string[],
  obra: Pick<ObraLocal, "id" | "slug" | "titulo">
) {
  const ids = new Set(normalizarListaIdsExplorar(colecao));

  return obterIdentificadoresObraExplorar(obra).some((identificador) =>
    ids.has(identificador)
  );
}

function criarLoginHrefExplorar() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/explorar";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/explorar";
  const params = new URLSearchParams({
    redirectTo: destinoSeguro,
  });

  return `/login?${params.toString()}`;
}

function criarPerfilAutorHrefExplorar(autor: string, autorId?: string) {
  const parametros = new URLSearchParams();
  const autorLimpo = autor.trim();
  const autorIdLimpo = autorId?.trim() || "";

  if (autorLimpo) {
    parametros.set("autor", autorLimpo);
  }

  if (autorIdLimpo) {
    parametros.set("autorId", autorIdLimpo);
    parametros.set("userId", autorIdLimpo);
  }

  const query = parametros.toString();

  return query ? `/perfil-autor?${query}` : "/perfil-autor";
}

function obterNomeProfileExplorar(profile: PerfilExplorarRow) {
  return typeof profile.nome === "string" && profile.nome.trim()
    ? profile.nome.trim()
    : "";
}

async function carregarNomesProfilesExplorar(userIds: string[]) {
  const idsUnicos = Array.from(
    new Set(userIds.map((id) => id.trim()).filter(Boolean))
  );
  const nomesPorUsuario = new Map<string, string>();

  if (idsUnicos.length === 0) {
    return nomesPorUsuario;
  }

  try {
    const filtroIds = idsUnicos.join(",");
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, nome")
      .or(`user_id.in.(${filtroIds}),id.in.(${filtroIds})`)
      .limit(Math.max(idsUnicos.length * 2, 1));

    if (error) {
      console.warn("Não consegui carregar profiles no Explorar:", error.message);
      return nomesPorUsuario;
    }

    ((data || []) as PerfilExplorarRow[]).forEach((profile) => {
      const nome = obterNomeProfileExplorar(profile);

      if (!nome) {
        return;
      }

      [profile.user_id, profile.id].forEach((id) => {
        if (typeof id === "string" && id.trim()) {
          nomesPorUsuario.set(id.trim(), nome);
        }
      });
    });
  } catch (error) {
    console.warn("Não consegui acessar profiles no Explorar:", error);
  }

  return nomesPorUsuario;
}

function aplicarNomesProfilesEmObrasExplorar(
  obrasParaAtualizar: ObraLocal[],
  nomesPorUsuario: Map<string, string>
) {
  if (nomesPorUsuario.size === 0) {
    return obrasParaAtualizar;
  }

  return obrasParaAtualizar.map((obra) => {
    const autorId = obra.autorId?.trim() || "";
    const nomeProfile = autorId ? nomesPorUsuario.get(autorId) || "" : "";

    if (!nomeProfile) {
      return obra;
    }

    return {
      ...obra,
      autor: nomeProfile,
    };
  });
}

function categoriaCombinaComGenero(categoria: string, genero: string) {
  const categoriaNormalizada = normalizarTexto(categoria);
  const generoNormalizado = normalizarTexto(genero);

  if (!categoriaNormalizada || !generoNormalizado) {
    return false;
  }

  if (categoriaNormalizada === "ficcao") {
    return (
      generoNormalizado.includes("ficcao") ||
      generoNormalizado.includes("sci-fi") ||
      generoNormalizado.includes("sci fi")
    );
  }

  return generoNormalizado.includes(categoriaNormalizada);
}

function totalCurtidasObra(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.curtiu).length;
}

function totalComentariosObra(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.comentario.trim()).length;
}

function totalSalvosObra(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.salvo).length;
}

function totalLidosObra(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.lido).length;
}

function obraTemAtividadeLeitura(obra: ObraLocal) {
  return obra.capitulos.some((capitulo) => {
    return (
      capitulo.lido ||
      capitulo.salvo ||
      capitulo.curtiu ||
      Boolean(capitulo.comentario.trim())
    );
  });
}

function calcularProgressoLeitura(capitulos: CapituloLocal[]) {
  if (capitulos.length === 0) {
    return 0;
  }

  const capitulosLidos = capitulos.filter((capitulo) => capitulo.lido).length;

  return Math.round((capitulosLidos / capitulos.length) * 100);
}

function encontrarCapituloParaContinuar(obra: ObraLocal) {
  const capituloRegistrado = obra.ultimoCapituloLidoId
    ? obra.capitulos.find(
        (capitulo) => capitulo.id === obra.ultimoCapituloLidoId
      )
    : null;

  if (capituloRegistrado) {
    return capituloRegistrado;
  }

  const capitulosAtivos = obra.capitulos.filter((capitulo) => {
    return (
      capitulo.lido ||
      capitulo.salvo ||
      capitulo.curtiu ||
      Boolean(capitulo.comentario.trim())
    );
  });

  return capitulosAtivos[capitulosAtivos.length - 1] || null;
}

function dataCriacaoObra(obra: ObraLocal) {
  const data = new Date(obra.criadaEm).getTime();

  return Number.isNaN(data) ? 0 : data;
}

function normalizarCapitulo(
  capitulo: Partial<CapituloLocal>,
  index: number
): CapituloLocal {
  return {
    id:
      typeof capitulo.id === "string" && capitulo.id.trim()
        ? capitulo.id
        : `capitulo-${index + 1}`,
    titulo: capitulo.titulo || "Capítulo sem título",
    texto: typeof capitulo.texto === "string" ? capitulo.texto : "",
    curtiu: Boolean(capitulo.curtiu),
    salvo: Boolean(capitulo.salvo),
    comentario:
      typeof capitulo.comentario === "string" ? capitulo.comentario : "",
    criadoEm: typeof capitulo.criadoEm === "string" ? capitulo.criadoEm : "",
    lido: Boolean(capitulo.lido),
    lidoEm: typeof capitulo.lidoEm === "string" ? capitulo.lidoEm : "",
  };
}

function normalizarArquivoObra(valor: unknown): ArquivoObraLocal | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return null;
  }

  const arquivo = valor as Partial<ArquivoObraLocal>;

  if (
    typeof arquivo.nome !== "string" ||
    !arquivo.nome.trim() ||
    typeof arquivo.conteudo !== "string" ||
    !arquivo.conteudo.trim()
  ) {
    return null;
  }

  let categoria: ArquivoObraLocal["categoria"] = "outro";

  if (
    arquivo.categoria === "texto" ||
    arquivo.categoria === "documento" ||
    arquivo.categoria === "imagem" ||
    arquivo.categoria === "outro"
  ) {
    categoria = arquivo.categoria;
  }

  return {
    nome: arquivo.nome.trim(),
    tipo: typeof arquivo.tipo === "string" ? arquivo.tipo : "",
    tamanho:
      typeof arquivo.tamanho === "number" && Number.isFinite(arquivo.tamanho)
        ? arquivo.tamanho
        : 0,
    conteudo: arquivo.conteudo,
    categoria,
    criadoEm: typeof arquivo.criadoEm === "string" ? arquivo.criadoEm : "",
  };
}

function obraTemArquivoAnexadoExplorar(
  obra: Pick<ObraLocal, "arquivoObra">
) {
  return Boolean(normalizarArquivoObra(obra.arquivoObra));
}

function obraTemConteudoPublicadoExplorar(
  obra: Pick<ObraLocal, "capitulos" | "arquivoObra">
) {
  return obra.capitulos.length > 0 || obraTemArquivoAnexadoExplorar(obra);
}

function carregarBackupArquivosObras(userId = ""): ArquivosObrasBackup {
  if (typeof window === "undefined" || !userId.trim()) {
    return {};
  }

  try {
    const backupTexto = localStorage.getItem(
      criarStorageKeyUsuarioExplorar(FILE_BACKUP_STORAGE_KEY, userId)
    );
    const backupJson: unknown = backupTexto ? JSON.parse(backupTexto) : {};

    if (!backupJson || typeof backupJson !== "object" || Array.isArray(backupJson)) {
      return {};
    }

    const backupNormalizado: ArquivosObrasBackup = {};

    Object.entries(backupJson as Record<string, unknown>).forEach(
      ([chave, arquivo]) => {
        const arquivoNormalizado = normalizarArquivoObra(arquivo);

        if (chave.trim() && arquivoNormalizado) {
          backupNormalizado[chave] = arquivoNormalizado;
        }
      }
    );

    return backupNormalizado;
  } catch {
    return {};
  }
}

function criarChavesBackupObra(
  obra: Partial<ObraLocal> & Record<string, unknown>,
  slug: string
) {
  const chaves = new Set<string>();
  const id = typeof obra.id === "string" ? obra.id.trim() : "";
  const titulo = typeof obra.titulo === "string" ? obra.titulo.trim() : "";
  const link = typeof obra.link === "string" ? obra.link.trim() : "";

  if (id) {
    chaves.add(`id:${id}`);
  }

  if (slug) {
    chaves.add(`slug:${slug}`);
  }

  if (titulo) {
    chaves.add(`titulo:${normalizarTexto(titulo)}`);
  }

  if (link) {
    chaves.add(`link:${link}`);
  }

  return Array.from(chaves);
}

function obterArquivoObraComBackup(
  obra: Partial<ObraLocal> & Record<string, unknown>,
  slug: string,
  userId = ""
) {
  const arquivoAtual = normalizarArquivoObra(obra.arquivoObra);

  if (arquivoAtual) {
    return arquivoAtual;
  }

  const backupArquivos = carregarBackupArquivosObras(userId);
  const chaves = criarChavesBackupObra(obra, slug);

  for (const chave of chaves) {
    const arquivoBackup = normalizarArquivoObra(backupArquivos[chave]);

    if (arquivoBackup) {
      return arquivoBackup;
    }
  }

  return null;
}

function salvarBackupsArquivosObras(obrasParaSalvar: ObraLocal[], userId = "") {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  const backupAtual = carregarBackupArquivosObras(userId);
  const proximoBackup: ArquivosObrasBackup = { ...backupAtual };

  obrasParaSalvar.forEach((obra) => {
    const arquivo = normalizarArquivoObra(obra.arquivoObra);

    if (!arquivo) {
      return;
    }

    criarChavesBackupObra(obra, obra.slug).forEach((chave) => {
      proximoBackup[chave] = arquivo;
    });
  });

  localStorage.setItem(
    criarStorageKeyUsuarioExplorar(FILE_BACKUP_STORAGE_KEY, userId),
    JSON.stringify(proximoBackup)
  );
}

function normalizarObra(
  obra: Partial<ObraLocal> & Record<string, unknown>,
  index: number,
  userId = ""
): ObraLocal {
  const capitulosNormalizados: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapitulo(capitulo, capituloIndex)
      )
    : [];

  const tagsNormalizadas = Array.isArray(obra.tags)
    ? obra.tags
        .filter((tag): tag is string => {
          return typeof tag === "string" && Boolean(tag.trim());
        })
        .map((tag) => tag.trim())
    : [];

  const titulo =
    typeof obra.titulo === "string" && obra.titulo.trim()
      ? obra.titulo.trim()
      : "Obra sem título";

  const slug =
    typeof obra.slug === "string" && obra.slug.trim()
      ? obra.slug.trim()
      : criarSlugBase(titulo || `obra-${index + 1}`);

  return {
    id:
      typeof obra.id === "string" && obra.id.trim()
        ? obra.id
        : `obra-${index + 1}`,
    titulo,
    autor:
      typeof obra.autor === "string" && obra.autor.trim()
        ? obra.autor
        : "Autor não informado",
    autorId:
      typeof obra.autorId === "string" && obra.autorId.trim()
        ? obra.autorId.trim()
        : typeof obra.user_id === "string" && obra.user_id.trim()
          ? obra.user_id.trim()
          : typeof obra.userId === "string" && obra.userId.trim()
            ? obra.userId.trim()
            : typeof obra.autor_id === "string" && obra.autor_id.trim()
              ? obra.autor_id.trim()
              : "",
    genero:
      typeof obra.genero === "string" && obra.genero.trim()
        ? obra.genero
        : "Não informado",
    formato:
      typeof obra.formato === "string" && obra.formato.trim()
        ? obra.formato
        : "Não informado",
    classificacaoIndicativa:
      typeof obra.classificacaoIndicativa === "string" &&
      obra.classificacaoIndicativa.trim()
        ? obra.classificacaoIndicativa
        : "Não informada",
    sinopse:
      typeof obra.sinopse === "string" && obra.sinopse.trim()
        ? obra.sinopse
        : "Nenhuma sinopse informada.",
    tags: tagsNormalizadas.length > 0 ? tagsNormalizadas : ["sem tags"],
    capa: typeof obra.capa === "string" ? obra.capa : "",
    capaNome: typeof obra.capaNome === "string" ? obra.capaNome : "",
    arquivoObra: obterArquivoObraComBackup(obra, slug, userId),
    publicado: Boolean(obra.publicado),
    capitulos: capitulosNormalizados,
    criadaEm: typeof obra.criadaEm === "string" ? obra.criadaEm : "",
    ultimoCapituloLidoId:
      typeof obra.ultimoCapituloLidoId === "string"
        ? obra.ultimoCapituloLidoId
        : "",
    ultimaLeituraEm:
      typeof obra.ultimaLeituraEm === "string" ? obra.ultimaLeituraEm : "",
    progressoLeitura: calcularProgressoLeitura(capitulosNormalizados),
    slug,
    link:
      typeof obra.link === "string" && obra.link.trim()
        ? obra.link
        : `/obra/${slug}`,
  };
}

function normalizarCategoriaArquivoSupabase(
  categoria: string | null
): ArquivoObraLocal["categoria"] {
  if (
    categoria === "texto" ||
    categoria === "documento" ||
    categoria === "imagem" ||
    categoria === "outro"
  ) {
    return categoria;
  }

  return "outro";
}

function normalizarObraSupabase(
  obra: SupabaseObraRow,
  capitulosSupabase: SupabaseCapituloRow[],
  obraLocal: ObraLocal | undefined,
  index: number
): ObraLocal {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo])
  );

  const capitulosRemotos: CapituloLocal[] = capitulosSupabase.map(
    (capitulo, capituloIndex) => {
      const capituloLocal = capitulosLocaisPorId.get(capitulo.id);

      return {
        id: capitulo.id,
        titulo:
          capitulo.titulo?.trim() ||
          capituloLocal?.titulo ||
          `Capítulo ${capituloIndex + 1}`,
        texto: capituloLocal?.texto || "",
        curtiu: Boolean(capituloLocal?.curtiu),
        salvo: Boolean(capituloLocal?.salvo),
        comentario: capituloLocal?.comentario || "",
        criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
        lido: Boolean(capituloLocal?.lido),
        lidoEm: capituloLocal?.lidoEm || "",
      };
    }
  );

  const capitulosRemotosIds = new Set(
    capitulosRemotos.map((capitulo) => capitulo.id)
  );

  const capitulosApenasLocais = (obraLocal?.capitulos || []).filter(
    (capitulo) => !capitulosRemotosIds.has(capitulo.id)
  );

  const capitulosMesclados = [...capitulosRemotos, ...capitulosApenasLocais];
  const tituloObra = obra.titulo?.trim() || obraLocal?.titulo || "Obra sem título";
  const slugObra =
    obra.slug?.trim() ||
    obraLocal?.slug ||
    criarSlugBase(tituloObra || `obra-${index + 1}`);
  const arquivoUrl = obra.arquivo_url?.trim() || "";
  const arquivoCategoria = normalizarCategoriaArquivoSupabase(
    obra.arquivo_categoria
  );
  const arquivoTipo =
    obra.arquivo_tipo?.trim() ||
    obraLocal?.arquivoObra?.tipo ||
    (arquivoCategoria === "documento"
      ? "application/pdf"
      : arquivoCategoria === "imagem"
        ? "image/*"
        : arquivoCategoria === "texto"
          ? "text/plain"
          : "");

  return {
    id: obra.id || obraLocal?.id || `obra-${index + 1}`,
    titulo: tituloObra,
    autor: obra.autor?.trim() || obraLocal?.autor || "Autor não informado",
    autorId: obra.user_id?.trim() || obraLocal?.autorId || "",
    genero: obra.genero?.trim() || obraLocal?.genero || "Não informado",
    formato: obra.formato?.trim() || obraLocal?.formato || "Não informado",
    classificacaoIndicativa:
      obra.classificacao_indicativa?.trim() ||
      obraLocal?.classificacaoIndicativa ||
      "Não informada",
    sinopse:
      obra.sinopse?.trim() ||
      obraLocal?.sinopse ||
      "Nenhuma sinopse informada.",
    tags:
      Array.isArray(obra.tags) && obra.tags.length > 0
        ? obra.tags.filter((tag) => typeof tag === "string" && Boolean(tag.trim()))
        : obraLocal?.tags || ["sem tags"],
    capa: obra.capa_url?.trim() || obraLocal?.capa || "",
    capaNome: obra.capa_nome?.trim() || obraLocal?.capaNome || "",
    arquivoObra: arquivoUrl
      ? {
          nome:
            obra.arquivo_nome?.trim() ||
            obraLocal?.arquivoObra?.nome ||
            "Arquivo da obra",
          tipo: arquivoTipo,
          tamanho:
            typeof obra.arquivo_tamanho === "number" &&
            Number.isFinite(obra.arquivo_tamanho)
              ? obra.arquivo_tamanho
              : obraLocal?.arquivoObra?.tamanho || 0,
          conteudo: arquivoUrl,
          categoria: arquivoCategoria,
          criadoEm: obra.criada_em || obraLocal?.arquivoObra?.criadoEm || "",
        }
      : obraLocal?.arquivoObra || null,
    publicado: Boolean(obra.publicado),
    capitulos: capitulosMesclados,
    criadaEm: obra.criada_em || obraLocal?.criadaEm || "",
    ultimoCapituloLidoId: obraLocal?.ultimoCapituloLidoId || "",
    ultimaLeituraEm: obraLocal?.ultimaLeituraEm || "",
    progressoLeitura: calcularProgressoLeitura(capitulosMesclados),
    slug: slugObra,
    link: obra.link?.trim() || obraLocal?.link || `/obra/${slugObra}`,
  };
}

function mesclarObrasSemDuplicar(
  obrasLocais: ObraLocal[],
  obrasSupabase: ObraLocal[]
) {
  const obrasMescladas: ObraLocal[] = [];
  const chavesUsadas = new Set<string>();

  [...obrasSupabase, ...obrasLocais].forEach((obra) => {
    const slug = obra.slug || criarSlugBase(obra.titulo);
    const chaves = [obra.id, slug].filter((chave) => Boolean(chave.trim()));
    const jaExiste = chaves.some((chave) => chavesUsadas.has(chave));

    if (jaExiste) {
      return;
    }

    obrasMescladas.push(obra);
    chaves.forEach((chave) => chavesUsadas.add(chave));
  });

  return obrasMescladas;
}

async function carregarIdsColecaoUsuarioExplorar(
  tabela: "favoritos" | "concluidas",
  userId: string
) {
  if (!userId.trim()) {
    return [] as string[];
  }

  try {
    const { data, error } = await supabase
      .from(tabela)
      .select("obra_id")
      .eq("user_id", userId)
      .limit(1000);

    if (error || !Array.isArray(data)) {
      if (error) {
        console.warn(`Não consegui carregar ${tabela} no Explorar:`, error.message);
      }

      return [] as string[];
    }

    return data
      .map((registro) => {
        if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
          return "";
        }

        const obraId = (registro as Record<string, unknown>).obra_id;

        return typeof obraId === "string" ? obraId.trim() : "";
      })
      .filter(Boolean);
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} no Explorar:`, error);
    return [] as string[];
  }
}

async function carregarColecoesUsuarioExplorar(userId: string) {
  const [favoritas, concluidas] = await Promise.all([
    carregarIdsColecaoUsuarioExplorar("favoritos", userId),
    carregarIdsColecaoUsuarioExplorar("concluidas", userId),
  ]);

  return {
    favoritas,
    concluidas,
  };
}

async function carregarObrasPublicadasSupabase(obrasLocais: ObraLocal[], userId = "") {
  try {
    const { data: obrasBanco, error: erroObras } = await supabase
      .from("obras")
      .select(
        "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,slug,link,criada_em,atualizado_em"
      )
      .eq("publicado", true)
      .order("criada_em", { ascending: false })
      .limit(80);

    if (erroObras) {
      console.warn(
        "Não consegui carregar obras publicadas do Supabase:",
        erroObras.message
      );
      return obrasLocais;
    }

    const obrasSupabase = ((obrasBanco || []) as unknown as SupabaseObraRow[]).filter(
      (obra) => Boolean(obra.id)
    );

    const nomesProfiles = await carregarNomesProfilesExplorar([
      ...obrasLocais.map((obra) => obra.autorId || ""),
      ...obrasSupabase.map((obra) => obra.user_id || ""),
    ]);
    const obrasLocaisComProfiles = aplicarNomesProfilesEmObrasExplorar(
      obrasLocais,
      nomesProfiles
    );

    if (obrasSupabase.length === 0) {
      return obrasLocaisComProfiles;
    }

    const idsObras = obrasSupabase.map((obra) => obra.id);
    const { data: capitulosBanco, error: erroCapitulos } = await supabase
      .from("capitulos")
      .select("id,obra_id,user_id,titulo,ordem,publicado,criado_em,atualizado_em")
      .in("obra_id", idsObras)
      .eq("publicado", true)
      .order("ordem", { ascending: true })
      .limit(600);

    if (erroCapitulos) {
      console.warn(
        "Não consegui carregar capítulos do Supabase no Explorar:",
        erroCapitulos.message
      );
    }

    const capitulosPorObra = new Map<string, SupabaseCapituloRow[]>();

    ((erroCapitulos ? [] : capitulosBanco || []) as unknown as SupabaseCapituloRow[]).forEach(
      (capitulo) => {
        const capitulosAtuais = capitulosPorObra.get(capitulo.obra_id) || [];
        capitulosAtuais.push(capitulo);
        capitulosPorObra.set(capitulo.obra_id, capitulosAtuais);
      }
    );

    const obrasSupabaseNormalizadas = obrasSupabase
      .map((obraBanco, index) => {
        const slugBanco = obraBanco.slug?.trim() || "";
        const obraLocal = obrasLocais.find((obraLocalAtual) => {
          const slugLocal =
            obraLocalAtual.slug || criarSlugBase(obraLocalAtual.titulo);

          return obraLocalAtual.id === obraBanco.id || slugLocal === slugBanco;
        });

        const obraNormalizada = normalizarObraSupabase(
          obraBanco,
          capitulosPorObra.get(obraBanco.id) || [],
          obraLocal,
          index
        );
        const nomeProfile =
          nomesProfiles.get(obraNormalizada.autorId || "") || "";

        return nomeProfile
          ? {
              ...obraNormalizada,
              autor: nomeProfile,
            }
          : obraNormalizada;
      })
      .filter((obra) => obraTemConteudoPublicadoExplorar(obra));

    const obrasMescladas = mesclarObrasSemDuplicar(
      obrasLocaisComProfiles,
      obrasSupabaseNormalizadas
    );

    salvarBackupsArquivosObras(obrasMescladas, userId);
    if (userId.trim()) {
      localStorage.setItem(
        criarStorageKeyUsuarioExplorar(STORAGE_KEY, userId),
        JSON.stringify(obrasMescladas)
      );
    }

    return obrasMescladas;
  } catch (error) {
    console.warn("Não consegui acessar o Supabase no Explorar:", error);
    return obrasLocais;
  }
}

function ordenarObrasLocais(lista: ObraLocal[], ordenacao: OrdenacaoExplorar) {
  const novaLista = [...lista];

  if (ordenacao === "mais-curtidas") {
    return novaLista.sort(
      (a, b) => totalCurtidasObra(b) - totalCurtidasObra(a)
    );
  }

  if (ordenacao === "mais-salvas") {
    return novaLista.sort((a, b) => totalSalvosObra(b) - totalSalvosObra(a));
  }

  if (ordenacao === "mais-comentadas") {
    return novaLista.sort(
      (a, b) => totalComentariosObra(b) - totalComentariosObra(a)
    );
  }

  if (ordenacao === "mais-recentes") {
    return novaLista.sort((a, b) => dataCriacaoObra(b) - dataCriacaoObra(a));
  }

  if (ordenacao === "mais-capitulos") {
    return novaLista.sort((a, b) => b.capitulos.length - a.capitulos.length);
  }

  return novaLista;
}

function criarPublishedCoverStyle(
  capa: string,
  tema?: ReturnType<typeof obterTemaCategoria>
): CSSProperties {
  const baseStyle = tema ? criarPublishedCoverTemaStyle(tema) : publishedCoverStyle;

  if (!capa) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "none",
    opacity: 1,
  };
}

type TemaCategoriaExplorar = {
  accent: string;
  secondary: string;
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  glowPrimary: string;
  glowSecondary: string;
  titleTo: string;
  activeSurface: string;
  secondarySurface: string;
  secondaryButtonText: string;
  pageBackground: string;
  heroBackground: string;
  activeBackground: string;
};

function criarTemaCategoriaExplorar(
  _tema: Pick<
    TemaVisualExplorarConfig,
    | "accent"
    | "secondary"
    | "bgStart"
    | "bgMid"
    | "bgEnd"
    | "glowPrimary"
    | "glowSecondary"
    | "titleTo"
    | "activeSurface"
    | "secondarySurface"
    | "secondaryButtonText"
  >
): TemaCategoriaExplorar {
  return {
    accent: "#A78BFA",
    secondary: "#4C1D95",
    bgStart: "#070212",
    bgMid: "#070212",
    bgEnd: "#070212",
    glowPrimary: "transparent",
    glowSecondary: "transparent",
    titleTo: "#DDD6FE",
    activeSurface: "rgba(46, 16, 101, 0.54)",
    secondarySurface: "rgba(255,255,255,0.06)",
    secondaryButtonText: "#DDD6FE",
    activeBackground: "#08030F",
    pageBackground: "#070212",
    heroBackground: "#070212",
  };
}

const TEMAS_CATEGORIAS_EXPLORAR: Record<string, TemaCategoriaExplorar> = {
  acao: criarTemaCategoriaExplorar(TEMAS_VISUAIS_EXPLORAR.acao),
  aventura: criarTemaCategoriaExplorar({
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
  }),
  comedia: criarTemaCategoriaExplorar(TEMAS_VISUAIS_EXPLORAR.comedia),
  drama: criarTemaCategoriaExplorar(TEMAS_VISUAIS_EXPLORAR.drama),
  fantasia: criarTemaCategoriaExplorar(TEMAS_VISUAIS_EXPLORAR.fantasia),
  ficcao: criarTemaCategoriaExplorar(TEMAS_VISUAIS_EXPLORAR.scifi),
  "sci-fi": criarTemaCategoriaExplorar(TEMAS_VISUAIS_EXPLORAR.scifi),
  "sci fi": criarTemaCategoriaExplorar(TEMAS_VISUAIS_EXPLORAR.scifi),
  scifi: criarTemaCategoriaExplorar(TEMAS_VISUAIS_EXPLORAR.scifi),
  romance: criarTemaCategoriaExplorar(TEMAS_VISUAIS_EXPLORAR.romance),
  terror: criarTemaCategoriaExplorar(TEMAS_VISUAIS_EXPLORAR.terror),
  sobrenatural: criarTemaCategoriaExplorar(TEMAS_VISUAIS_EXPLORAR.sobrenatural),
  misterio: criarTemaCategoriaExplorar({
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
  }),
  suspense: criarTemaCategoriaExplorar({
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
  }),
  historico: criarTemaCategoriaExplorar({
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
  }),
  biografia: criarTemaCategoriaExplorar({
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
  }),
};

function obterTemaCategoria(categoria: string) {
  const categoriaNormalizada = normalizarTexto(categoria);

  return (
    TEMAS_CATEGORIAS_EXPLORAR[categoriaNormalizada] ||
    criarTemaCategoriaExplorar(TEMAS_VISUAIS_EXPLORAR.original)
  );
}

function criarTemaPaginaVisualExplorar(
  _temaVisual: TemaVisualExplorar,
  tema: TemaVisualExplorarConfig,
  temaCategoria: ReturnType<typeof obterTemaCategoria>,
  categoriaSelecionada: string
): ReturnType<typeof obterTemaCategoria> {
  if (categoriaSelecionada.trim()) {
    return temaCategoria;
  }

  return criarTemaCategoriaExplorar(tema);
}

function obterDecoracoesCategoria(categoria: string) {
  const categoriaNormalizada = normalizarTexto(categoria);

  if (categoriaNormalizada === "sobrenatural") {
    return ["☾", "✦", "👻", "✧", "◌"];
  }

  if (categoriaNormalizada === "terror") {
    return ["☾", "🕸", "✕", "◌", "✦"];
  }

  if (categoriaNormalizada === "fantasia") {
    return ["✦", "✧", "◇", "☾", "✶"];
  }

  if (categoriaNormalizada === "ficcao" || categoriaNormalizada === "sci-fi" || categoriaNormalizada === "sci fi") {
    return ["⌁", "◇", "＋", "◌", "⌬"];
  }

  if (categoriaNormalizada === "romance") {
    return ["✦", "♡", "✧", "◌", "❀"];
  }

  if (categoriaNormalizada === "acao") {
    return ["✦", "╱", "⚡", "✕", "╲"];
  }

  if (categoriaNormalizada === "drama") {
    return ["☾", "✧", "◌", "✦", "◇"];
  }

  if (categoriaNormalizada === "aventura") {
    return ["✦", "⌖", "◇", "☾", "✧"];
  }

  if (categoriaNormalizada === "comedia") {
    return ["✦", "☺", "✧", "☆", "◌"];
  }

  return ["✦", "◌", "✧"];
}

function criarDecoracaoTemaStyle(
  _index: number,
  _tema: ReturnType<typeof obterTemaCategoria>
): CSSProperties {
  return {
    display: "none",
  };
}

export default function ExplorarPage() {
  const router = useRouter();
  const [obrasLocais, setObrasLocais] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [busca, setBusca] = useState("");
  const [buscaMobileAberta, setBuscaMobileAberta] = useState(false);
  const [filtroFormato, setFiltroFormato] = useState("todos");
  const [filtroClassificacao, setFiltroClassificacao] = useState("todos");
  const [filtroCapitulos, setFiltroCapitulos] = useState("todos");
  const [filtroColecao, setFiltroColecao] =
    useState<FiltroColecaoExplorar>("todos");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoExplorar>("relevancia");
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [temaVisual, setTemaVisual] = useState<TemaVisualExplorar>("original");
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [mensagemLogin, setMensagemLogin] = useState("");
  const { notificacoesNaoLidas } = useNotificacoes();

  useEffect(() => {
    const temaSalvo = carregarTemaVisualExplorarSalvo();
    aplicarTemaVisualExplorar(temaSalvo);

    const aplicarTemaTimer = window.setTimeout(() => {
      setTemaVisual(temaSalvo);
    }, 0);

    return () => {
      window.clearTimeout(aplicarTemaTimer);
    };
  }, []);

  useEffect(() => {
    let componenteAtivo = true;

    async function verificarUsuarioLogado() {
      try {
        const { data } = await supabase.auth.getUser();

        if (componenteAtivo) {
          setUsuarioLogado(Boolean(data.user));
          setUsuarioIdLogado(data.user?.id || "");
        }
      } catch {
        if (componenteAtivo) {
          setUsuarioLogado(false);
          setUsuarioIdLogado("");
        }
      }
    }

    void verificarUsuarioLogado();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuarioLogado(Boolean(session?.user));
      setUsuarioIdLogado(session?.user?.id || "");

      if (session?.user) {
        setMensagemLogin("");
        return;
      }

      setFiltroColecao("todos");
    });

    return () => {
      componenteAtivo = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const atualizarModoDesktop = () => {
      setIsDesktop(mediaQuery.matches);
    };

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
    if (!mostrarFiltrosAvancados || typeof document === "undefined") {
      return;
    }

    const bodyOverflowAnterior = document.body.style.overflow;
    const htmlOverflowAnterior = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = bodyOverflowAnterior;
      document.documentElement.style.overflow = htmlOverflowAnterior;
    };
  }, [mostrarFiltrosAvancados]);

  useEffect(() => {
    let cancelado = false;

    async function carregarExplorar() {
      const params = new URLSearchParams(window.location.search);
      const categoriaParam = params.get("categoria") || "";

      setCategoriaSelecionada(categoriaParam.trim());

      try {
        let userIdAtual = "";

        try {
          const { data } = await supabase.auth.getUser();
          userIdAtual = data.user?.id || "";
        } catch {
          userIdAtual = "";
        }

        if (!cancelado) {
          setUsuarioLogado(Boolean(userIdAtual));
          setUsuarioIdLogado(userIdAtual);
        }

        const obrasSalvasTexto = userIdAtual
          ? localStorage.getItem(
              criarStorageKeyUsuarioExplorar(STORAGE_KEY, userIdAtual)
            )
          : null;
        const obrasSalvasJson = obrasSalvasTexto
          ? JSON.parse(obrasSalvasTexto)
          : [];

        const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
          ? obrasSalvasJson.map((obra, index) =>
              normalizarObra(obra, index, userIdAtual)
            )
          : [];

        salvarBackupsArquivosObras(obrasNormalizadas, userIdAtual);
        if (userIdAtual) {
          localStorage.setItem(
            criarStorageKeyUsuarioExplorar(STORAGE_KEY, userIdAtual),
            JSON.stringify(obrasNormalizadas)
          );
        }

        const favoritasGlobais: string[] = [];
        const favoritasDoUsuario = userIdAtual
          ? carregarListaIdsUsuarioExplorar(FAVORITES_STORAGE_KEY, userIdAtual)
          : [];

        const concluidasGlobais: string[] = [];
        const concluidasDoUsuario = userIdAtual
          ? carregarListaIdsUsuarioExplorar(COMPLETED_STORAGE_KEY, userIdAtual)
          : [];

        const colecoesSupabase = userIdAtual
          ? await carregarColecoesUsuarioExplorar(userIdAtual)
          : { favoritas: [] as string[], concluidas: [] as string[] };

        const obrasFavoritasNormalizadas = Array.from(
          new Set([
            ...favoritasGlobais,
            ...favoritasDoUsuario,
            ...colecoesSupabase.favoritas,
          ])
        );
        const obrasConcluidasNormalizadas = Array.from(
          new Set([
            ...concluidasGlobais,
            ...concluidasDoUsuario,
            ...colecoesSupabase.concluidas,
          ])
        );

        salvarListaIdsUsuarioExplorar(
          FAVORITES_STORAGE_KEY,
          userIdAtual,
          obrasFavoritasNormalizadas
        );
        salvarListaIdsUsuarioExplorar(
          COMPLETED_STORAGE_KEY,
          userIdAtual,
          obrasConcluidasNormalizadas
        );

        if (!cancelado) {
          setObrasLocais(obrasNormalizadas);
          setObrasFavoritas(obrasFavoritasNormalizadas);
          setObrasConcluidas(obrasConcluidasNormalizadas);
        }

        const obrasComSupabase = await carregarObrasPublicadasSupabase(
          obrasNormalizadas,
          userIdAtual
        );

        if (!cancelado) {
          setObrasLocais(obrasComSupabase);
        }
      } catch {
        if (!cancelado) {
          setObrasLocais([]);
          setObrasFavoritas([]);
          setObrasConcluidas([]);
        }
      }
    }

    carregarExplorar();

    return () => {
      cancelado = true;
    };
  }, []);

  const termoBusca = normalizarTexto(busca);

  const obrasLocaisFiltradas = useMemo(() => {
    const filtradas = obrasLocais.filter((obra) => {
      const passaCategoria = categoriaSelecionada
        ? categoriaCombinaComGenero(categoriaSelecionada, obra.genero)
        : true;

      const passaFormato =
        filtroFormato === "todos" ? true : obra.formato === filtroFormato;

      const passaClassificacao =
        filtroClassificacao === "todos"
          ? true
          : obra.classificacaoIndicativa === filtroClassificacao;

      const passaPublicacao = obra.publicado && obraTemConteudoPublicadoExplorar(obra);

      const passaCapitulos =
        filtroCapitulos === "todos"
          ? true
          : filtroCapitulos === "com-capitulos"
            ? obra.capitulos.length > 0
            : obra.capitulos.length === 0;

      const passaColecao =
        !usuarioLogado || filtroColecao === "todos"
          ? true
          : filtroColecao === "favoritas"
            ? colecaoTemObraExplorar(obrasFavoritas, obra)
            : filtroColecao === "concluidas"
              ? colecaoTemObraExplorar(obrasConcluidas, obra)
              : filtroColecao === "lendo"
                ? obraTemAtividadeLeitura(obra)
                : !obraTemAtividadeLeitura(obra);

      const textoBusca = normalizarTexto(
        [
          obra.titulo,
          obra.autor,
          obra.genero,
          obra.formato,
          obra.classificacaoIndicativa,
          obra.sinopse,
          obra.tags.join(" "),
          obra.capaNome,
          obra.arquivoObra?.nome || "",
          obra.capitulos.map((capitulo) => capitulo.titulo).join(" "),
          obra.capitulos.map((capitulo) => capitulo.texto).join(" "),
        ].join(" ")
      );

      const passaBusca = termoBusca ? textoBusca.includes(termoBusca) : true;

      return (
        passaCategoria &&
        passaFormato &&
        passaClassificacao &&
        passaPublicacao &&
        passaCapitulos &&
        passaColecao &&
        passaBusca
      );
    });

    return ordenarObrasLocais(filtradas, ordenacao);
  }, [
    obrasLocais,
    categoriaSelecionada,
    filtroFormato,
    filtroClassificacao,
    filtroCapitulos,
    filtroColecao,
    usuarioLogado,
    termoBusca,
    ordenacao,
    obrasFavoritas,
    obrasConcluidas,
  ]);

  const totalResultados = obrasLocaisFiltradas.length;

  const filtrosAtivos = Boolean(
    categoriaSelecionada ||
      termoBusca ||
      filtroFormato !== "todos" ||
      filtroClassificacao !== "todos" ||
      filtroCapitulos !== "todos" ||
      (usuarioLogado && filtroColecao !== "todos") ||
      ordenacao !== "relevancia"
  );

  const totalFiltrosAvancadosAtivos = [
    usuarioLogado && filtroColecao !== "todos",
    filtroFormato !== "todos",
    filtroClassificacao !== "todos",
    filtroCapitulos !== "todos",
    ordenacao !== "relevancia",
  ].filter(Boolean).length;

  const textoBotaoFiltrosAvancados =
    totalFiltrosAvancadosAtivos > 0
      ? `Filtrar e ordenar (${totalFiltrosAvancadosAtivos})`
      : "Filtrar e ordenar";

  const categoriaAtiva = categoriaSelecionada.trim().length > 0;
  const temaCategoria = obterTemaCategoria(categoriaSelecionada);
  const temaVisualConfig = TEMAS_VISUAIS_EXPLORAR[temaVisual];
  const temaPagina = criarTemaPaginaVisualExplorar(
    temaVisual,
    temaVisualConfig,
    temaCategoria,
    categoriaSelecionada
  );
  const decoracoesTema = obterDecoracoesCategoria(categoriaSelecionada || temaVisual);

  useEffect(() => {
    aplicarTemaVisualExplorar(temaVisual);

    if (typeof document === "undefined") {
      return;
    }

    const raiz = document.documentElement;

    if (!categoriaAtiva) {
      raiz.removeAttribute("data-historietas-explorar-categoria-ativa");
      document.body.removeAttribute("data-historietas-explorar-categoria-ativa");
      document.body.style.removeProperty("background");
      raiz.style.removeProperty("background");
      return;
    }

    raiz.setAttribute("data-historietas-explorar-categoria-ativa", "true");
    document.body.setAttribute("data-historietas-explorar-categoria-ativa", "true");
    raiz.style.setProperty("background", "#070212");
    document.body.style.setProperty("background", "#070212");
    raiz.style.setProperty("--historietas-accent", "#A78BFA");
    raiz.style.setProperty("--historietas-secondary", "#4C1D95");
    raiz.style.setProperty("--historietas-bg-start", temaCategoria.bgStart);
    raiz.style.setProperty("--historietas-bg-mid", temaCategoria.bgMid);
    raiz.style.setProperty("--historietas-bg-end", temaCategoria.bgEnd);
    raiz.style.setProperty("--historietas-glow-primary", "transparent");
    raiz.style.setProperty("--historietas-glow-secondary", "transparent");
    raiz.style.setProperty("--historietas-title-from", "#FFFFFF");
    raiz.style.setProperty("--historietas-title-mid", "#F5F3FF");
    raiz.style.setProperty("--historietas-title-to", temaCategoria.titleTo);
    raiz.style.setProperty("--historietas-text-primary", "#FFFFFF");
    raiz.style.setProperty("--historietas-text-secondary", "#E5E7EB");
    raiz.style.setProperty("--historietas-input-bg", "rgba(5,5,12,0.72)");
    raiz.style.setProperty("--historietas-input-text", "#FFFFFF");
    raiz.style.setProperty("--historietas-surface", "rgba(9,7,18,0.72)");
    raiz.style.setProperty("--historietas-surface-strong", "rgba(3,3,8,0.92)");
    raiz.style.setProperty("--historietas-border-soft", "rgba(255,255,255,0.13)");
    raiz.style.setProperty(
      "--historietas-secondary-surface",
      `color-mix(in srgb, ${temaCategoria.accent} 15%, rgba(8,8,14,0.82))`
    );
    raiz.style.setProperty(
      "--historietas-active-surface",
      `color-mix(in srgb, ${temaCategoria.accent} 24%, rgba(8,8,14,0.88))`
    );
    raiz.style.setProperty(
      "--historietas-bottom-nav-bg",
      `radial-gradient(circle at 16% 0%, color-mix(in srgb, ${temaCategoria.accent} 20%, transparent), transparent 34%), linear-gradient(180deg, rgba(8,8,14,0.98) 0%, rgba(3,3,8,0.98) 100%)`
    );
    raiz.style.setProperty(
      "--historietas-bottom-nav-border",
      `color-mix(in srgb, ${temaCategoria.accent} 24%, rgba(255,255,255,0.10))`
    );
    raiz.style.setProperty("--historietas-bottom-nav-shadow", "none");
    raiz.style.setProperty("--historietas-bottom-nav-text", "#E5E7EB");
    raiz.style.setProperty(
      "--historietas-bottom-nav-hover-bg",
      `color-mix(in srgb, ${temaCategoria.accent} 18%, rgba(255,255,255,0.06))`
    );
    raiz.style.setProperty("--historietas-bottom-nav-hover-text", "#FFFFFF");
    raiz.style.setProperty("--historietas-bottom-nav-icon-text", temaCategoria.accent);
    raiz.style.setProperty("--historietas-bottom-nav-icon-bg", "rgba(255,255,255,0.06)");
    raiz.style.setProperty(
      "--historietas-bottom-nav-icon-border",
      `color-mix(in srgb, ${temaCategoria.accent} 22%, rgba(255,255,255,0.08))`
    );
    raiz.style.setProperty("--historietas-bottom-nav-main-bg", temaCategoria.activeBackground);
    raiz.style.setProperty(
      "--historietas-bottom-nav-main-border",
      `color-mix(in srgb, ${temaCategoria.accent} 55%, transparent)`
    );
    raiz.style.setProperty("--historietas-bottom-nav-main-shadow", "none");
    raiz.style.setProperty("--historietas-bottom-nav-shine", "none");
  }, [categoriaAtiva, categoriaSelecionada, temaVisual]);

  function atualizarUrl(categoria: string) {
    const novaUrl = categoria
      ? `/explorar?categoria=${encodeURIComponent(categoria)}`
      : "/explorar";

    window.history.pushState(null, "", novaUrl);
  }

  function selecionarCategoria(categoria: string) {
    setCategoriaSelecionada(categoria);
    atualizarUrl(categoria);
  }

  function selecionarFiltroColecao(filtro: FiltroColecaoExplorar) {
    if (filtro === "todos") {
      setMensagemLogin("");
      setFiltroColecao("todos");
      return;
    }

    if (!usuarioLogado) {
      setMensagemLogin("Entre na sua conta para usar filtros pessoais.");
      setFiltroColecao("todos");
      router.push(criarLoginHrefExplorar());
      return;
    }

    setMensagemLogin("");
    setFiltroColecao(filtro);
  }

  function limparFiltros() {
    setCategoriaSelecionada("");
    setBusca("");
    setFiltroFormato("todos");
    setFiltroClassificacao("todos");
    setFiltroCapitulos("todos");
    setFiltroColecao("todos");
    setOrdenacao("relevancia");
    setMensagemLogin("");
    setMostrarFiltrosAvancados(false);
    window.history.pushState(null, "", "/explorar");
  }

  return (
    <main style={criarExplorarPageStyle(temaPagina)}>
      <style>{themePageCss}</style>
      <style>{explorarBuscaToggleCss}</style>

      {isDesktop && (
        <div style={criarExplorarTopWaterFadeStyle(temaPagina, true)} aria-hidden="true" />
      )}

      {!isDesktop && (
        <div style={criarExplorarTopWaterFadeStyle(temaPagina, false)} aria-hidden="true" />
      )}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTitleHeaderStyle : titleHeaderStyle}>
          <button
            type="button"
            onClick={() => setMostrarFiltrosAvancados(true)}
            style={
              isDesktop
                ? desktopExplorarHeaderFilterButtonStyle
                : explorarHeaderFilterButtonStyle
            }
            aria-label="Filtrar e ordenar"
          >
            <span>{textoBotaoFiltrosAvancados}</span>
            <span style={explorarHeaderFilterIconStyle} aria-hidden="true">
              ⇅
            </span>
          </button>

          {!isDesktop && (
            <button
              type="button"
              onClick={() => setBuscaMobileAberta((aberta) => !aberta)}
              aria-label={buscaMobileAberta ? "Fechar busca" : "Abrir busca"}
              aria-pressed={buscaMobileAberta}
              style={
                buscaMobileAberta
                  ? mobileSearchToggleActiveStyle
                  : mobileSearchToggleStyle
              }
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle
                  cx="10.85"
                  cy="10.85"
                  r="6.65"
                  stroke="currentColor"
                  strokeWidth="2.15"
                />
                <path
                  d="M16.05 16.05L20.25 20.25"
                  stroke="currentColor"
                  strokeWidth="2.15"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}

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

              {usuarioLogado && notificacoesNaoLidas > 0 ? (
                <span style={desktopNotificationBadgeStyle}>
                  {notificacoesNaoLidas > 99
                    ? "99+"
                    : notificacoesNaoLidas}
                </span>
              ) : null}
            </Link>
          ) : null}
        </header>

        <section style={isDesktop ? criarDesktopSearchBoxStyle(temaPagina, categoriaAtiva) : criarSearchBoxStyle(temaPagina, categoriaAtiva)}>
          {(isDesktop || buscaMobileAberta) && (
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar histórias..."
              style={criarSearchInputStyle(temaPagina, isDesktop, categoriaAtiva)}
              type="text"
            />
          )}

          <section className="explorar-carousel" style={isDesktop ? desktopCategoriesStyle : categoriesStyle} aria-label="Categorias">
            <button
              type="button"
              onClick={() => selecionarCategoria("")}
              style={!categoriaSelecionada ? criarActiveCategoryStyle(temaPagina) : categoryStyle}
            >
              Todas
            </button>

            {categorias.map((categoria) => (
              <button
                key={categoria}
                type="button"
                onClick={() => selecionarCategoria(categoria)}
                style={
                  categoriaSelecionada === categoria
                    ? criarActiveCategoryStyle(temaPagina)
                    : categoryStyle
                }
              >
                {categoria}
              </button>
            ))}
          </section>

          {mensagemLogin && (
            <span style={loginNoticeStyle}>{mensagemLogin}</span>
          )}

        </section>

        {mostrarFiltrosAvancados && (
          <div
            style={explorarModalOverlayStyle}
            onClick={() => setMostrarFiltrosAvancados(false)}
          >
            <section
              style={isDesktop ? desktopExplorarModalSheetStyle : explorarModalSheetStyle}
              onClick={(event) => event.stopPropagation()}
              aria-label="Filtrar e ordenar"
            >
              <span style={explorarModalHandleStyle} aria-hidden="true" />

              <h2 style={explorarModalTitleStyle}>Filtrar e ordenar</h2>

              <div style={explorarModalContentStyle}>
                <p style={explorarModalSectionLabelStyle}>Mostrar</p>

                {[
                  ["todos", "Todas"],
                  ["lendo", "Lendo agora"],
                  ["favoritas", "Na lista"],
                  ["concluidas", "Concluídas"],
                  ["sem-leitura", "Sem leitura"],
                ].map(([valor, rotulo]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => selecionarFiltroColecao(valor as FiltroColecaoExplorar)}
                    style={criarExplorarModalOptionStyle(filtroColecao === valor)}
                  >
                    <span>{rotulo}</span>
                    <span style={criarExplorarModalRadioStyle(filtroColecao === valor)} />
                  </button>
                ))}

                <p style={explorarModalSectionLabelStyle}>Ordenar</p>

                {[
                  ["relevancia", "Relevância"],
                  ["mais-curtidas", "Mais curtidas"],
                  ["mais-recentes", "Mais recentes"],
                ].map(([valor, rotulo]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setOrdenacao(valor as OrdenacaoExplorar)}
                    style={criarExplorarModalOptionStyle(ordenacao === valor)}
                  >
                    <span>{rotulo}</span>
                    <span style={criarExplorarModalRadioStyle(ordenacao === valor)} />
                  </button>
                ))}

                {filtrosAtivos && (
                  <>
                    <span style={explorarModalClearDividerStyle} aria-hidden="true" />

                    <button
                      type="button"
                      onClick={limparFiltros}
                      style={explorarModalClearButtonStyle}
                    >
                      Limpar filtros
                    </button>
                  </>
                )}
              </div>
            </section>
          </div>
        )}

        {obrasLocaisFiltradas.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title={
                categoriaSelecionada
                  ? `Publicações em ${categoriaSelecionada}`
                  : "Publicações recentes"
              }
              tema={temaPagina}
              isDesktop={isDesktop}
            />

            <div style={isDesktop ? desktopPublishedGridStyle : gridStyle}>
              {obrasLocaisFiltradas.map((obra) => (
                <ObraPublicadaCard
                  key={obra.id}
                  obra={obra}
                  favorita={usuarioLogado && colecaoTemObraExplorar(obrasFavoritas, obra)}
                  concluida={usuarioLogado && colecaoTemObraExplorar(obrasConcluidas, obra)}
                  tema={temaPagina}
                  isDesktop={isDesktop}
                />
              ))}
            </div>
          </section>
        )}


        {totalResultados === 0 && (
          <p style={isDesktop ? desktopEmptyMessageStyle : emptyMessageStyle}>
            Nenhuma obra encontrada no Explorar. Tente limpar os filtros ou usar
            outra busca.
          </p>
        )}
      </section>
    </main>
  );
}

function SectionHeader({
  title,
  tema,
  isDesktop,
}: {
  title: string;
  tema: ReturnType<typeof obterTemaCategoria>;
  isDesktop?: boolean;
}) {
  const titleStyleTema: CSSProperties = {
    ...(isDesktop ? desktopSectionTitleStyle : sectionTitleStyle),
    background: "none",
    color: "#FFFFFF",
    textAlign: "center",
  };

  return (
    <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
      <h2 style={titleStyleTema}>{title}</h2>
    </div>
  );
}

function ObraPublicadaCard({
  obra,
  favorita,
  concluida,
  tema,
  isDesktop,
}: {
  obra: ObraLocal;
  favorita: boolean;
  concluida: boolean;
  tema: ReturnType<typeof obterTemaCategoria>;
  isDesktop?: boolean;
}) {
  const totalCurtidas = totalCurtidasObra(obra);
  const totalComentarios = totalComentariosObra(obra);
  const totalLidos = totalLidosObra(obra);
  const progressoLeitura = calcularProgressoLeitura(obra.capitulos);
  const paginaPublicaHref =
    obra.link && obra.link.trim()
      ? obra.link
      : `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
  const perfilAutorHref = criarPerfilAutorHrefExplorar(
    obra.autor,
    obra.autorId
  );

  return (
    <article style={isDesktop ? criarDesktopPublishedCardTemaStyle(tema) : criarPublishedCardTemaStyle(tema)}>
      <Link href={paginaPublicaHref} style={isDesktop ? criarDesktopPublishedCoverStyle(obra.capa, tema) : criarPublishedCoverStyle(obra.capa, tema)}>
        {!obra.capa && null}
      </Link>

      <div style={isDesktop ? desktopPublishedInfoStyle : publishedInfoStyle}>
        <div style={cardTopStyle}>
          <h3 style={isDesktop ? desktopPublishedTitleStyle : publishedTitleStyle}>{obra.titulo}</h3>

          <div style={statusRowStyle}>
            {!obra.publicado && <span style={draftStatusStyle}>Rascunho</span>}

            <span style={formatBadgeStyle}>{obra.formato}</span>

            <span style={classificationBadgeStyle}>
              {obra.classificacaoIndicativa}
            </span>

            {obra.arquivoObra && <span style={fileStatusBadgeStyle}>Arquivo</span>}

            {favorita && <span style={favoriteBadgeStyle}>★</span>}

            {concluida && <span style={completedBadgeStyle}>✓</span>}
          </div>
        </div>

        <Link href={perfilAutorHref} style={authorLinkStyle}>
          Por {obra.autor}
        </Link>

        {isDesktop && (
          <p style={desktopPublishedSynopsisStyle}>{obra.sinopse}</p>
        )}

        <div style={statsStyle}>
          <span style={metricItemStyle}>
            <span style={metricIconStyle}>👁</span>
            {totalLidos}
          </span>

          <span style={metricItemStyle}>
            <span style={heartMetricIconStyle}>♥</span>
            {totalCurtidas}
          </span>

          <span style={metricItemStyle}>
            <span style={metricIconStyle}>💬</span>
            {totalComentarios}
          </span>

          <span style={metricItemStyle}>
            <span style={metricIconStyle}>📚</span>
            {obra.capitulos.length} cap.
          </span>
        </div>

        {progressoLeitura > 0 && (
          <div style={progressCompactStyle}>
            <div style={criarProgressTrackStyle(tema)}>
              <div
                style={{
                  ...criarProgressBarStyle(tema),
                  width: `${progressoLeitura}%`,
                }}
              />
            </div>

            <span style={progressTextStyle}>{progressoLeitura}%</span>
          </div>
        )}

        <div style={isDesktop ? desktopCardActionRowStyle : cardActionRowStyle}>
          <span style={isDesktop ? desktopCardGenreBadgeStyle : cardGenreBadgeStyle}>
            {obra.genero}
          </span>

          <Link href={paginaPublicaHref} style={criarCardPrimaryActionStyle(tema, isDesktop)}>
            Ver obra
          </Link>
        </div>
      </div>
    </article>
  );
}

function criarActiveCategoryStyle(_tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...activeCategoryStyle,
    background: "#08030F",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#FFFFFF",
    boxShadow: "none",
  };
}

function criarSearchBoxStyle(
  _tema: ReturnType<typeof obterTemaCategoria>,
  _categoriaAtiva = false
): CSSProperties {
  return {
    ...searchBoxStyle,
    background: "rgba(4, 0, 10, 0.72)",
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "none",
  };
}

function criarDesktopSearchBoxStyle(
  tema: ReturnType<typeof obterTemaCategoria>,
  categoriaAtiva = false
): CSSProperties {
  return {
    ...criarSearchBoxStyle(tema, categoriaAtiva),
    gridTemplateColumns: "1fr",
    alignItems: "stretch",
    gap: "5px",
    marginTop: "12px",
    padding: "10px 12px",
    borderRadius: "22px",
    overflow: "hidden",
    boxShadow: "none",
  };
}

function criarSearchInputStyle(
  _tema: ReturnType<typeof obterTemaCategoria>,
  isDesktop: boolean,
  _categoriaAtiva: boolean
): CSSProperties {
  return isDesktop ? desktopSearchInputStyle : searchInputStyle;
}






function criarPublishedCardTemaStyle(_tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...publishedCardStyle,
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "none",
  };
}

function criarDesktopPublishedCardTemaStyle(_tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...desktopPublishedCardStyle,
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "none",
  };
}



function criarPublishedCoverTemaStyle(_tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...publishedCoverStyle,
    backgroundImage: "linear-gradient(135deg, #08030F 0%, #04000A 100%)",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarDesktopPublishedCoverStyle(
  capa: string,
  tema: ReturnType<typeof obterTemaCategoria>
): CSSProperties {
  const baseStyle = criarDesktopPublishedCoverTemaStyle(tema);

  if (!capa) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "none",
    opacity: 1,
  };
}

function criarDesktopPublishedCoverTemaStyle(_tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...desktopPublishedCoverStyle,
    backgroundImage: "linear-gradient(135deg, #08030F 0%, #04000A 100%)",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarProgressTrackStyle(_tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return progressTrackStyle;
}

function criarProgressBarStyle(_tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return progressBarStyle;
}

function criarReadStyle(_tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...readStyle,
    color: "#FFFFFF",
    background: "#08030F",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "none",
  };
}

function criarCardPrimaryActionStyle(
  tema: ReturnType<typeof obterTemaCategoria>,
  isDesktop?: boolean
): CSSProperties {
  return {
    ...criarReadStyle(tema),
    ...(isDesktop ? desktopCardPrimaryActionStyle : cardPrimaryActionStyle),
  };
}

const themePageCss = `
  html[data-historietas-tema-visual] body,
  html[data-historietas-tema-visual] main,
  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main,
  html[data-historietas-explorar-categoria-ativa="true"],
  html[data-historietas-explorar-categoria-ativa="true"] body {
    background: #070212 !important;
    color: var(--historietas-text-primary, #FFFFFF) !important;
  }

  html[data-historietas-tema-visual] main > div[aria-hidden="true"],
  html[data-historietas-tema-visual="original"] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  .explorar-carousel {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .explorar-carousel::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }

  html[data-historietas-tema-visual] nav,
  html[data-historietas-tema-visual] [data-bottom-nav],
  html[data-historietas-tema-visual] [data-mobile-nav],
  html[data-historietas-tema-visual] nav:has(a[href="/publicar"]),
  html[data-historietas-tema-visual] div:has(> a[href="/publicar"]):has(> a[href="/perfil-autor?aba=biblioteca"]) {
    background: var(--historietas-bottom-nav-bg, #04000A) !important;
    border-color: var(--historietas-bottom-nav-border, rgba(59, 7, 100, 0.52)) !important;
    box-shadow: var(--historietas-bottom-nav-shadow, none) !important;
    color: var(--historietas-bottom-nav-text, #9980D8) !important;
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
    color: var(--historietas-bottom-nav-text, #9980D8) !important;
    box-shadow: none !important;
  }

  @media (hover: hover) and (pointer: fine) {
    html[data-historietas-tema-visual] nav a:hover,
    html[data-historietas-tema-visual] [data-bottom-nav] a:hover,
    html[data-historietas-tema-visual] [data-mobile-nav] a:hover,
    html[data-historietas-tema-visual] nav button:hover,
    html[data-historietas-tema-visual] [data-bottom-nav] button:hover,
    html[data-historietas-tema-visual] [data-mobile-nav] button:hover {
      background: var(--historietas-bottom-nav-hover-bg, rgba(59, 7, 100, 0.20)) !important;
      border-color: var(--historietas-bottom-nav-border, rgba(59, 7, 100, 0.52)) !important;
      color: var(--historietas-bottom-nav-hover-text, #FFFFFF) !important;
    }
  }

  html[data-historietas-tema-visual] nav a[href="/explorar"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/explorar"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/explorar"] {
    background: var(--historietas-bottom-nav-active-bg, rgba(59, 7, 100, 0.54)) !important;
    border-color: var(--historietas-bottom-nav-active-border, rgba(109, 40, 217, 0.48)) !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] nav a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) {
    background: transparent !important;
    border-color: transparent !important;
    box-shadow: none !important;
    color: var(--historietas-bottom-nav-text, #9980D8) !important;
  }

  html[data-historietas-tema-visual] nav .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-icon {
    color: var(--historietas-bottom-nav-icon-text, #AD95EA) !important;
    background: var(--historietas-bottom-nav-icon-bg, rgba(59, 7, 100, 0.28)) !important;
    border-color: var(--historietas-bottom-nav-icon-border, rgba(76, 29, 149, 0.34)) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/explorar"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/explorar"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/explorar"] .historietas-bottom-nav-icon {
    color: #FFFFFF !important;
    background: var(--historietas-bottom-nav-active-icon-bg, #3B0764) !important;
    border-color: var(--historietas-bottom-nav-active-icon-border, rgba(167, 139, 250, 0.46)) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) .historietas-bottom-nav-icon {
    color: var(--historietas-bottom-nav-icon-text, #AD95EA) !important;
    background: var(--historietas-bottom-nav-icon-bg, rgba(59, 7, 100, 0.28)) !important;
    border-color: var(--historietas-bottom-nav-icon-border, rgba(76, 29, 149, 0.34)) !important;
  }

  html[data-historietas-tema-visual] input::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  html[data-historietas-tema-visual] input,
  html[data-historietas-tema-visual] textarea,
  html[data-historietas-tema-visual] select {
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] button {
    color: inherit;
  }
`;

const explorarBuscaToggleCss = `
  button[aria-label="Abrir busca"],
  button[aria-label="Fechar busca"],
  button[aria-label="Abrir busca"]:hover,
  button[aria-label="Fechar busca"]:hover,
  button[aria-label="Abrir busca"]:active,
  button[aria-label="Fechar busca"]:active,
  button[aria-label="Abrir busca"]:focus,
  button[aria-label="Fechar busca"]:focus,
  button[aria-label="Abrir busca"]:focus-visible,
  button[aria-label="Fechar busca"]:focus-visible {
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
    outline: none !important;
    filter: none !important;
    backdrop-filter: none !important;
    -webkit-tap-highlight-color: transparent !important;
  }

  input[placeholder="Buscar histórias..."],
  input[placeholder="Buscar histórias..."]:hover,
  input[placeholder="Buscar histórias..."]:focus,
  input[placeholder="Buscar histórias..."]:focus-visible {
    box-shadow: none !important;
    outline: none !important;
    filter: none !important;
    backdrop-filter: none !important;
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
  opacity: 0,
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background: "#070212",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

function criarExplorarPageStyle(
  _tema: ReturnType<typeof obterTemaCategoria>
): CSSProperties {
  return {
    ...pageStyle,
    background: "#070212",
    color: "#FFFFFF",
  };
}

function criarExplorarTopWaterFadeStyle(
  _tema: ReturnType<typeof obterTemaCategoria>,
  desktop: boolean
): CSSProperties {
  return {
    ...(desktop ? desktopTopWaterFadeStyle : mobileTopWaterFadeStyle),
    background: "transparent",
    opacity: 0,
  };
}

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(900px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "8px 0 calc(24px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "18px",
  padding: "2px 0",
  minWidth: 0,
};

const mobileTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "12px",
  padding: "0",
};

const topActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  flex: "0 0 auto",
};

const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "23px",
  fontWeight: 950,
  letterSpacing: "-0.06em",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "calc(100% - 118px)",
  overflow: "hidden",
  ...safeTextStyle,
};

const logoMarkStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#04000A",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  border: "1px solid rgba(59, 7, 100, 0.58)",
  boxShadow: "none",
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
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const backButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "40px",
  padding: "0 15px",
  borderRadius: "999px",
  background: "#04000A",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  textAlign: "center",
  boxShadow: "none",
  ...safeTextStyle,
};

const libraryButtonTopStyle: CSSProperties = {
  ...backButtonStyle,
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#DDD6FE",
};

const soonTopButtonStyle: CSSProperties = {
  ...backButtonStyle,
  minHeight: "38px",
  padding: "0 13px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#DDD6FE",
  boxShadow: "none",
};

const desktopSoonTopButtonStyle: CSSProperties = {
  ...soonTopButtonStyle,
  minHeight: "40px",
};

const titleHeaderStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  marginTop: "0",
  marginBottom: "10px",
  padding: 0,
  minWidth: 0,
  minHeight: "38px",
  maxWidth: "100%",
  textAlign: "left",
  boxSizing: "border-box",
};
const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  position: "relative",
  marginTop: "0",
  marginBottom: "12px",
  minHeight: "40px",
};

const mobileSearchToggleStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  right: 0,
  transform: "translateY(-50%)",
  width: "34px",
  height: "34px",
  borderRadius: 0,
  border: 0,
  background: "transparent",
  color: "#FFFFFF",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  cursor: "pointer",
  flex: "0 0 auto",
  boxShadow: "none",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  WebkitAppearance: "none",
  appearance: "none",
  zIndex: 2,
};

const mobileSearchToggleActiveStyle: CSSProperties = {
  ...mobileSearchToggleStyle,
  border: 0,
  background: "transparent",
  color: "#FFFFFF",
  boxShadow: "none",
  outline: "none",
};

const explorarHeaderFilterButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  border: 0,
  background: "transparent",
  color: "#FFFFFF",
  minHeight: "38px",
  maxWidth: "calc(100% - 46px)",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "8px",
  fontSize: "16px",
  lineHeight: 1,
  fontWeight: 950,
  fontFamily: "inherit",
  textAlign: "left",
  cursor: "pointer",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  ...safeTextStyle,
};

const desktopExplorarHeaderFilterButtonStyle: CSSProperties = {
  ...explorarHeaderFilterButtonStyle,
  minHeight: "40px",
  maxWidth: "calc(100% - 52px)",
  fontSize: "17px",
};

const explorarHeaderFilterIconStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  flex: "0 0 auto",
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
  flex: "0 0 auto",
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

const soonTitleButtonStyle: CSSProperties = {
  ...soonTopButtonStyle,
  justifySelf: "center",
  minHeight: "36px",
  padding: "0 16px",
  fontSize: "12px",
};

const desktopSoonTitleButtonStyle: CSSProperties = {
  ...desktopSoonTopButtonStyle,
  justifySelf: "center",
  minHeight: "40px",
  padding: "0 22px",
  fontSize: "13px",
};

const heroStyle: CSSProperties = {
  position: "relative",
  borderRadius: "30px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "linear-gradient(135deg, #070212 0%, #04000A 58%, #020006 100%)",
  padding: "18px",
  boxShadow: "none",
  minWidth: 0,
  overflow: "hidden",
};

const mobileHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "28px",
};

const badgeStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "fit-content",
  maxWidth: "100%",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#DDD6FE",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.10em",
  boxShadow: "none",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const desktopBadgeStyle: CSSProperties = {
  ...badgeStyle,
  padding: "9px 13px",
  fontSize: "11px",
};

const heroDecorationLayerStyle: CSSProperties = {
  display: "none",
};

const titleStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: "12px 0 0",
  color: "var(--historietas-accent, #F97316)",
  fontSize: "32px",
  lineHeight: 0.98,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  textAlign: "center",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: "10px auto 0",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  lineHeight: 1.55,
  fontWeight: 720,
  textAlign: "center",
  maxWidth: "680px",
  ...safeTextStyle,
};

const categoriesStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  overflowX: "auto",
  overflowY: "hidden",
  marginLeft: "-12px",
  marginRight: "-12px",
  padding: "2px 12px 5px",
  maxWidth: "calc(100% + 24px)",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  boxSizing: "border-box",
  scrollSnapType: "x proximity",
};

const categoryStyle: CSSProperties = {
  flex: "0 0 auto",
  maxWidth: "220px",
  padding: "9px 13px",
  borderRadius: "999px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxShadow: "none",
  ...safeTextStyle,
};

const activeCategoryStyle: CSSProperties = {
  ...categoryStyle,
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  boxShadow: "none",
};

const loginNoticeStyle: CSSProperties = {
  display: "block",
  margin: "-2px auto 0",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11.5px",
  fontWeight: 850,
  lineHeight: 1.35,
  textAlign: "center",
  ...safeTextStyle,
};

const searchBoxStyle: CSSProperties = {
  marginTop: "10px",
  display: "grid",
  gap: "5px",
  padding: "10px",
  borderRadius: "20px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  minWidth: 0,
  overflow: "hidden",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  height: "44px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#04000A",
  color: "#FFFFFF",
  padding: "0 16px",
  outline: "none",
  fontSize: "14px",
  fontWeight: 720,
  textAlign: "center",
  boxSizing: "border-box",
  boxShadow: "none",
  minWidth: 0,
};

const desktopSearchInputStyle: CSSProperties = {
  ...searchInputStyle,
  textAlign: "left",
};





const explorarModalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 80,
  background: "rgba(0,0,0,0.62)",
  display: "block",
  padding: "0 10px",
  boxSizing: "border-box",
  overflow: "hidden",
  overscrollBehavior: "contain",
};

const explorarModalSheetStyle: CSSProperties = {
  position: "fixed",
  left: "10px",
  right: "10px",
  bottom: 0,
  width: "auto",
  maxWidth: "720px",
  maxHeight: "min(620px, calc(100dvh - 112px))",
  margin: "0 auto",
  overflowY: "auto",
  background: "#151A1B",
  border: "1px solid rgba(255,255,255,0.08)",
  borderBottom: "0",
  borderRadius: "28px 28px 0 0",
  boxShadow: "none",
  padding: "12px 0 112px",
  boxSizing: "border-box",
  overscrollBehavior: "contain",
};

const desktopExplorarModalSheetStyle: CSSProperties = {
  ...explorarModalSheetStyle,
  left: "50%",
  right: "auto",
  bottom: "24px",
  width: "min(560px, calc(100vw - 24px))",
  maxWidth: "560px",
  maxHeight: "82vh",
  transform: "translateX(-50%)",
  borderRadius: "28px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  margin: 0,
  paddingBottom: "18px",
};

const explorarModalHandleStyle: CSSProperties = {
  display: "block",
  width: "74px",
  height: "6px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.58)",
  margin: "0 auto 14px",
};

const explorarModalTitleStyle: CSSProperties = {
  margin: "0 24px 16px",
  color: "#FFFFFF",
  fontSize: "23px",
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.04em",
  ...safeTextStyle,
};

const explorarModalContentStyle: CSSProperties = {
  display: "grid",
  gap: 0,
};

const explorarModalSectionLabelStyle: CSSProperties = {
  margin: "0",
  padding: "12px 28px 8px",
  borderTop: "1px solid rgba(255,255,255,0.055)",
  color: "rgba(255,255,255,0.58)",
  fontSize: "12px",
  fontWeight: 950,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

function criarExplorarModalOptionStyle(ativo: boolean): CSSProperties {
  return {
    appearance: "none",
    width: "100%",
    minHeight: "56px",
    border: "0",
    borderTop: "1px solid rgba(255,255,255,0.055)",
    background: ativo ? "rgba(255,255,255,0.035)" : "transparent",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    padding: "0 28px",
    boxSizing: "border-box",
    fontSize: "20px",
    fontWeight: 950,
    fontFamily: "inherit",
    cursor: "pointer",
    textAlign: "left",
    ...safeTextStyle,
  };
}

function criarExplorarModalRadioStyle(ativo: boolean): CSSProperties {
  return {
    width: "32px",
    height: "32px",
    borderRadius: "999px",
    border: ativo
      ? "9px solid #FFFFFF"
      : "5px solid rgba(255,255,255,0.40)",
    boxSizing: "border-box",
    flex: "0 0 auto",
  };
}

const explorarModalClearDividerStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: "1px",
  background: "rgba(255,255,255,0.07)",
};

const explorarModalClearButtonStyle: CSSProperties = {
  appearance: "none",
  minHeight: "52px",
  margin: "12px 28px 10px",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.055)",
  color: "#FFFFFF",
  fontSize: "20px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  ...safeTextStyle,
};


const sectionStyle: CSSProperties = {
  marginTop: "30px",
  minWidth: 0,
};

const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "7px",
  marginBottom: "15px",
  minWidth: 0,
  textAlign: "center",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "clamp(28px, 7vw, 38px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.065em",
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "14px",
  minWidth: 0,
};

const publishedCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(88px, 98px) minmax(0, 1fr)",
  gap: "14px",
  alignItems: "stretch",
  padding: "11px",
  borderRadius: "22px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
  boxShadow: "none",
};



const publishedCoverStyle: CSSProperties = {
  minHeight: "122px",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  backgroundImage: "linear-gradient(135deg, #08030F 0%, #04000A 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  minWidth: 0,
  textDecoration: "none",
  display: "block",
  boxSizing: "border-box",
};





const cardTopStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};


const publishedTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "20px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const statusRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "5px",
  minWidth: 0,
};




const draftStatusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#D4D4D8",
  fontSize: "9px",
  fontWeight: 880,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const formatBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #E4E4E7)",
  fontSize: "9px",
  fontWeight: 880,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const classificationBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "9px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const fileStatusBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#DDD6FE",
  fontSize: "9px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const favoriteBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#DDD6FE",
  fontSize: "9px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const completedBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(34, 197, 94, 0.22)",
  color: "#86EFAC",
  fontSize: "9px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};


const authorLinkStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  margin: 0,
  color: "var(--historietas-text-secondary, #D8C8FF)",
  fontSize: "12px",
  fontWeight: 820,
  textDecoration: "none",
  borderBottom: "0",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const publishedInfoStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  display: "grid",
  alignContent: "center",
  gap: "8px",
};

const desktopPublishedInfoStyle: CSSProperties = {
  ...publishedInfoStyle,
  alignContent: "space-between",
  alignItems: "start",
  gap: "7px",
};

const desktopPublishedSynopsisStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #C9C0D8)",
  fontSize: "12.5px",
  lineHeight: 1.45,
  fontWeight: 680,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  maxWidth: "100%",
  ...safeTextStyle,
};

const statsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.2,
  minWidth: 0,
};

const metricItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  whiteSpace: "nowrap",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  ...safeTextStyle,
};

const metricIconStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  lineHeight: 1,
};

const heartMetricIconStyle: CSSProperties = {
  ...metricIconStyle,
  color: "#BE123C",
};

const progressCompactStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
};

const progressTrackStyle: CSSProperties = {
  width: "100%",
  height: "7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
};

const progressBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, #F97316 0%, #7C3AED 100%)",
};

const progressTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

const readStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  minHeight: "34px",
  marginTop: "2px",
  padding: "0 14px",
  borderRadius: "999px",
  background: "#08030F",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1.15,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  boxShadow: "none",
  ...safeTextStyle,
};


const cardActionRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "4px",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
  boxSizing: "border-box",
};

const cardGenreBadgeStyle: CSSProperties = {
  flex: "0 1 42%",
  maxWidth: "42%",
  minHeight: "34px",
  padding: "0 10px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: 1.12,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  boxSizing: "border-box",
};

const cardPrimaryActionStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  marginTop: 0,
  padding: "0 12px",
};

const desktopCardActionRowStyle: CSSProperties = {
  ...cardActionRowStyle,
  overflow: "visible",
};

const desktopCardGenreBadgeStyle: CSSProperties = {
  ...cardGenreBadgeStyle,
  maxWidth: "46%",
};

const desktopCardPrimaryActionStyle: CSSProperties = {
  ...cardPrimaryActionStyle,
  justifyContent: "center",
  textAlign: "center",
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1220px, calc(100% - 64px))",
  padding: "12px 0 40px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "16px",
};

const desktopTopActionsStyle: CSSProperties = {
  ...topActionsStyle,
  gap: "10px",
};

const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  padding: "20px 28px",
  borderRadius: "32px",
  minHeight: "138px",
  display: "grid",
  alignContent: "center",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  margin: "0 auto",
  fontSize: "clamp(46px, 4.7vw, 72px)",
  lineHeight: 0.94,
  maxWidth: "760px",
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  margin: "10px auto 0",
  fontSize: "15px",
  lineHeight: 1.62,
  maxWidth: "680px",
};

const desktopCategoriesStyle: CSSProperties = {
  ...categoriesStyle,
  flexWrap: "wrap",
  overflowX: "visible",
  justifyContent: "center",
  marginLeft: 0,
  marginRight: 0,
  padding: "3px 0 8px",
  maxWidth: "100%",
};

const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  marginTop: "30px",
};

const desktopSectionHeaderStyle: CSSProperties = {
  ...sectionHeaderStyle,
  gridTemplateColumns: "minmax(0, 1fr)",
  alignItems: "center",
  justifyItems: "center",
  gap: "6px",
  marginBottom: "12px",
};

const desktopSectionTitleStyle: CSSProperties = {
  ...sectionTitleStyle,
  fontSize: "34px",
};


const desktopPublishedGridStyle: CSSProperties = {
  ...gridStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  justifyContent: "stretch",
  alignItems: "stretch",
  gap: "16px",
};

const desktopPublishedCardStyle: CSSProperties = {
  ...publishedCardStyle,
  gridTemplateColumns: "126px minmax(0, 1fr)",
  gap: "17px",
  padding: "14px",
  borderRadius: "24px",
  alignItems: "stretch",
  minHeight: "178px",
  background: "rgba(4, 0, 10, 0.72)",
  boxShadow: "none",
};


const desktopPublishedCoverStyle: CSSProperties = {
  ...publishedCoverStyle,
  minHeight: "150px",
  borderRadius: "18px",
};



const desktopPublishedTitleStyle: CSSProperties = {
  ...publishedTitleStyle,
  fontSize: "22px",
  lineHeight: 1.08,
  letterSpacing: "-0.03em",
};


const emptyMessageStyle: CSSProperties = {
  margin: "22px 0 34px",
  padding: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  lineHeight: 1.55,
  fontWeight: 850,
  textAlign: "center",
  background: "transparent",
  border: "none",
  boxShadow: "none",
  ...safeTextStyle,
};

const desktopEmptyMessageStyle: CSSProperties = {
  ...emptyMessageStyle,
  margin: "28px 0 44px",
  fontSize: "15px",
};