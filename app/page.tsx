"use client";

import Link from "next/link";
import { Children, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { obras } from "./data/obras";
import type { Obra } from "./data/obras";
import { supabase } from "../lib/supabase/client";

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

type ObraLocal = {
  id: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  arquivoObra?: unknown;
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
  texto: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

type PerfilAutorSalvo = {
  avatar: string;
  avatarNome: string;
  bio: string;
};

type PerfisAutoresSalvos = Record<string, PerfilAutorSalvo>;

type AutorHome = {
  chave: string;
  nome: string;
  avatar: string;
  bio: string;
  totalObras: number;
  totalCapitulos: number;
  totalCurtidas: number;
  totalComentarios: number;
  generos: string[];
  href: string;
};

type TemaVisualHome =
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
  | "comedia";

type TemaVisualHomeConfig = {
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

const TEMAS_VISUAIS_HOME: Record<TemaVisualHome, TemaVisualHomeConfig> = {
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
    bgStart: "#0B0614",
    bgMid: "#12081F",
    bgEnd: "#17101B",
    glowPrimary: "rgba(124,58,237,0.32)",
    glowSecondary: "rgba(249,115,22,0.16)",
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
    accent: "#FBBF24",
    secondary: "#B45309",
    bgStart: "#100B06",
    bgMid: "#181020",
    bgEnd: "#17101F",
    glowPrimary: "rgba(251,191,36,0.24)",
    glowSecondary: "rgba(180,83,9,0.20)",
    titleTo: "#FDE68A",
    activeSurface: "rgba(251,191,36,0.16)",
    secondarySurface: "rgba(180,83,9,0.18)",
    secondaryButtonText: "#FEF3C7",
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
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const NOTIFICATIONS_STORAGE_KEY = "historietas-notificacoes";
const AUTHOR_PROFILE_STORAGE_KEY = "historietas-perfis-autores";
const THEME_STORAGE_KEY = "historietas-tema-visual";

const OBRAS_HERO_COMPLEMENTARES = [
  {
    titulo: "Aurora de Cinzas",
    autor: "Historietas Studio",
    genero: "Fantasia",
    classificacaoIndicativa: "14+",
    sinopse:
      "Depois da queda de uma antiga ordem mágica, uma jovem guardiã atravessa reinos em ruínas para impedir que uma chama proibida acorde outra guerra.",
    status: "Em breve",
    views: "4.8K",
    likes: "920",
    comentarios: "118",
    disponivel: false,
  },
  {
    titulo: "Marés do Abismo",
    autor: "Historietas Studio",
    genero: "Mistério",
    classificacaoIndicativa: "16+",
    sinopse:
      "Em uma cidade costeira cercada por desaparecimentos, um investigador encontra mensagens vindas do fundo do mar e descobre uma verdade enterrada há décadas.",
    status: "Em breve",
    views: "3.6K",
    likes: "740",
    comentarios: "96",
    disponivel: false,
  },
] as unknown as Obra[];

function obterTemaVisualHomeSeguro(valor: unknown): TemaVisualHome {
  if (typeof valor === "string" && valor in TEMAS_VISUAIS_HOME) {
    return valor as TemaVisualHome;
  }

  return "original";
}

function carregarTemaVisualHomeSalvo() {
  try {
    const texto = localStorage.getItem(THEME_STORAGE_KEY);

    if (!texto) {
      return "original";
    }

    try {
      return obterTemaVisualHomeSeguro(JSON.parse(texto));
    } catch {
      return obterTemaVisualHomeSeguro(texto);
    }
  } catch {
    return "original";
  }
}

function aplicarTemaVisualHome(temaVisual: TemaVisualHome) {
  if (typeof document === "undefined") {
    return;
  }

  const tema = TEMAS_VISUAIS_HOME[temaVisual];
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

function normalizarTexto(texto: string) {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function criarSlugBase(titulo: string) {
  const slug = normalizarTexto(titulo)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "obra";
}

function criarHrefObraCatalogoHome(obra: Obra) {
  if (!obra.disponivel) {
    return `/em-breve?obra=${encodeURIComponent(obra.titulo)}`;
  }

  const obraComLink = obra as Obra & { link?: string; slug?: string };
  const linkObra = obraComLink.link?.trim();

  if (linkObra) {
    return linkObra;
  }

  const slugObra = obraComLink.slug?.trim() || criarSlugBase(obra.titulo);

  return `/obra/${slugObra}`;
}

function criarObraHeroLocalHome(obra: ObraLocal): Obra {
  const totalCurtidas = contarCurtidasObraLocal(obra);
  const totalComentarios = contarComentariosObraLocal(obra);
  const visualizacoesEstimadas = Math.max(
    obra.capitulos.length * 120 + totalCurtidas * 18 + totalComentarios * 10,
    120
  );

  return {
    id: obra.id,
    titulo: obra.titulo,
    autor: obra.autor,
    genero: obra.genero,
    classificacaoIndicativa: obra.classificacaoIndicativa,
    sinopse: obra.sinopse || "Nenhuma sinopse informada.",
    status: obra.capitulos.length > 0 ? "Em andamento" : "Publicado",
    views:
      visualizacoesEstimadas >= 1000
        ? `${(visualizacoesEstimadas / 1000).toFixed(1)}K`
        : String(visualizacoesEstimadas),
    likes: String(totalCurtidas),
    comentarios: String(totalComentarios),
    disponivel: true,
    capa: obra.capa,
    capaUrl: obra.capa,
    slug: obra.slug,
    link: obra.link,
  } as Obra & {
    id?: string;
    capa?: string;
    capaUrl?: string;
    slug?: string;
    link?: string;
  };
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

function obraLocalCombinaBusca(obra: ObraLocal, termoBusca: string) {
  if (!termoBusca) {
    return true;
  }

  const textoObra = normalizarTexto(
    [
      obra.titulo,
      obra.autor,
      obra.genero,
      obra.formato,
      obra.classificacaoIndicativa,
      obra.sinopse,
      obra.tags.join(" "),
      obra.capaNome,
      obra.capitulos.map((capitulo) => capitulo.titulo).join(" "),
    ].join(" ")
  );

  return textoObra.includes(termoBusca);
}

function obterTempoUltimaLeitura(obra: ObraLocal) {
  const capituloParaContinuar = encontrarCapituloParaContinuar(obra);
  const dataReferencia =
    obra.ultimaLeituraEm ||
    capituloParaContinuar?.lidoEm ||
    capituloParaContinuar?.criadoEm ||
    obra.criadaEm;

  const tempo = new Date(dataReferencia).getTime();

  return Number.isNaN(tempo) ? 0 : tempo;
}

function contarNotificacoesNaoLidas() {
  try {
    const notificacoesTexto = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notificacoesJson = notificacoesTexto
      ? JSON.parse(notificacoesTexto)
      : [];

    if (!Array.isArray(notificacoesJson)) {
      return 0;
    }

    return notificacoesJson.filter((notificacao) => {
      return notificacao && typeof notificacao === "object" && !notificacao.lida;
    }).length;
  } catch {
    return 0;
  }
}

function criarCoverStyle(capa: string): CSSProperties {
  if (!capa) {
    return coverPlaceholderStyle;
  }

  return {
    ...coverPlaceholderStyle,
    backgroundImage: `linear-gradient(180deg, rgba(15, 8, 32, 0.04) 0%, rgba(15, 8, 32, 0.82) 100%), url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarMobileCoverStyle(capa: string): CSSProperties {
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

function obterImagemObraCatalogo(obra: Obra) {
  const obraComImagem = obra as Obra & {
    capa?: string;
    capaUrl?: string;
    cover?: string;
    imagem?: string;
  };

  return (
    [
      obraComImagem.capa,
      obraComImagem.capaUrl,
      obraComImagem.cover,
      obraComImagem.imagem,
    ].find((imagem): imagem is string => {
      return typeof imagem === "string" && Boolean(imagem.trim());
    }) || ""
  );
}

function obterFormatoObraCatalogoHome(obra: Obra) {
  const obraComFormato = obra as Obra & {
    formato?: string;
  };

  return obraComFormato.formato?.trim() || "História";
}

function criarMobileCoverThumbStyle(obra: Obra): CSSProperties {
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

function formatarContadorHeroHome(valor: string | number | undefined) {
  const textoOriginal = String(valor ?? "").trim();

  if (!textoOriginal) {
    return "0";
  }

  const textoNormalizado = textoOriginal.replace(",", ".").toUpperCase();
  const contadorCompacto = textoNormalizado.match(/^(\d+(?:\.\d+)?)([KM])$/);

  if (contadorCompacto) {
    const numero = Number(contadorCompacto[1]);
    const sufixo = contadorCompacto[2];

    if (!Number.isFinite(numero)) {
      return textoOriginal;
    }

    const numeroFormatado = Number.isInteger(numero)
      ? String(numero)
      : numero.toFixed(1).replace(/\.0$/, "");

    return `${numeroFormatado}${sufixo}`;
  }

  const apenasNumero = Number(textoNormalizado.replace(/[^0-9.]/g, ""));

  if (!Number.isFinite(apenasNumero)) {
    return textoOriginal;
  }

  if (apenasNumero >= 1000000) {
    return `${(apenasNumero / 1000000)
      .toFixed(apenasNumero >= 10000000 ? 0 : 1)
      .replace(/\.0$/, "")}M`;
  }

  if (apenasNumero >= 1000) {
    return `${(apenasNumero / 1000)
      .toFixed(apenasNumero >= 10000 ? 0 : 1)
      .replace(/\.0$/, "")}K`;
  }

  return String(Math.round(apenasNumero));
}

function formatarSinopseHeroMobile(sinopse: string | undefined) {
  const textoBase = String(sinopse || "Nenhuma sinopse informada.")
    .replace(/\s+/g, " ")
    .trim();

  if (!textoBase) {
    return "Nenhuma sinopse informada.";
  }

  const textoComPalavrasSeguras = textoBase
    .split(" ")
    .map((palavra) => {
      if (palavra.length <= 18) {
        return palavra;
      }

      return `${palavra.slice(0, 16)}…`;
    })
    .join(" ");

  if (textoComPalavrasSeguras.length <= 132) {
    return textoComPalavrasSeguras;
  }

  return `${textoComPalavrasSeguras.slice(0, 129).trim()}…`;
}

function obterIdentificadorFavoritoHome(obra: Obra) {
  const obraComIdentificador = obra as Obra & {
    id?: string;
    slug?: string;
  };

  return (
    obraComIdentificador.id?.trim() ||
    obraComIdentificador.slug?.trim() ||
    criarSlugBase(obra.titulo)
  );
}

function criarHeroPosterStyle(obra: Obra): CSSProperties {
  const imagemObra = obterImagemObraCatalogo(obra);

  if (imagemObra) {
    return {
      ...desktopHeroPosterStyle,
      backgroundImage: `linear-gradient(180deg, rgba(8, 5, 18, 0.04) 0%, rgba(8, 5, 18, 0.58) 100%), url(${imagemObra})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  return {
    ...desktopHeroPosterStyle,
    backgroundImage:
      "radial-gradient(circle at 28% 18%, color-mix(in srgb, var(--historietas-accent, #F97316) 36%, transparent), transparent 30%), radial-gradient(circle at 74% 76%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 58%, transparent), transparent 38%), linear-gradient(145deg, var(--historietas-surface, rgba(17,10,34,0.98)) 0%, var(--historietas-surface-strong, rgba(7,6,16,0.99)) 100%)",
  };
}

function criarHeroBackground(obra: Obra, usarImagemObra = false): CSSProperties {
  if (usarImagemObra) {
    const imagemObra = obterImagemObraCatalogo(obra);

    if (imagemObra) {
      return {
        ...heroStyle,
        backgroundImage: `url(${imagemObra})`,
        backgroundSize: "cover",
        backgroundPosition: obra.disponivel ? "center" : "center top",
      };
    }
  }

  return {
    ...heroStyle,
    backgroundImage: `linear-gradient(90deg, rgba(8, 5, 18, 0.96) 0%, rgba(8, 5, 18, 0.82) 46%, rgba(8, 5, 18, 0.52) 100%), radial-gradient(circle at 82% 26%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)), transparent 24%), radial-gradient(circle at 20% 20%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 48%, transparent)), transparent 34%), radial-gradient(circle at 64% 96%, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent), transparent 24%), linear-gradient(135deg, var(--historietas-surface, #160A2A) 0%, var(--historietas-surface-strong, #090711) 58%, var(--historietas-bg-end, #17101B) 100%)`,
    backgroundSize: "cover",
    backgroundPosition: obra.disponivel ? "center" : "center top",
  };
}

function criarMobileHeroFrameBackground(_obra: Obra): CSSProperties {
  return {
    ...heroStyle,
    backgroundColor: "var(--historietas-surface-strong, #1A0F22)",
    backgroundImage:
      "linear-gradient(145deg, var(--historietas-surface, #1D1028) 0%, var(--historietas-surface-strong, #211327) 52%, var(--historietas-bg-end, #24151F) 100%)",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarMobileHeroImageLayerStyle(obra: Obra): CSSProperties {
  const imagemObra = obterImagemObraCatalogo(obra);
  const imagemOuFallback = imagemObra
    ? `url(${imagemObra})`
    : "radial-gradient(circle at 28% 18%, color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent), transparent 30%), radial-gradient(circle at 74% 76%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 48%, transparent), transparent 38%), linear-gradient(145deg, rgba(17, 10, 34, 0.98) 0%, rgba(7, 6, 16, 0.99) 100%)";

  return {
    position: "absolute",
    zIndex: 0,
    inset: "5px",
    borderRadius: "24px",
    backgroundImage: imagemOuFallback,
    backgroundSize: "cover",
    backgroundPosition: obra.disponivel ? "center" : "center top",
    pointerEvents: "none",
  };
}

function criarDecoracaoHomeStyle(index: number): CSSProperties {
  const posicoes: CSSProperties[] = [
    { top: "7%", right: "8%", fontSize: "48px", transform: "rotate(-12deg)" },
    { top: "34%", right: "15%", fontSize: "26px", transform: "rotate(14deg)" },
    { bottom: "13%", right: "8%", fontSize: "36px", transform: "rotate(8deg)" },
    { top: "18%", left: "8%", fontSize: "24px", transform: "rotate(12deg)" },
  ];

  return {
    position: "absolute",
    color: "var(--historietas-accent, #FDBA74)",
    opacity: 0.08,
    lineHeight: 1,
    fontWeight: 950,
    filter:
      "drop-shadow(0 0 20px color-mix(in srgb, var(--historietas-accent, #F97316) 26%, transparent))",
    userSelect: "none",
    ...posicoes[index % posicoes.length],
  };
}

function contarCurtidasObraLocal(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.curtiu).length;
}

function contarComentariosObraLocal(obra: ObraLocal) {
  return obra.capitulos.filter((capitulo) => capitulo.comentario.trim()).length;
}

function obterTempoUltimoCapitulo(obra: ObraLocal) {
  const ultimoCapitulo = obra.capitulos[obra.capitulos.length - 1] || null;
  const dataReferencia = ultimoCapitulo?.criadoEm || obra.criadaEm;
  const tempo = new Date(dataReferencia).getTime();

  return Number.isNaN(tempo) ? 0 : tempo;
}

function obraTemArquivoAnexado(obra: ObraLocal) {
  const arquivo = obra.arquivoObra;

  if (!arquivo || typeof arquivo !== "object" || Array.isArray(arquivo)) {
    return false;
  }

  const arquivoValidado = arquivo as Record<string, unknown>;

  return Boolean(
    typeof arquivoValidado.nome === "string" &&
      arquivoValidado.nome.trim() &&
      typeof arquivoValidado.conteudo === "string" &&
      arquivoValidado.conteudo.trim()
  );
}

function obraCatalogoCombinaTemas(obra: Obra, temas: string[]) {
  const textoObra = normalizarTexto(
    [obra.titulo, obra.autor, obra.genero, obra.status].join(" ")
  );

  return temas.some((tema) => textoObra.includes(normalizarTexto(tema)));
}

function normalizarChaveAutor(nome: string) {
  return normalizarTexto(nome).replace(/\s+/g, " ").trim();
}

function criarIniciaisAutor(nome: string) {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) {
    return "H";
  }

  return partes
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

function normalizarPerfilAutorSalvo(valor: unknown): PerfilAutorSalvo | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return null;
  }

  const perfil = valor as Record<string, unknown>;

  return {
    avatar: typeof perfil.avatar === "string" ? perfil.avatar : "",
    avatarNome: typeof perfil.avatarNome === "string" ? perfil.avatarNome : "",
    bio: typeof perfil.bio === "string" ? perfil.bio : "",
  };
}

function normalizarPerfisAutoresSalvos(valor: unknown): PerfisAutoresSalvos {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return {};
  }

  const perfis = valor as Record<string, unknown>;

  return Object.entries(perfis).reduce<PerfisAutoresSalvos>(
    (perfisNormalizados, [chave, perfil]) => {
      const perfilNormalizado = normalizarPerfilAutorSalvo(perfil);

      if (perfilNormalizado) {
        perfisNormalizados[chave] = perfilNormalizado;
      }

      return perfisNormalizados;
    },
    {}
  );
}

function encontrarPerfilAutor(
  perfisAutores: PerfisAutoresSalvos,
  nomeAutor: string
) {
  const chaveNormalizada = normalizarChaveAutor(nomeAutor);
  const chaveSimples = nomeAutor.trim().replace(/\s+/g, " ").toLowerCase();

  return (
    perfisAutores[chaveNormalizada] ||
    perfisAutores[chaveSimples] ||
    perfisAutores[nomeAutor] ||
    Object.entries(perfisAutores).find(([chave]) => {
      return normalizarChaveAutor(chave) === chaveNormalizada;
    })?.[1] ||
    null
  );
}

function criarBioAutorPadrao(nomeAutor: string, generos: string[]) {
  const generoPrincipal = generos[0] || "histórias";

  return `Autor de ${generoPrincipal.toLowerCase()} na Historietas.`;
}

function criarAutorHome(
  nomeAutor: string,
  generos: string[],
  totalObras: number,
  totalCapitulos: number,
  totalCurtidas: number,
  totalComentarios: number,
  perfisAutores: PerfisAutoresSalvos
): AutorHome {
  const perfil = encontrarPerfilAutor(perfisAutores, nomeAutor);
  const generosUnicos = Array.from(
    new Set(
      generos
        .filter((genero) => Boolean(genero.trim()))
        .map((genero) => genero.trim())
    )
  );
  const bioPerfil = perfil?.bio.trim() || "";

  return {
    chave: normalizarChaveAutor(nomeAutor),
    nome: nomeAutor.trim() || "Autor não informado",
    avatar: perfil?.avatar.trim() || "",
    bio: bioPerfil || criarBioAutorPadrao(nomeAutor, generosUnicos),
    totalObras,
    totalCapitulos,
    totalCurtidas,
    totalComentarios,
    generos: generosUnicos.slice(0, 2),
    href: `/perfil-autor?autor=${encodeURIComponent(nomeAutor)}`,
  };
}

function normalizarCapituloHome(
  capitulo: Partial<CapituloLocal>,
  index: number
): CapituloLocal {
  return {
    id:
      typeof capitulo.id === "string" && capitulo.id.trim()
        ? capitulo.id
        : `capitulo-${index + 1}`,
    titulo:
      typeof capitulo.titulo === "string" && capitulo.titulo.trim()
        ? capitulo.titulo
        : "Capítulo sem título",
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

function normalizarObraHome(
  obra: Partial<ObraLocal> & Record<string, unknown>,
  index: number
): ObraLocal {
  const capitulosNormalizados: CapituloLocal[] = Array.isArray(obra.capitulos)
    ? obra.capitulos.map((capitulo, capituloIndex) =>
        normalizarCapituloHome(
          capitulo as Partial<CapituloLocal>,
          capituloIndex
        )
      )
    : [];

  const titulo =
    typeof obra.titulo === "string" && obra.titulo.trim()
      ? obra.titulo.trim()
      : "Obra sem título";

  const slug =
    typeof obra.slug === "string" && obra.slug.trim()
      ? obra.slug.trim()
      : criarSlugBase(titulo || `obra-${index + 1}`);

  const tagsNormalizadas = Array.isArray(obra.tags)
    ? obra.tags
        .filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
        .map((tag) => tag.trim())
    : [];

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
    arquivoObra: obra.arquivoObra,
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
        ? obra.link.trim()
        : `/obra/${slug}`,
  };
}

function normalizarObrasHomeSalvas(valor: unknown) {
  return Array.isArray(valor)
    ? valor.map((obra, index) =>
        normalizarObraHome(
          obra as Partial<ObraLocal> & Record<string, unknown>,
          index
        )
      )
    : [];
}

function normalizarCategoriaArquivoHome(categoria: string | null) {
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

function criarArquivoObraSupabaseHome(
  obra: SupabaseObraRow,
  obraLocal: ObraLocal | undefined
) {
  const arquivoUrl = obra.arquivo_url?.trim() || "";

  if (!arquivoUrl) {
    return obraLocal?.arquivoObra || null;
  }

  const categoriaArquivo = normalizarCategoriaArquivoHome(
    obra.arquivo_categoria
  );
  const tipoArquivo =
    obra.arquivo_tipo?.trim() ||
    (categoriaArquivo === "documento"
      ? "application/pdf"
      : categoriaArquivo === "imagem"
      ? "image/*"
      : categoriaArquivo === "texto"
      ? "text/plain"
      : "");

  return {
    nome: obra.arquivo_nome?.trim() || "Arquivo da obra",
    tipo: tipoArquivo,
    tamanho:
      typeof obra.arquivo_tamanho === "number" &&
      Number.isFinite(obra.arquivo_tamanho)
        ? obra.arquivo_tamanho
        : 0,
    conteudo: arquivoUrl,
    categoria: categoriaArquivo,
    criadoEm: obra.criada_em || "",
  };
}

function normalizarObraSupabaseHome(
  obra: SupabaseObraRow,
  capitulosSupabase: SupabaseCapituloRow[],
  obraLocal: ObraLocal | undefined,
  index: number
): ObraLocal {
  const capitulosLocaisPorId = new Map(
    (obraLocal?.capitulos || []).map((capitulo) => [capitulo.id, capitulo])
  );

  const capitulosOrdenados = [...capitulosSupabase].sort((capituloA, capituloB) => {
    return (capituloA.ordem ?? 0) - (capituloB.ordem ?? 0);
  });

  const capitulosRemotos = capitulosOrdenados.map((capitulo, capituloIndex) => {
    const capituloLocal = capitulosLocaisPorId.get(capitulo.id);

    return {
      id: capitulo.id,
      titulo:
        capitulo.titulo?.trim() ||
        capituloLocal?.titulo ||
        `Capítulo ${capituloIndex + 1}`,
      texto: capitulo.texto || capituloLocal?.texto || "",
      curtiu: Boolean(capituloLocal?.curtiu),
      salvo: Boolean(capituloLocal?.salvo),
      comentario: capituloLocal?.comentario || "",
      criadoEm: capitulo.criado_em || capituloLocal?.criadoEm || "",
      lido: Boolean(capituloLocal?.lido),
      lidoEm: capituloLocal?.lidoEm || "",
    } satisfies CapituloLocal;
  });

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

  return {
    id: obra.id || obraLocal?.id || `obra-${index + 1}`,
    titulo: tituloObra,
    autor: obra.autor?.trim() || obraLocal?.autor || "Autor não informado",
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
    arquivoObra: criarArquivoObraSupabaseHome(obra, obraLocal),
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

async function carregarObrasSupabaseHome(obrasLocais: ObraLocal[]) {
  try {
    const { data: obrasBanco, error: erroObras } = await supabase
      .from("obras")
      .select("*")
      .eq("publicado", true)
      .order("criada_em", { ascending: false });

    if (erroObras) {
      console.warn(
        "Não consegui carregar obras da Home no Supabase:",
        erroObras.message
      );
      return obrasLocais;
    }

    const obrasSupabase = (obrasBanco || []) as SupabaseObraRow[];

    if (obrasSupabase.length === 0) {
      return obrasLocais;
    }

    const obrasIds = obrasSupabase
      .map((obra) => obra.id)
      .filter((id): id is string => typeof id === "string" && Boolean(id.trim()));

    const capitulosPorObraId = new Map<string, SupabaseCapituloRow[]>();

    if (obrasIds.length > 0) {
      const { data: capitulosBanco, error: erroCapitulos } = await supabase
        .from("capitulos")
        .select("*")
        .in("obra_id", obrasIds)
        .order("ordem", { ascending: true });

      if (erroCapitulos) {
        console.warn(
          "Não consegui carregar capítulos da Home no Supabase:",
          erroCapitulos.message
        );
      } else {
        ((capitulosBanco || []) as SupabaseCapituloRow[]).forEach((capitulo) => {
          const capitulosDaObra = capitulosPorObraId.get(capitulo.obra_id) || [];
          capitulosDaObra.push(capitulo);
          capitulosPorObraId.set(capitulo.obra_id, capitulosDaObra);
        });
      }
    }

    const obrasRemotas = obrasSupabase.map((obra, index) => {
      const obraLocal = obrasLocais.find((obraLocalAtual) => {
        const slugLocal = obraLocalAtual.slug || criarSlugBase(obraLocalAtual.titulo);
        const slugBanco = obra.slug?.trim() || "";

        return obraLocalAtual.id === obra.id || (slugBanco && slugLocal === slugBanco);
      });

      return normalizarObraSupabaseHome(
        obra,
        capitulosPorObraId.get(obra.id) || [],
        obraLocal,
        index
      );
    });

    const idsRemotos = new Set(obrasRemotas.map((obra) => obra.id));
    const slugsRemotos = new Set(
      obrasRemotas.map((obra) => obra.slug || criarSlugBase(obra.titulo))
    );

    const obrasApenasLocais = obrasLocais.filter((obraLocalAtual) => {
      const slugLocal = obraLocalAtual.slug || criarSlugBase(obraLocalAtual.titulo);

      return !idsRemotos.has(obraLocalAtual.id) && !slugsRemotos.has(slugLocal);
    });

    const obrasAtualizadas = [...obrasRemotas, ...obrasApenasLocais];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasAtualizadas));

    return obrasAtualizadas;
  } catch (error) {
    console.warn("Não consegui acessar o Supabase na Home:", error);
    return obrasLocais;
  }
}

export default function Home() {
  const [busca, setBusca] = useState("");
  const [obrasLocais, setObrasLocais] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [perfisAutores, setPerfisAutores] = useState<PerfisAutoresSalvos>({});
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);
  const [buscaMobileAberta, setBuscaMobileAberta] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    aplicarTemaVisualHome(carregarTemaVisualHomeSalvo());
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
    let cancelado = false;

    async function carregarDadosHome() {
      try {
        const obrasSalvasTexto = localStorage.getItem(STORAGE_KEY);
        const obrasSalvasJson = obrasSalvasTexto
          ? JSON.parse(obrasSalvasTexto)
          : [];

        const obrasNormalizadas = normalizarObrasHomeSalvas(obrasSalvasJson);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasNormalizadas));

        const obrasFavoritasTexto = localStorage.getItem(FAVORITES_STORAGE_KEY);
        const obrasFavoritasJson = obrasFavoritasTexto
          ? JSON.parse(obrasFavoritasTexto)
          : [];

        const obrasFavoritasNormalizadas: string[] = Array.isArray(
          obrasFavoritasJson
        )
          ? obrasFavoritasJson.filter(
              (id): id is string => typeof id === "string"
            )
          : [];

        const obrasConcluidasTexto = localStorage.getItem(COMPLETED_STORAGE_KEY);
        const obrasConcluidasJson = obrasConcluidasTexto
          ? JSON.parse(obrasConcluidasTexto)
          : [];

        const obrasConcluidasNormalizadas: string[] = Array.isArray(
          obrasConcluidasJson
        )
          ? obrasConcluidasJson.filter(
              (id): id is string => typeof id === "string"
            )
          : [];

        localStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(obrasFavoritasNormalizadas)
        );

        localStorage.setItem(
          COMPLETED_STORAGE_KEY,
          JSON.stringify(obrasConcluidasNormalizadas)
        );

        const perfisAutoresTexto = localStorage.getItem(AUTHOR_PROFILE_STORAGE_KEY);
        const perfisAutoresJson: unknown = perfisAutoresTexto
          ? JSON.parse(perfisAutoresTexto)
          : {};
        const perfisAutoresNormalizados = normalizarPerfisAutoresSalvos(
          perfisAutoresJson
        );

        if (!cancelado) {
          setObrasLocais(obrasNormalizadas);
          setObrasFavoritas(obrasFavoritasNormalizadas);
          setObrasConcluidas(obrasConcluidasNormalizadas);
          setPerfisAutores(perfisAutoresNormalizados);
          setNotificacoesNaoLidas(contarNotificacoesNaoLidas());
        }

        const obrasComSupabase = await carregarObrasSupabaseHome(
          obrasNormalizadas
        );

        if (!cancelado) {
          setObrasLocais(obrasComSupabase);
        }
      } catch {
        if (!cancelado) {
          setObrasLocais([]);
          setObrasFavoritas([]);
          setObrasConcluidas([]);
          setPerfisAutores({});
          setNotificacoesNaoLidas(0);
        }
      }
    }

    carregarDadosHome();

    return () => {
      cancelado = true;
    };
  }, []);

  const termoBusca = normalizarTexto(busca);

  const obrasPublicadas = useMemo(() => {
    return obrasLocais.filter((obra) => obra.publicado);
  }, [obrasLocais]);

  const obrasHero = useMemo(() => {
    const obrasLocaisParaHero = obrasPublicadas
      .filter((obra) => obraLocalCombinaBusca(obra, termoBusca))
      .slice(0, Math.max(0, 6 - obras.length))
      .map((obra) => criarObraHeroLocalHome(obra));
    const titulosUsados = new Set(
      [...obras, ...obrasLocaisParaHero].map((obra) => normalizarTexto(obra.titulo))
    );
    const obrasComplementares = OBRAS_HERO_COMPLEMENTARES.filter((obra) => {
      return !titulosUsados.has(normalizarTexto(obra.titulo));
    });

    return [...obras, ...obrasLocaisParaHero, ...obrasComplementares].slice(0, 6);
  }, [obrasPublicadas, termoBusca]);

  useEffect(() => {
    if (obrasHero.length === 0) {
      return;
    }

    setHeroIndex((indexAtual) =>
      indexAtual >= obrasHero.length ? 0 : indexAtual
    );
  }, [obrasHero.length]);

  useEffect(() => {
    if (obrasHero.length <= 1) {
      return;
    }

    const intervalo = window.setInterval(() => {
      setHeroIndex((indexAtual) => (indexAtual + 1) % obrasHero.length);
    }, 9000);

    return () => window.clearInterval(intervalo);
  }, [obrasHero.length]);

  const heroObra = obrasHero[heroIndex] || obrasHero[0] || obras[0];
  const heroObraHref = heroObra ? criarHrefObraCatalogoHome(heroObra) : "/explorar";
  const heroTemImagem = Boolean(heroObra && obterImagemObraCatalogo(heroObra));
  const heroFavoritoId = heroObra ? obterIdentificadorFavoritoHome(heroObra) : "";
  const heroEstaSalvo = Boolean(
    heroFavoritoId && obrasFavoritas.includes(heroFavoritoId)
  );

  function alternarHeroFavorito() {
    if (!heroFavoritoId) {
      return;
    }

    setObrasFavoritas((favoritosAtuais) => {
      const favoritosAtualizados = favoritosAtuais.includes(heroFavoritoId)
        ? favoritosAtuais.filter((obraId) => obraId !== heroFavoritoId)
        : [...favoritosAtuais, heroFavoritoId];

      localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(favoritosAtualizados)
      );

      return favoritosAtualizados;
    });
  }

  const obrasPublicadasFiltradas = useMemo(() => {
    return obrasPublicadas
      .filter((obra) => obraLocalCombinaBusca(obra, termoBusca))
      .sort((obraA, obraB) => {
        const dataA = new Date(obraA.criadaEm).getTime();
        const dataB = new Date(obraB.criadaEm).getTime();

        return (
          (Number.isNaN(dataB) ? 0 : dataB) -
          (Number.isNaN(dataA) ? 0 : dataA)
        );
      });
  }, [obrasPublicadas, termoBusca]);

  const obrasParaContinuar = useMemo(() => {
    return obrasPublicadas
      .filter((obra) => {
        return (
          Boolean(encontrarCapituloParaContinuar(obra)) &&
          obraLocalCombinaBusca(obra, termoBusca)
        );
      })
      .sort((obraA, obraB) => {
        return obterTempoUltimaLeitura(obraB) - obterTempoUltimaLeitura(obraA);
      })
      .slice(0, 5);
  }, [obrasPublicadas, termoBusca]);

  const resumoInicio = useMemo(() => {
    const totalCapitulosPublicados = obrasPublicadas.reduce((total, obra) => {
      return total + obra.capitulos.length;
    }, 0);

    const totalEmLeitura = obrasPublicadas.filter((obra) => {
      return Boolean(encontrarCapituloParaContinuar(obra));
    }).length;

    const totalFavoritas = obrasPublicadas.filter((obra) => {
      return obrasFavoritas.includes(obra.id);
    }).length;

    const totalConcluidas = obrasPublicadas.filter((obra) => {
      return obrasConcluidas.includes(obra.id);
    }).length;

    return {
      totalPublicadas: obrasPublicadas.length,
      totalCapitulosPublicados,
      totalEmLeitura,
      totalFavoritas,
      totalConcluidas,
    };
  }, [obrasPublicadas, obrasFavoritas, obrasConcluidas]);

  const obrasFiltradas = useMemo(() => {
    if (!termoBusca) {
      return obras;
    }

    return obras.filter((obra) => {
      const textoObra = normalizarTexto(
        [
          obra.titulo,
          obra.autor,
          obra.genero,
          obra.classificacaoIndicativa,
          obra.status,
        ].join(" ")
      );

      return textoObra.includes(termoBusca);
    });
  }, [termoBusca]);

  const obrasComNovosCapitulos = useMemo(() => {
    return obrasPublicadas
      .filter((obra) => obra.capitulos.length > 0 && obraLocalCombinaBusca(obra, termoBusca))
      .sort((obraA, obraB) => obterTempoUltimoCapitulo(obraB) - obterTempoUltimoCapitulo(obraA))
      .slice(0, 12);
  }, [obrasPublicadas, termoBusca]);

  const obrasMaisCurtidas = useMemo(() => {
    return obrasPublicadas
      .filter((obra) => contarCurtidasObraLocal(obra) > 0 && obraLocalCombinaBusca(obra, termoBusca))
      .sort((obraA, obraB) => contarCurtidasObraLocal(obraB) - contarCurtidasObraLocal(obraA))
      .slice(0, 12);
  }, [obrasPublicadas, termoBusca]);

  const obrasMaisComentadas = useMemo(() => {
    return obrasPublicadas
      .filter((obra) => contarComentariosObraLocal(obra) > 0 && obraLocalCombinaBusca(obra, termoBusca))
      .sort((obraA, obraB) => contarComentariosObraLocal(obraB) - contarComentariosObraLocal(obraA))
      .slice(0, 12);
  }, [obrasPublicadas, termoBusca]);

  const obrasComArquivoAnexado = useMemo(() => {
    return obrasPublicadas
      .filter((obra) => obraTemArquivoAnexado(obra) && obraLocalCombinaBusca(obra, termoBusca))
      .slice(0, 12);
  }, [obrasPublicadas, termoBusca]);

  const leiturasRapidas = useMemo(() => {
    return obrasPublicadas
      .filter((obra) => {
        return (
          obra.capitulos.length > 0 &&
          obra.capitulos.length <= 3 &&
          obraLocalCombinaBusca(obra, termoBusca)
        );
      })
      .sort((obraA, obraB) => obraA.capitulos.length - obraB.capitulos.length)
      .slice(0, 12);
  }, [obrasPublicadas, termoBusca]);

  const autoresParaConhecer = useMemo<AutorHome[]>(() => {
    const autoresMap = new Map<
      string,
      {
        nome: string;
        generos: string[];
        totalObras: number;
        totalCapitulos: number;
        totalCurtidas: number;
        totalComentarios: number;
      }
    >();

    function registrarAutor(
      nomeAutor: string,
      genero: string,
      capitulos = 0,
      curtidas = 0,
      comentarios = 0
    ) {
      const nomeLimpo = nomeAutor.trim() || "Autor não informado";
      const chave = normalizarChaveAutor(nomeLimpo);
      const autorRegistrado = autoresMap.get(chave);

      if (autorRegistrado) {
        autorRegistrado.totalObras += 1;
        autorRegistrado.totalCapitulos += capitulos;
        autorRegistrado.totalCurtidas += curtidas;
        autorRegistrado.totalComentarios += comentarios;

        if (genero.trim()) {
          autorRegistrado.generos.push(genero.trim());
        }

        return;
      }

      autoresMap.set(chave, {
        nome: nomeLimpo,
        generos: genero.trim() ? [genero.trim()] : [],
        totalObras: 1,
        totalCapitulos: capitulos,
        totalCurtidas: curtidas,
        totalComentarios: comentarios,
      });
    }

    obrasPublicadas
      .filter((obra) => obraLocalCombinaBusca(obra, termoBusca))
      .forEach((obra) => {
        registrarAutor(
          obra.autor,
          obra.genero,
          obra.capitulos.length,
          contarCurtidasObraLocal(obra),
          contarComentariosObraLocal(obra)
        );
      });

    obrasFiltradas.forEach((obra) => {
      registrarAutor(obra.autor, obra.genero);
    });

    return Array.from(autoresMap.values())
      .map((autor) =>
        criarAutorHome(
          autor.nome,
          autor.generos,
          autor.totalObras,
          autor.totalCapitulos,
          autor.totalCurtidas,
          autor.totalComentarios,
          perfisAutores
        )
      )
      .sort((autorA, autorB) => {
        return (
          autorB.totalObras - autorA.totalObras ||
          autorB.totalCapitulos - autorA.totalCapitulos ||
          autorA.nome.localeCompare(autorB.nome, "pt-BR")
        );
      })
      .slice(0, 12);
  }, [obrasPublicadas, obrasFiltradas, perfisAutores, termoBusca]);

  const obrasFantasiaPoderes = useMemo(() => {
    return obrasFiltradas.filter((obra) =>
      obraCatalogoCombinaTemas(obra, ["fantasia", "sobrenatural", "poder", "magia"])
    );
  }, [obrasFiltradas]);

  const obrasTerrorSuspense = useMemo(() => {
    return obrasFiltradas.filter((obra) =>
      obraCatalogoCombinaTemas(obra, ["terror", "suspense", "mistério", "sombrio"])
    );
  }, [obrasFiltradas]);

  const obrasRomanceDrama = useMemo(() => {
    return obrasFiltradas.filter((obra) =>
      obraCatalogoCombinaTemas(obra, ["romance", "drama", "emocional"])
    );
  }, [obrasFiltradas]);

  const obrasAcaoRivalidades = useMemo(() => {
    return obrasFiltradas.filter((obra) =>
      obraCatalogoCombinaTemas(obra, ["ação", "acao", "luta", "rivalidade", "guerra"])
    );
  }, [obrasFiltradas]);

  const obrasScifiCodigo = useMemo(() => {
    return obrasFiltradas.filter((obra) =>
      obraCatalogoCombinaTemas(obra, ["sci-fi", "scifi", "ficção", "futur", "código", "codigo"])
    );
  }, [obrasFiltradas]);

  const obrasEmBreve = useMemo(() => {
    return obrasFiltradas.filter((obra) => !obra.disponivel);
  }, [obrasFiltradas]);

  if (!heroObra) {
    return <main style={emptyPageStyle}>Nenhuma obra cadastrada.</main>;
  }

  return (
    <main style={pageStyle}>
      <style>{themePageCss}</style>

      <div style={pageDecorationLayerStyle} aria-hidden="true">
        {["✦", "◌", "✧"].map((decoracao, index) => (
          <span key={`${decoracao}-${index}`} style={criarDecoracaoHomeStyle(index)}>
            {decoracao}
          </span>
        ))}
      </div>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}

      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <header style={isDesktop ? desktopNavStyle : mobileNavStyle}>
        <div style={isDesktop ? desktopNavInnerStyle : navInnerStyle}>
          <div style={isDesktop ? desktopNavTopRowStyle : navTopRowStyle}>
            <Link href="/" style={logoStyle} aria-label="Historietas">
              <span style={logoMarkStyle}>H</span>
              <span className="historietas-home-logo-text" style={logoTextStyle}>istorietas</span>
            </Link>

            <div style={navIconsStyle}>
              {isDesktop && (
                <>
                  <Link href="/configuracoes" style={publishSmallButtonStyle}>
                    Configurações
                  </Link>

                  <Link
                    href="/notificacoes"
                    style={notificationDotStyle}
                    aria-label={
                      notificacoesNaoLidas > 0
                        ? `Notificações: ${notificacoesNaoLidas} novas`
                        : "Notificações"
                    }
                  >
                    N
                  </Link>
                </>
              )}

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
                  🔍
                </button>
              )}
            </div>
          </div>

          {isDesktop && (
            <nav style={desktopMenuStyle} aria-label="Navegação principal">
              <Link href="/" style={activeLinkStyle}>
                Início
              </Link>

              <Link href="/explorar" style={linkStyle}>
                Explorar
              </Link>

              <Link href="/em-alta" style={linkStyle}>
                Em Alta
              </Link>


              <Link href="/minhas-obras" style={linkStyle}>
                Minhas Obras
              </Link>

              <Link href="/biblioteca" style={linkStyle}>
                Biblioteca
              </Link>

              <Link href="/seguindo" style={linkStyle}>
                Seguindo
              </Link>

              <Link href="/painel-autor" style={linkStyle}>
                Painel do Autor
              </Link>

              <div style={desktopInlineSearchAreaStyle}>
                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar obras, autor, gênero..."
                  style={inputStyle}
                />
              </div>
            </nav>
          )}

          {!isDesktop && buscaMobileAberta && (
            <div style={searchAreaStyle}>
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar obras, autor, gênero..."
                style={inputStyle}
              />
            </div>
          )}
        </div>
      </header>

      <div style={isDesktop ? desktopContainerStyle : containerStyle}>
        <section
          style={
            isDesktop
              ? { ...criarHeroBackground(heroObra), ...desktopHeroStyle }
              : criarMobileHeroFrameBackground(heroObra)
          }
        >
          {!isDesktop && (
            <div style={criarMobileHeroImageLayerStyle(heroObra)} aria-hidden="true" />
          )}

          <div
            style={
              !isDesktop && heroTemImagem
                ? mobileHeroImageGlowStyle
                : heroGlowStyle
            }
          />

          {isDesktop && (
            <div style={desktopHeroWaterLayerStyle} aria-hidden="true" />
          )}


          {(isDesktop || !heroTemImagem) && (
            <div style={heroDecorationLayerStyle} aria-hidden="true">
              {["✦", "◌", "✧", "◇"].map((decoracao, index) => (
                <span key={`hero-${decoracao}-${index}`} style={criarDecoracaoHomeStyle(index)}>
                  {decoracao}
                </span>
              ))}
            </div>
          )}

          {isDesktop ? (
            <div style={desktopHeroShellStyle}>
              <Link
                href={heroObraHref}
                style={criarHeroPosterStyle(heroObra)}
                aria-label={`Abrir destaque ${heroObra.titulo}`}
              >
                <span style={desktopHeroPosterGlowStyle} aria-hidden="true" />
              </Link>

              <div style={desktopHeroContentStyle}>
                <div style={desktopHeroMetaStyle}>
                  <span style={heroPillStyle}>✦ {heroObra.genero}</span>
                  <span style={heroPillStyle}>◆ {heroObra.classificacaoIndicativa}</span>
                </div>

                <h1 className="historietas-home-hero-title" style={desktopHeroTitleStyle}>{heroObra.titulo}</h1>

                <p style={desktopHeroDescriptionStyle}>
                  {heroObra.sinopse || "Nenhuma sinopse informada."}
                </p>

                <div style={desktopHeroButtonsStyle}>
                  <Link href={heroObraHref} style={primaryButtonStyle}>
                    {heroObra.disponivel ? "Ver obra" : "Ver detalhes"}
                  </Link>

                  <button
                    type="button"
                    onClick={alternarHeroFavorito}
                    aria-pressed={heroEstaSalvo}
                    style={heroEstaSalvo ? savedHeroButtonStyle : secondaryButtonStyle}
                  >
                    {heroEstaSalvo ? "Salvo" : "Salvar"}
                  </button>
                </div>

                <div style={desktopHeroFooterStyle}>
                  <div style={desktopHeroStatsStyle}>
                    <span style={desktopHeroStatItemStyle}>
                      <span style={desktopHeroStatIconStyle}>👁</span>
                      <span style={desktopHeroStatValueStyle}>
                        {formatarContadorHeroHome(heroObra.views)}
                      </span>
                    </span>

                    <span style={desktopHeroStatItemStyle}>
                      <span style={desktopHeroStatHeartIconStyle}>♥</span>
                      <span style={desktopHeroStatValueStyle}>
                        {formatarContadorHeroHome(heroObra.likes)}
                      </span>
                    </span>

                    <span style={desktopHeroStatItemStyle}>
                      <span style={desktopHeroStatIconStyle}>💬</span>
                      <span style={desktopHeroStatValueStyle}>
                        {formatarContadorHeroHome(heroObra.comentarios)}
                      </span>
                    </span>
                  </div>

                  <div style={desktopHeroDotsStyle} aria-label="Obras em destaque">
                    {obrasHero.map((obra, index) => (
                      <button
                        key={`${obra.titulo}-${index}`}
                        type="button"
                        onClick={() => setHeroIndex(index)}
                        aria-label={`Mostrar ${obra.titulo}`}
                        style={
                          index === heroIndex ? heroDotActiveStyle : heroDotStyle
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={mobileHeroContentStyle}>
              <div style={mobileHeroMetaStyle}>
                <span style={mobileHeroPillStyle}>✦ {heroObra.genero}</span>
                <span style={mobileHeroPillStyle}>◆ {heroObra.classificacaoIndicativa}</span>
              </div>

              <div style={mobileHeroTextBlockStyle}>
                <h1 className="historietas-home-hero-title" style={mobileHeroTitleStyle}>{heroObra.titulo}</h1>

                <p style={mobileHeroDescriptionStyle}>
                  {formatarSinopseHeroMobile(heroObra.sinopse)}
                </p>
              </div>

              <div style={mobileHeroButtonsStyle}>
                <Link href={heroObraHref} style={primaryButtonStyle}>
                  {heroObra.disponivel ? "Ver obra" : "Ver detalhes"}
                </Link>

                <button
                  type="button"
                  onClick={alternarHeroFavorito}
                  aria-pressed={heroEstaSalvo}
                  style={heroEstaSalvo ? savedHeroButtonStyle : secondaryButtonStyle}
                >
                  {heroEstaSalvo ? "Salvo" : "Salvar"}
                </button>
              </div>

              <div style={mobileHeroFooterStyle}>
                <div style={mobileHeroStatsStyle}>
                  <span style={mobileHeroStatItemStyle}>
                    <span style={mobileHeroStatIconStyle}>👁</span>
                    <span style={mobileHeroStatValueStyle}>
                      {formatarContadorHeroHome(heroObra.views)}
                    </span>
                  </span>

                  <span style={mobileHeroStatItemStyle}>
                    <span style={mobileHeroStatHeartIconStyle}>♥</span>
                    <span style={mobileHeroStatValueStyle}>
                      {formatarContadorHeroHome(heroObra.likes)}
                    </span>
                  </span>

                  <span style={mobileHeroStatItemStyle}>
                    <span style={mobileHeroStatIconStyle}>💬</span>
                    <span style={mobileHeroStatValueStyle}>
                      {formatarContadorHeroHome(heroObra.comentarios)}
                    </span>
                  </span>
                </div>

                <div style={mobileHeroDotsStyle} aria-label="Obras em destaque">
                  {obrasHero.map((obra, index) => (
                    <button
                      key={`${obra.titulo}-${index}`}
                      type="button"
                      onClick={() => setHeroIndex(index)}
                      aria-label={`Mostrar ${obra.titulo}`}
                      style={
                        index === heroIndex
                          ? mobileHeroDotActiveStyle
                          : mobileHeroDotStyle
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        <section style={isDesktop ? desktopSummaryStripStyle : summaryStripStyle} aria-label="Resumo da plataforma">
          <div style={summaryItemStyle}>
            <strong style={summaryNumberStyle}>
              {resumoInicio.totalPublicadas}
            </strong>
            <span style={summaryLabelStyle}>publicadas</span>
          </div>

          <div style={summaryItemStyle}>
            <strong style={summaryNumberStyle}>
              {resumoInicio.totalEmLeitura}
            </strong>
            <span style={summaryLabelStyle}>em leitura</span>
          </div>

          <div style={summaryItemStyle}>
            <strong style={summaryNumberStyle}>
              {resumoInicio.totalCapitulosPublicados}
            </strong>
            <span style={summaryLabelStyle}>capítulos</span>
          </div>

          <div style={summaryItemStyle}>
            <strong style={summaryNumberStyle}>{notificacoesNaoLidas}</strong>
            <span style={summaryLabelStyle}>avisos</span>
          </div>
        </section>

        {obrasParaContinuar.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Continuar lendo"
              subtitle="Continue do ponto em que parou."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasParaContinuar.map((obra) => (
                <MobileObraLocalCard
                  key={`continuar-${obra.id}`}
                  obra={obra}
                  tipo="continuar"
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasPublicadasFiltradas.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Publicações recentes"
              subtitle={`${obrasPublicadasFiltradas.length} ${
                obrasPublicadasFiltradas.length === 1
                  ? "obra publicada"
                  : "obras publicadas"
              }`}
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasPublicadasFiltradas.map((obra) => (
                <MobileObraLocalCard
                  key={obra.id}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasComNovosCapitulos.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Novos capítulos"
              subtitle="Capítulos novos para acompanhar sem perder o ritmo."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasComNovosCapitulos.map((obra) => (
                <MobileObraLocalCard
                  key={`novos-capitulos-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasMaisCurtidas.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Mais curtidas"
              subtitle="Favoritas da comunidade nesta fase."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasMaisCurtidas.map((obra) => (
                <MobileObraLocalCard
                  key={`mais-curtidas-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasMaisComentadas.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Mais comentadas"
              subtitle="Histórias que estão puxando conversa."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasMaisComentadas.map((obra) => (
                <MobileObraLocalCard
                  key={`mais-comentadas-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasComArquivoAnexado.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Extras e arquivos"
              subtitle="Histórias com material extra para abrir depois."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasComArquivoAnexado.map((obra) => (
                <MobileObraLocalCard
                  key={`arquivo-anexado-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {leiturasRapidas.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Para ler agora"
              subtitle="Obras curtas para entrar rápido no universo."
            />

            <CarouselRow isDesktop={isDesktop}>
              {leiturasRapidas.map((obra) => (
                <MobileObraLocalCard
                  key={`leituras-rapidas-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </CarouselRow>
          </section>
        )}

        {autoresParaConhecer.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Autores para conhecer"
              subtitle="Perfis que dão vida ao catálogo."
            />

            <CarouselRow isDesktop={isDesktop} variant="autor">
              {autoresParaConhecer.map((autor) => (
                <MobileAutorCard key={`autor-${autor.chave}`} autor={autor} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          </section>
        )}

        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <SectionHeader title="Em alta agora" subtitle="Histórias em evidência na plataforma." />

          {obrasFiltradas.length > 0 ? (
            <CarouselRow isDesktop={isDesktop}>
              {obrasFiltradas.map((obra) => (
                <MobileObraCard key={obra.titulo} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          ) : (
            <EmptySearch />
          )}
        </section>

        {obrasFantasiaPoderes.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Fantasia e poderes"
              subtitle="Mundos, poderes e mistérios para explorar."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasFantasiaPoderes.map((obra) => (
                <MobileObraCard key={`fantasia-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasTerrorSuspense.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Terror e suspense"
              subtitle="Atmosfera sombria, tensão e mistério."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasTerrorSuspense.map((obra) => (
                <MobileObraCard key={`terror-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasRomanceDrama.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Romance e drama"
              subtitle="Relações intensas e escolhas difíceis."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasRomanceDrama.map((obra) => (
                <MobileObraCard key={`romance-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasAcaoRivalidades.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Ação e rivalidades"
              subtitle="Conflitos, disputas e personagens intensos."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasAcaoRivalidades.map((obra) => (
                <MobileObraCard key={`acao-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasScifiCodigo.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Sci-fi e códigos"
              subtitle="Futuro, sistemas e universos alternativos."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasScifiCodigo.map((obra) => (
                <MobileObraCard key={`scifi-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          </section>
        )}

        {obrasEmBreve.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <SectionHeader
              title="Em breve na Historietas"
              subtitle="Obras chegando ao catálogo em breve."
            />

            <CarouselRow isDesktop={isDesktop}>
              {obrasEmBreve.map((obra) => (
                <MobileObraCard key={`em-breve-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          </section>
        )}

        <section style={isDesktop ? desktopLastSectionStyle : lastSectionStyle}>
          <SectionHeader
            title="Obras em destaque"
            subtitle="Uma vitrine final para descobrir novas histórias."
          />

          {obrasFiltradas.length > 0 ? (
            <CarouselRow isDesktop={isDesktop}>
              {obrasFiltradas.map((obra) => (
                <MobileObraCard key={`destaque-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </CarouselRow>
          ) : (
            <EmptySearch />
          )}
        </section>
      </div>
    </main>
  );
}

function SectionHeader({
  title,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={sectionHeaderStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>
    </div>
  );
}

function MobileObraLocalCard({
  obra,
  tipo,
  isDesktop,
}: {
  obra: ObraLocal;
  tipo: "continuar" | "catalogo";
  isDesktop?: boolean;
}) {
  const totalCurtidas = obra.capitulos.filter((capitulo) => capitulo.curtiu)
    .length;

  const totalComentarios = obra.capitulos.filter((capitulo) =>
    capitulo.comentario.trim()
  ).length;

  const totalLidos = obra.capitulos.filter((capitulo) => capitulo.lido).length;
  const progressoLeitura = calcularProgressoLeitura(obra.capitulos);
  const capituloParaContinuar = encontrarCapituloParaContinuar(obra);
  const slugObra = obra.slug || criarSlugBase(obra.titulo);
  const verObraHref = obra.link?.trim() || `/obra/${slugObra}`;
  const continuarLeituraHref = capituloParaContinuar
    ? `/ler-capitulo?obraId=${obra.id}&capituloId=${capituloParaContinuar.id}`
    : verObraHref;
  const perfilAutorHref = `/perfil-autor?autor=${encodeURIComponent(
    obra.autor
  )}`;

  const actionHref = tipo === "continuar" ? continuarLeituraHref : verObraHref;
  const actionLabel = tipo === "continuar" ? "Continuar leitura" : "Ver obra";
  const capaStyle = isDesktop
    ? { ...criarMobileCoverStyle(obra.capa), ...desktopCoverPlaceholderStyle }
    : criarMobileCoverStyle(obra.capa);

  return (
    <article style={isDesktop ? desktopPublishedCardStyle : publishedCardStyle}>
      <Link href={verObraHref} style={capaStyle}>
        {!obra.capa && <span style={noCoverBadgeStyle}>Sem capa</span>}
      </Link>

      <div style={publishedInfoStyle}>
        <div style={cardTopRowStyle}>
          <h3 style={isDesktop ? desktopPublishedTitleStyle : publishedTitleStyle}>{obra.titulo}</h3>

          <div style={statusRowStyle}>
            <span style={formatBadgeStyle}>{obra.formato}</span>
            <span style={classificationBadgeStyle}>
              {obra.classificacaoIndicativa}
            </span>
          </div>
        </div>

        <Link href={perfilAutorHref} style={authorLinkStyle}>
          por {obra.autor}
        </Link>

        <div style={cardStatsStyle}>
          <span style={safeTextStyle}>📚 {obra.capitulos.length} cap.</span>
          <span style={safeTextStyle}>♥ {totalCurtidas}</span>
          <span style={safeTextStyle}>💬 {totalComentarios}</span>
          {totalLidos > 0 && <span style={safeTextStyle}>{totalLidos} lidos</span>}
        </div>

        {progressoLeitura > 0 && (
          <div style={progressCompactStyle}>
            <div style={progressTrackStyle}>
              <div
                style={{
                  ...progressBarStyle,
                  width: `${progressoLeitura}%`,
                }}
              />
            </div>

            <span style={progressTextStyle}>{progressoLeitura}% lido</span>
          </div>
        )}

        <div style={isDesktop ? desktopCardActionRowStyle : mobileCardActionRowStyle}>
          <span style={isDesktop ? desktopCardGenreBadgeStyle : mobileCardGenreBadgeStyle}>
            {obra.genero}
          </span>

          <Link
            href={actionHref}
            style={isDesktop ? desktopCardPrimaryActionStyle : mobileCardPrimaryActionStyle}
          >
            {actionLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}

function MobileAutorCard({ autor, isDesktop }: { autor: AutorHome; isDesktop?: boolean }) {
  const generosAutor = autor.generos.length > 0 ? autor.generos : ["Historietas"];

  return (
    <Link
      href={autor.href}
      style={isDesktop ? desktopAuthorCardStyle : authorCardStyle}
      aria-label={`Abrir perfil do autor ${autor.nome}`}
    >
      <span style={authorCardGlowStyle} aria-hidden="true" />

      <div style={authorCardTopStyle}>
        <div style={authorAvatarShellStyle}>
          {autor.avatar ? (
            <img
              src={autor.avatar}
              alt={`Avatar de ${autor.nome}`}
              style={authorAvatarImageStyle}
            />
          ) : (
            <span style={authorAvatarInitialsStyle}>
              {criarIniciaisAutor(autor.nome)}
            </span>
          )}
        </div>

        <div style={authorIdentityStyle}>
          <h3 style={authorCardNameStyle}>{autor.nome}</h3>

          <p style={authorCardBioStyle}>{autor.bio}</p>
        </div>
      </div>

      <div style={authorMetaRowStyle}>
        <span style={authorMetaBadgeStyle}>
          {autor.totalObras} {autor.totalObras === 1 ? "obra" : "obras"}
        </span>

        {autor.totalCapitulos > 0 && (
          <span style={authorMetaBadgeStyle}>{autor.totalCapitulos} cap.</span>
        )}

        {autor.totalCurtidas > 0 && (
          <span style={authorMetaBadgeStyle}>♥ {autor.totalCurtidas}</span>
        )}

        {autor.totalComentarios > 0 && (
          <span style={authorMetaBadgeStyle}>💬 {autor.totalComentarios}</span>
        )}
      </div>

      <div style={authorBottomRowStyle}>
        <div style={authorGenreRowStyle}>
          {generosAutor.slice(0, 2).map((genero) => (
            <span key={`${autor.chave}-${genero}`} style={authorGenreBadgeStyle}>
              {genero}
            </span>
          ))}
        </div>

        <span style={authorProfileButtonStyle}>Ver perfil</span>
      </div>
    </Link>
  );
}

function MobileObraCard({ obra, isDesktop }: { obra: Obra; isDesktop?: boolean }) {
  const obraHref = criarHrefObraCatalogoHome(obra);

  const conteudoCard = (
    <>
      <div
        style={
          isDesktop
            ? {
                ...criarMobileCoverThumbStyle(obra),
                minHeight: "142px",
                borderRadius: "18px",
              }
            : criarMobileCoverThumbStyle(obra)
        }
      />

      <div style={obraInfoStyle}>
        <div style={cardTopRowStyle}>
          <h3 style={isDesktop ? desktopObraTitleStyle : obraTitleStyle}>{obra.titulo}</h3>

          <div style={statusRowStyle}>
            <span style={formatBadgeStyle}>{obterFormatoObraCatalogoHome(obra)}</span>
            <span style={classificationBadgeStyle}>
              {obra.classificacaoIndicativa}
            </span>
          </div>
        </div>

        <p style={authorStyle}>por {obra.autor}</p>

        <div style={cardStatsStyle}>
          <span style={safeTextStyle}>👁 {obra.views}</span>
          <span style={safeTextStyle}>♥ {obra.likes}</span>
          <span style={safeTextStyle}>💬 {obra.comentarios}</span>
        </div>

        <div style={isDesktop ? desktopCardActionRowStyle : mobileCardActionRowStyle}>
          <span style={isDesktop ? desktopCardGenreBadgeStyle : mobileCardGenreBadgeStyle}>
            {obra.genero}
          </span>

          <span
            style={
              obra.disponivel
                ? isDesktop
                  ? desktopCardPrimaryActionStyle
                  : mobileCardPrimaryActionStyle
                : isDesktop
                  ? desktopCardSecondaryActionStyle
                  : mobileCardSecondaryActionStyle
            }
          >
            {obra.disponivel ? "Ver obra" : "Ver detalhes"}
          </span>
        </div>
      </div>
    </>
  );

  return (
    <Link
      href={obraHref}
      style={
        isDesktop
          ? obra.disponivel
            ? desktopObraCardStyle
            : desktopObraCardSoonStyle
          : obra.disponivel
            ? obraCardStyle
            : obraCardSoonStyle
      }
      aria-label={`Abrir página da obra ${obra.titulo}`}
    >
      {conteudoCard}
    </Link>
  );
}

function EmptySearch() {
  return <div style={emptyBoxStyle}>Nenhuma obra encontrada.</div>;
}

function CarouselRow({
  children,
  isDesktop,
  variant = "obra",
}: {
  children: ReactNode;
  isDesktop: boolean;
  variant?: "obra" | "autor";
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const totalItems = Children.count(children);
  const precisaDeCarrossel = isDesktop && totalItems > 3;

  const listStyle = !isDesktop
    ? variant === "autor"
      ? authorListStyle
      : storyListStyle
    : precisaDeCarrossel
      ? variant === "autor"
        ? desktopAuthorListStyle
        : desktopStoryListStyle
      : variant === "autor"
        ? desktopStaticAuthorListStyle
        : desktopStaticStoryListStyle;

  function rolarCarrossel(direcao: -1 | 1) {
    rowRef.current?.scrollBy({
      left: direcao * 450,
      behavior: "smooth",
    });
  }

  if (!isDesktop || !precisaDeCarrossel) {
    return <div style={listStyle}>{children}</div>;
  }

  return (
    <div style={desktopCarouselShellStyle}>
      <button
        type="button"
        onClick={() => rolarCarrossel(-1)}
        style={desktopCarouselArrowLeftStyle}
        aria-label="Rolar carrossel para a esquerda"
      >
        <span style={desktopCarouselArrowIconStyle}>‹</span>
      </button>

      <div ref={rowRef} style={listStyle}>
        {children}
      </div>

      <button
        type="button"
        onClick={() => rolarCarrossel(1)}
        style={desktopCarouselArrowRightStyle}
        aria-label="Rolar carrossel para a direita"
      >
        <span style={desktopCarouselArrowIconStyle}>›</span>
      </button>
    </div>
  );
}

const themePageCss = `
  html[data-historietas-tema-visual] body {
    background: var(--historietas-bg-start, #0B0614) !important;
    color: var(--historietas-text-primary, #FFFFFF) !important;
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

  html[data-historietas-tema-visual] nav a[href="/"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/"] {
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

  html[data-historietas-tema-visual="branco"] input::placeholder {
    color: #80868B !important;
  }

  html[data-historietas-tema-visual="branco"] header {
    color: #202124;
  }

  html[data-historietas-tema-visual="branco"] .historietas-home-logo-text,
  html[data-historietas-tema-visual="branco"] .historietas-home-hero-title {
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

const pageDecorationLayerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 0,
};

const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(340px, 48vh)",
  pointerEvents: "none",
  zIndex: 0,
  background:
    "radial-gradient(ellipse at 8% 74%, var(--historietas-glow-primary, rgba(42,20,76,0.54)) 0%, transparent 62%), radial-gradient(ellipse at 76% 68%, var(--historietas-glow-secondary, rgba(32,13,58,0.36)) 0%, transparent 64%), linear-gradient(180deg, var(--historietas-bg-start, rgba(10,6,18,0.98)) 0%, var(--historietas-bg-mid, rgba(18,8,31,0.96)) 42%, transparent 100%)",
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
};
const desktopHeroWaterLayerStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "56%",
  pointerEvents: "none",
  zIndex: 0,
  background:
    "linear-gradient(180deg, var(--historietas-glow-primary, rgba(45,16,78,0.34)) 0%, transparent 100%), radial-gradient(ellipse 58% 88% at 18% 0%, var(--historietas-glow-primary, rgba(124,58,237,0.26)) 0%, transparent 76%), radial-gradient(ellipse 34% 58% at 91% 0%, var(--historietas-glow-secondary, rgba(249,115,22,0.08)) 0%, transparent 76%)",
};

const heroDecorationLayerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 0,
};

const emptyPageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "var(--historietas-bg-mid, #12081F)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  padding: "40px",
  maxWidth: "100vw",
  overflowX: "hidden",
  ...safeTextStyle,
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background:
    "radial-gradient(circle at 12% 0%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)), transparent 28%), radial-gradient(circle at 88% 14%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)), transparent 22%), radial-gradient(circle at 50% 100%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)), transparent 30%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 38%, var(--historietas-bg-end, #17101B) 100%)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(820px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  boxSizing: "border-box",
  minWidth: 0,
};

const navStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 30,
  background:
    "linear-gradient(180deg, var(--historietas-surface-strong, rgba(10,6,18,0.98)) 0%, color-mix(in srgb, var(--historietas-surface-strong, rgba(18,8,31,0.94)) 92%, transparent) 70%, color-mix(in srgb, var(--historietas-surface-strong, rgba(18,8,31,0.88)) 86%, transparent) 100%)",
  borderBottom: "0",
  boxShadow: "none",
  maxWidth: "100vw",
  overflowX: "hidden",
};


const desktopNavStyle: CSSProperties = {
  ...navStyle,
  background:
    "linear-gradient(180deg, var(--historietas-surface-strong, rgba(10,6,18,0.98)) 0%, color-mix(in srgb, var(--historietas-surface-strong, rgba(12,6,22,0.92)) 72%, transparent) 46%, transparent 100%)",
  borderBottom: "0",
  boxShadow: "none",
};
const mobileNavStyle: CSSProperties = {
  ...navStyle,
  borderBottom: "0",
  boxShadow: "none",
};

const navInnerStyle: CSSProperties = {
  width: "min(820px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  padding: "14px 0 12px",
  boxSizing: "border-box",
  minWidth: 0,
};

const navTopRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "14px",
  flexWrap: "wrap",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1240px, calc(100% - 64px))",
};

const desktopNavInnerStyle: CSSProperties = {
  ...navInnerStyle,
  width: "min(1240px, calc(100% - 64px))",
  gridTemplateColumns: "1fr",
  gridTemplateAreas: '"top" "menu"',
  alignItems: "center",
  gap: "10px",
  padding: "12px 0 10px",
};

const desktopNavTopRowStyle: CSSProperties = {
  ...navTopRowStyle,
  gridArea: "top",
  flexWrap: "nowrap",
};

const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "25px",
  fontWeight: 950,
  letterSpacing: 0,
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "min(100%, calc(100% - 96px))",
  ...safeTextStyle,
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
  fontSize: "19px",
  fontWeight: 950,
  letterSpacing: 0,
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #F5F3FF) 0%, var(--historietas-title-mid, #C4B5FD) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow:
    "var(--historietas-logo-shadow, 0 0 26px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, transparent))",
};

const navIconsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flex: "0 0 auto",
  maxWidth: "100%",
};

const publishSmallButtonStyle: CSSProperties = {
  minHeight: "34px",
  padding: "0 13px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: 950,
  lineHeight: 1.15,
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "center",
  whiteSpace: "normal",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 18%, rgba(255,255,255,0.16))",
  ...safeTextStyle,
};

const notificationDotStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  background:
    "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 34%, transparent)",
  color: "var(--historietas-text-primary, #F5F3FF)",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  fontWeight: 950,
  flex: "0 0 auto",
};

const mobileSearchToggleStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  background: "var(--historietas-surface, rgba(255,255,255,0.07))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "15px",
  cursor: "pointer",
  flex: "0 0 auto",
};

const mobileSearchToggleActiveStyle: CSSProperties = {
  ...mobileSearchToggleStyle,
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 42%, rgba(255,255,255,0.12))",
  background:
    "color-mix(in srgb, var(--historietas-accent, #F97316) 20%, rgba(255,255,255,0.07))",
};

const menuStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  overflowX: "auto",
  padding: "2px 0 6px",
  maxWidth: "100%",
  scrollbarWidth: "none",
};

const desktopMenuStyle: CSSProperties = {
  ...menuStyle,
  gridArea: "menu",
  gap: "9px",
  overflowX: "hidden",
  padding: "0 0 2px",
};

const desktopInlineSearchAreaStyle: CSSProperties = {
  flex: "1 1 320px",
  minWidth: "280px",
  maxWidth: "430px",
  marginLeft: "2px",
};

const linkStyle: CSSProperties = {
  position: "relative",
  color: "var(--historietas-text-secondary, #C8C1D9)",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 900,
  whiteSpace: "nowrap",
  flex: "0 0 auto",
  padding: "9px 13px",
  borderRadius: "999px",
  background: "var(--historietas-surface, rgba(255,255,255,0.055))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
};

const activeLinkStyle: CSSProperties = {
  ...linkStyle,
  color: "var(--historietas-text-primary, #FFFFFF)",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 54%, transparent) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 30%, transparent) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  boxShadow: "var(--historietas-card-shadow, none)",
};

const searchAreaStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: "44px",
  borderRadius: "999px",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent)",
  background:
    "var(--historietas-input-bg, linear-gradient(135deg, rgba(255,255,255,0.075) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 10%, transparent) 100%))",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 15px",
  outline: "none",
  fontSize: "14px",
  fontWeight: 700,
  boxSizing: "border-box",
  maxWidth: "100%",
  minWidth: 0,
  boxShadow: "none",
};

const heroStyle: CSSProperties = {
  marginTop: "12px",
  borderRadius: "28px",
  overflow: "hidden",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent)",
  boxShadow: "var(--historietas-hero-shadow, 0 22px 54px rgba(0,0,0,0.36))",
  position: "relative",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const desktopHeroStyle: CSSProperties = {
  marginTop: "18px",
  borderRadius: "30px",
  backgroundPosition: "center",
};

const desktopHeroShellStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: "minmax(232px, 304px) minmax(0, 1fr)",
  alignItems: "stretch",
  gap: "24px",
  minHeight: "304px",
  padding: "22px 28px",
  boxSizing: "border-box",
};

const desktopHeroPosterStyle: CSSProperties = {
  position: "relative",
  minHeight: "252px",
  borderRadius: "22px",
  overflow: "hidden",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  boxShadow: "var(--historietas-card-shadow, 0 14px 34px rgba(0,0,0,0.28))",
  textDecoration: "none",
  color: "#FFFFFF",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  gap: "10px",
  padding: "18px",
  boxSizing: "border-box",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const desktopHeroPosterGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(8, 5, 18, 0.02) 0%, rgba(8, 5, 18, 0.48) 100%)",
  pointerEvents: "none",
};

const desktopHeroPosterBadgesStyle: CSSProperties = {
  position: "absolute",
  zIndex: 1,
  top: "18px",
  left: "18px",
  right: "18px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  maxWidth: "calc(100% - 36px)",
  minWidth: 0,
};

const desktopHeroPosterBadgeStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "fit-content",
  maxWidth: "100%",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(20, 11, 38, 0.64)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 32%, transparent)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  textShadow: "0 1px 8px rgba(0,0,0,0.42)",
  ...safeTextStyle,
};

const desktopHeroPosterClassificationBadgeStyle: CSSProperties = {
  ...desktopHeroPosterBadgeStyle,
  border:
    "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 34%, transparent)",
};

const desktopHeroPosterTitleStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  color: "#FFFFFF",
  fontSize: "28px",
  lineHeight: 1.06,
  fontWeight: 950,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const desktopHeroPosterStatusStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "fit-content",
  maxWidth: "100%",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  fontWeight: 900,
  ...safeTextStyle,
};


const heroGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(8, 5, 18, 0.24) 0%, rgba(8, 5, 18, 0.90) 100%)",
};

const mobileHeroImageGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "transparent",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minHeight: "min(460px, 68vh)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  gap: "15px",
  padding: "24px 16px 22px",
  boxSizing: "border-box",
  maxWidth: "100%",
  minWidth: 0,
};

const desktopHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  minHeight: "auto",
  justifyContent: "center",
  alignItems: "flex-start",
  alignSelf: "stretch",
  width: "100%",
  padding: "38px 14px 20px 0",
  maxWidth: "100%",
  gap: "10px",
  position: "relative",
  textAlign: "left",
};

const heroMetaStyle: CSSProperties = {
  display: "flex",
  gap: "9px",
  flexWrap: "wrap",
  maxWidth: "100%",
  minWidth: 0,
};

const desktopHeroMetaStyle: CSSProperties = {
  ...heroMetaStyle,
  position: "absolute",
  top: "4px",
  right: "4px",
  zIndex: 4,
  alignItems: "center",
  justifyContent: "flex-end",
  marginBottom: 0,
  maxWidth: "46%",
};

const heroKickerStyle: CSSProperties = {
  maxWidth: "100%",
  padding: "8px 12px",
  borderRadius: "999px",
  background:
    "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  fontWeight: 950,
  boxShadow:
    "0 12px 34px color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)",
  ...safeTextStyle,
};

const heroPillStyle: CSSProperties = {
  maxWidth: "100%",
  minHeight: "34px",
  padding: "8px 14px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 22%, var(--historietas-surface-strong, rgba(18,12,30,0.96))) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, var(--historietas-surface, rgba(18,12,30,0.88))) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 34%, var(--historietas-border-soft, rgba(255,255,255,0.14)))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12.5px",
  fontWeight: 950,
  boxShadow: "none",
  textShadow: "0 1px 8px rgba(0,0,0,0.26)",
  ...safeTextStyle,
};

const heroTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(34px, 11vw, 72px)",
  lineHeight: 0.96,
  fontWeight: 950,
  letterSpacing: 0,
  maxWidth: "100%",
  ...safeTextStyle,
};

const desktopHeroTitleStyle: CSSProperties = {
  ...heroTitleStyle,
  fontSize: "clamp(34px, 4vw, 52px)",
  lineHeight: 1.04,
  width: "100%",
  maxWidth: "680px",
  alignSelf: "center",
  marginTop: 0,
  textAlign: "center",
  position: "relative",
  left: "-64px",
};

const heroDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "15px",
  lineHeight: 1.55,
  fontWeight: 650,
  maxWidth: "100%",
  ...safeTextStyle,
};

const desktopHeroDescriptionStyle: CSSProperties = {
  ...heroDescriptionStyle,
  fontSize: "15px",
  lineHeight: 1.55,
  width: "100%",
  maxWidth: "680px",
  alignSelf: "center",
  minHeight: "74px",
  display: "-webkit-box",
  WebkitLineClamp: 5,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  textAlign: "center",
  position: "relative",
  left: "-64px",
};

const heroStatsStyle: CSSProperties = {
  display: "flex",
  gap: "11px",
  flexWrap: "wrap",
  color: "var(--historietas-text-secondary, #B9B4C7)",
  fontSize: "13px",
  fontWeight: 850,
  maxWidth: "100%",
  minWidth: 0,
};

const heroButtonsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(138px, 1fr))",
  gap: "10px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const mobileHeroButtonsStyle: CSSProperties = {
  ...heroButtonsStyle,
  position: "absolute",
  left: "16px",
  right: "16px",
  bottom: "58px",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  alignSelf: "auto",
  width: "auto",
};

const desktopHeroButtonsStyle: CSSProperties = {
  ...heroButtonsStyle,
  gridTemplateColumns: "repeat(2, minmax(164px, 198px))",
  justifyContent: "center",
  alignSelf: "center",
  width: "100%",
  marginTop: "8px",
  position: "relative",
  left: "-64px",
};

const primaryButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "50px",
  padding: "0 22px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "15px",
  fontWeight: 950,
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, rgba(255,255,255,0.16))",
  textAlign: "center",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const secondaryButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "50px",
  padding: "0 22px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.09))",
  color: "var(--historietas-secondary-button-text, #FFFFFF)",
  textDecoration: "none",
  fontFamily: "inherit",
  fontSize: "15px",
  fontWeight: 900,
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  appearance: "none",
  cursor: "pointer",
  textAlign: "center",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const savedHeroButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  background:
    "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 28%, rgba(255,255,255,0.08))",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 26%, rgba(255,255,255,0.12))",
  color: "var(--historietas-accent, #FDBA74)",
};

const heroDotsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "4px",
  flexWrap: "wrap",
  maxWidth: "100%",
};

const heroDotStyle: CSSProperties = {
  width: "18px",
  height: "5px",
  borderRadius: "999px",
  border: "0",
  background: "color-mix(in srgb, var(--historietas-text-secondary, #FFFFFF) 24%, transparent)",
  cursor: "pointer",
};

const heroDotActiveStyle: CSSProperties = {
  ...heroDotStyle,
  width: "38px",
  background: "var(--historietas-accent, #F97316)",
};

const desktopHeroFooterStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  justifyContent: "center",
  justifyItems: "center",
  alignItems: "center",
  gap: "10px",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  marginTop: 0,
};

const desktopHeroStatsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(76px, 1fr))",
  alignItems: "center",
  justifySelf: "center",
  gap: "10px",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  fontWeight: 900,
  width: "100%",
  maxWidth: "360px",
  minWidth: 0,
  position: "relative",
  left: "-64px",
};

const desktopHeroStatItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  minWidth: 0,
  width: "100%",
  padding: "9px 10px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.075))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
  boxSizing: "border-box",
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const desktopHeroStatIconStyle: CSSProperties = {
  lineHeight: 1,
  flexShrink: 0,
};

const desktopHeroStatHeartIconStyle: CSSProperties = {
  ...desktopHeroStatIconStyle,
  color: "#E11D48",
};

const desktopHeroStatValueStyle: CSSProperties = {
  display: "inline-block",
  minWidth: 0,
  overflow: "visible",
  textOverflow: "clip",
  whiteSpace: "nowrap",
};

const desktopHeroDotsStyle: CSSProperties = {
  ...heroDotsStyle,
  justifyContent: "flex-end",
  justifySelf: "end",
  width: "auto",
  marginTop: "-2px",
  flexWrap: "nowrap",
  minWidth: 0,
};

const mobileHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  display: "block",
  minHeight: "min(460px, 68vh)",
  padding: "22px 16px 18px",
  position: "relative",
};

const mobileHeroMetaStyle: CSSProperties = {
  position: "absolute",
  top: "22px",
  left: "16px",
  right: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "8px",
  flexWrap: "wrap",
  maxWidth: "calc(100% - 32px)",
  minWidth: 0,
};

const mobileHeroPillStyle: CSSProperties = {
  ...heroPillStyle,
  padding: "8px 13px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 26%, var(--historietas-surface-strong, rgba(18,12,30,0.88))) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, var(--historietas-surface, rgba(18,12,30,0.82))) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 34%, var(--historietas-border-soft, rgba(255,255,255,0.18)))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  boxShadow: "none",
  textShadow: "0 1px 8px rgba(0,0,0,0.34)",
};

const mobileHeroTextBlockStyle: CSSProperties = {
  position: "absolute",
  left: "16px",
  right: "16px",
  bottom: "120px",
  display: "grid",
  justifyItems: "center",
  gap: "10px",
  textAlign: "center",
  width: "auto",
  maxWidth: "none",
  minWidth: 0,
};

const mobileHeroTitleStyle: CSSProperties = {
  ...heroTitleStyle,
  width: "100%",
  textAlign: "center",
  fontSize: "clamp(34px, 10.2vw, 60px)",
  lineHeight: 0.96,
  textShadow: "0 2px 16px rgba(0,0,0,0.72)",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const mobileHeroDescriptionStyle: CSSProperties = {
  ...heroDescriptionStyle,
  justifySelf: "center",
  textAlign: "center",
  color: "#FFFFFF",
  fontSize: "14px",
  lineHeight: 1.5,
  textShadow: "0 2px 14px rgba(0,0,0,0.78)",
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  width: "100%",
  maxWidth: "560px",
  minHeight: "63px",
  overflow: "hidden",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  hyphens: "auto",
};

const mobileHeroFooterStyle: CSSProperties = {
  position: "absolute",
  left: "16px",
  right: "16px",
  bottom: "18px",
  display: "grid",
  gridTemplateColumns: "156px minmax(0, 1fr)",
  alignSelf: "auto",
  alignItems: "center",
  gap: "8px",
  width: "auto",
  maxWidth: "none",
  minWidth: 0,
};

const mobileHeroStatsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  alignItems: "center",
  justifyContent: "stretch",
  columnGap: "5px",
  color: "#FFFFFF",
  fontSize: "11.5px",
  fontWeight: 900,
  textShadow: "0 2px 12px rgba(0,0,0,0.78)",
  width: "156px",
  maxWidth: "100%",
  minWidth: "156px",
  whiteSpace: "nowrap",
};

const mobileHeroStatItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "3px",
  minWidth: 0,
  width: "100%",
  whiteSpace: "nowrap",
};

const mobileHeroStatIconStyle: CSSProperties = {
  lineHeight: 1,
  flexShrink: 0,
};

const mobileHeroStatHeartIconStyle: CSSProperties = {
  ...mobileHeroStatIconStyle,
  color: "#E11D48",
};

const mobileHeroStatValueStyle: CSSProperties = {
  display: "inline-block",
  minWidth: 0,
  overflow: "visible",
  textOverflow: "clip",
  whiteSpace: "nowrap",
};

const mobileHeroDotsStyle: CSSProperties = {
  ...heroDotsStyle,
  justifyContent: "flex-end",
  marginTop: 0,
  marginLeft: 0,
  gap: "6px",
};

const mobileHeroDotStyle: CSSProperties = {
  ...heroDotStyle,
  width: "16px",
};

const mobileHeroDotActiveStyle: CSSProperties = {
  ...mobileHeroDotStyle,
  width: "34px",
  background: "var(--historietas-accent, #F97316)",
};

const summaryStripStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  alignItems: "center",
  gap: "6px",
  marginTop: "14px",
  padding: "12px 8px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(255,255,255,0.06)) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 7%, transparent) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent)",
  boxShadow: "var(--historietas-card-shadow, 0 12px 28px rgba(0,0,0,0.18))",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
  overflow: "hidden",
};

const desktopSummaryStripStyle: CSSProperties = {
  ...summaryStripStyle,
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "12px",
  padding: "14px",
  borderRadius: "26px",
};

const summaryItemStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: "4px",
  maxWidth: "100%",
  minWidth: 0,
};

const summaryNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #F97316)",
  fontSize: "20px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

const summaryLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 850,
  textAlign: "center",
  lineHeight: 1.25,
  ...safeTextStyle,
};

const sectionStyle: CSSProperties = {
  marginTop: "24px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const lastSectionStyle: CSSProperties = {
  marginTop: "24px",
  paddingBottom: "22px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  marginTop: "30px",
};

const desktopLastSectionStyle: CSSProperties = {
  ...lastSectionStyle,
  marginTop: "30px",
  paddingBottom: "76px",
};

const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  justifyItems: "center",
  gap: "6px",
  marginBottom: "14px",
  maxWidth: "100%",
  minWidth: 0,
  textAlign: "center",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "clamp(24px, 4vw, 30px)",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

const storyListStyle: CSSProperties = {
  display: "flex",
  gap: "14px",
  maxWidth: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  overflowX: "auto",
  overflowY: "hidden",
  padding: "2px 2px 18px",
  margin: "0 -2px",
  scrollSnapType: "x mandatory",
  scrollPaddingLeft: "2px",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};

const desktopCarouselShellStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const desktopStoryListStyle: CSSProperties = {
  ...storyListStyle,
  gap: "18px",
  width: "100%",
  padding: "6px 0 20px",
  margin: 0,
  scrollPaddingLeft: "0px",
  scrollPaddingRight: "0px",
};

const desktopStaticStoryListStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
  gap: "18px",
  width: "100%",
  maxWidth: "100%",
  padding: "6px 0 10px",
  margin: 0,
  boxSizing: "border-box",
  overflow: "visible",
};

const desktopCarouselArrowBaseStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 4,
  width: "30px",
  height: "30px",
  padding: 0,
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.16)",
  background:
    "linear-gradient(135deg, rgba(18,8,31,0.92) 0%, rgba(38,20,62,0.94) 100%)",
  color: "#FFFFFF",
  fontSize: 0,
  lineHeight: 1,
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const desktopCarouselArrowLeftStyle: CSSProperties = {
  ...desktopCarouselArrowBaseStyle,
  left: "6px",
};

const desktopCarouselArrowRightStyle: CSSProperties = {
  ...desktopCarouselArrowBaseStyle,
  right: "6px",
};

const desktopCarouselArrowIconStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  transform: "translateY(-1px)",
};

const authorListStyle: CSSProperties = {
  ...storyListStyle,
  gap: "12px",
  padding: "2px 2px 16px",
};

const desktopAuthorListStyle: CSSProperties = {
  ...authorListStyle,
  gap: "16px",
  width: "100%",
  padding: "6px 0 18px",
  margin: 0,
  scrollPaddingLeft: "0px",
  scrollPaddingRight: "0px",
};

const desktopStaticAuthorListStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
  gap: "16px",
  width: "100%",
  maxWidth: "100%",
  padding: "6px 0 8px",
  margin: 0,
  boxSizing: "border-box",
  overflow: "visible",
};

const authorCardStyle: CSSProperties = {
  position: "relative",
  flex: "0 0 min(318px, 84vw)",
  width: "min(318px, 84vw)",
  scrollSnapAlign: "start",
  padding: "12px",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(31,18,48,0.98)) 0%, var(--historietas-surface-strong, rgba(14,8,26,0.99)) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "grid",
  gap: "10px",
  boxShadow:
    "var(--historietas-card-shadow, 0 18px 42px rgba(0,0,0,0.30))",
  boxSizing: "border-box",
  overflow: "hidden",
};

const desktopAuthorCardStyle: CSSProperties = {
  ...authorCardStyle,
  flex: "0 0 356px",
  width: "356px",
  maxWidth: "356px",
  padding: "14px",
  borderRadius: "26px",
};

const authorCardGlowStyle: CSSProperties = {
  display: "none",
};

const authorCardTopStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: "68px minmax(0, 1fr)",
  gap: "11px",
  alignItems: "center",
  minWidth: 0,
};

const authorAvatarShellStyle: CSSProperties = {
  width: "68px",
  height: "68px",
  borderRadius: "21px",
  padding: "3px",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  boxShadow: "none",
  overflow: "hidden",
  flex: "0 0 auto",
};

const authorAvatarImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "cover",
  borderRadius: "18px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
};

const authorAvatarInitialsStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "18px",
  background:
    "radial-gradient(circle at 22% 18%, rgba(255,255,255,0.20), transparent 34%), linear-gradient(135deg, var(--historietas-surface-strong, rgba(15,8,32,0.95)) 0%, var(--historietas-surface, rgba(32,16,54,0.95)) 100%)",
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.06em",
};

const authorIdentityStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  alignContent: "center",
  minWidth: 0,
};

const authorCardNameStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "24px",
  lineHeight: 0.98,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const authorCardBioStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  lineHeight: 1.35,
  fontWeight: 750,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const authorMetaRowStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
};

const authorMetaBadgeStyle: CSSProperties = {
  width: "100%",
  minHeight: "32px",
  padding: "0 6px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.075))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-secondary, #E4E4E7)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  ...safeTextStyle,
};

const authorBottomRowStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  minWidth: 0,
};

const authorGenreRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
};

const authorGenreBadgeStyle: CSSProperties = {
  width: "100%",
  minHeight: "30px",
  padding: "0 8px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 22%, var(--historietas-surface, rgba(255,255,255,0.07))) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, var(--historietas-surface, rgba(255,255,255,0.07))) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 34%, var(--historietas-border-soft, rgba(255,255,255,0.14)))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  ...safeTextStyle,
};

const authorProfileButtonStyle: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  minHeight: "40px",
  padding: "0 12px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 72%, var(--historietas-accent, #F97316)) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 35%, transparent)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

const publishedCardStyle: CSSProperties = {
  flex: "0 0 min(360px, 88vw)",
  width: "min(360px, 88vw)",
  scrollSnapAlign: "start",
  display: "grid",
  gridTemplateColumns: "minmax(88px, 98px) minmax(0, 1fr)",
  gap: "14px",
  alignItems: "stretch",
  padding: "11px",
  borderRadius: "22px",
  background:
    "linear-gradient(145deg, var(--historietas-surface, rgba(26,17,43,0.96)) 0%, var(--historietas-surface-strong, rgba(13,9,25,0.98)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "88vw",
  overflow: "hidden",
  boxShadow:
    "var(--historietas-card-shadow, 0 12px 28px rgba(0,0,0,0.22))",
  boxSizing: "border-box",
};

const desktopPublishedCardStyle: CSSProperties = {
  ...publishedCardStyle,
  flex: "0 0 410px",
  width: "410px",
  maxWidth: "100%",
  gridTemplateColumns: "112px minmax(0, 1fr)",
  gap: "15px",
  padding: "13px",
  borderRadius: "24px",
  boxShadow:
    "var(--historietas-card-shadow, 0 14px 34px rgba(0,0,0,0.24))",
};

const coverPlaceholderStyle: CSSProperties = {
  minHeight: "116px",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  backgroundImage:
    "radial-gradient(circle at top left, rgba(34,197,94,0.18), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 70%, transparent), transparent 38%), linear-gradient(135deg, var(--historietas-surface, #18181B) 0%, var(--historietas-surface-strong, #0F0F0F) 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  textDecoration: "none",
  display: "block",
};

const desktopCoverPlaceholderStyle: CSSProperties = {
  minHeight: "142px",
  borderRadius: "18px",
};

const noCoverBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "8px",
  right: "8px",
  transform: "translateY(-50%)",
  maxWidth: "calc(100% - 16px)",
  padding: "6px 8px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.1))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 950,
  textAlign: "center",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const publishedInfoStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  display: "grid",
  alignContent: "center",
  gap: "7px",
};

const cardTopRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
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

const desktopPublishedTitleStyle: CSSProperties = {
  ...publishedTitleStyle,
  fontSize: "21px",
  lineHeight: 1.06,
};

const statusRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  maxWidth: "100%",
  minWidth: 0,
};

const publishedBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.14)",
  border: "1px solid rgba(34, 197, 94, 0.3)",
  color: "#86EFAC",
  fontSize: "10px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const formatBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 18%, var(--historietas-surface, rgba(255,255,255,0.08))) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 12%, var(--historietas-surface, rgba(255,255,255,0.08))) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, var(--historietas-border-soft, rgba(255,255,255,0.14)))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const classificationBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, var(--historietas-surface, rgba(255,255,255,0.08))) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, var(--historietas-surface, rgba(255,255,255,0.08))) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 42%, var(--historietas-border-soft, rgba(255,255,255,0.16)))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const authorLinkStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  margin: 0,
  color: "var(--historietas-text-secondary, #D8C8FF)",
  fontSize: "12px",
  fontWeight: 800,
  textDecoration: "none",
  borderBottom: "1px solid rgba(216,200,255,0.20)",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const cardStatsStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 800,
  maxWidth: "100%",
  minWidth: 0,
};

const mobileCardActionRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "4px",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
  boxSizing: "border-box",
};

const mobileCardGenreBadgeStyle: CSSProperties = {
  flex: "0 1 42%",
  maxWidth: "42%",
  minHeight: "34px",
  padding: "0 10px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 18%, var(--historietas-surface, rgba(255,255,255,0.06))) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, var(--historietas-surface, rgba(255,255,255,0.06))) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 30%, var(--historietas-border-soft, rgba(255,255,255,0.13)))",
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

const progressCompactStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "8px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const progressTrackStyle: CSSProperties = {
  width: "100%",
  height: "7px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.1))",
  overflow: "hidden",
  boxSizing: "border-box",
};

const progressBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
};

const progressTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

const readNowStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  minHeight: "34px",
  padding: "0 14px",
  marginTop: "4px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 74%, #FFFFFF) 100%)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1.15,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const mobileCardPrimaryActionStyle: CSSProperties = {
  ...readNowStyle,
  flex: "1 1 auto",
  minWidth: 0,
  marginTop: 0,
  padding: "0 12px",
  textAlign: "center",
};

const mobileCardSecondaryActionStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  maxWidth: "100%",
  minHeight: "34px",
  padding: "0 12px",
  marginTop: 0,
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.07))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1.15,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const desktopCardActionRowStyle: CSSProperties = {
  ...mobileCardActionRowStyle,
  overflow: "visible",
};

const desktopCardGenreBadgeStyle: CSSProperties = {
  ...mobileCardGenreBadgeStyle,
  flex: "0 1 46%",
  maxWidth: "46%",
  padding: "0 8px",
  textAlign: "center",
  whiteSpace: "normal",
  overflow: "visible",
  textOverflow: "clip",
};

const desktopCardPrimaryActionStyle: CSSProperties = {
  ...mobileCardPrimaryActionStyle,
  justifyContent: "center",
  textAlign: "center",
};

const desktopCardSecondaryActionStyle: CSSProperties = {
  ...mobileCardSecondaryActionStyle,
  justifyContent: "center",
  textAlign: "center",
};

const obraCardStyle: CSSProperties = {
  flex: "0 0 min(360px, 88vw)",
  width: "min(360px, 88vw)",
  scrollSnapAlign: "start",
  display: "grid",
  gridTemplateColumns: "minmax(88px, 98px) minmax(0, 1fr)",
  gap: "14px",
  alignItems: "stretch",
  padding: "11px",
  borderRadius: "22px",
  background:
    "linear-gradient(145deg, var(--historietas-surface, rgba(26,17,43,0.96)) 0%, var(--historietas-surface-strong, rgba(13,9,25,0.98)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "88vw",
  overflow: "hidden",
  boxShadow:
    "var(--historietas-card-shadow, 0 12px 28px rgba(0,0,0,0.22))",
  boxSizing: "border-box",
};

const desktopObraCardStyle: CSSProperties = {
  ...obraCardStyle,
  flex: "0 0 410px",
  width: "410px",
  maxWidth: "100%",
  gridTemplateColumns: "112px minmax(0, 1fr)",
  gap: "15px",
  padding: "13px",
  borderRadius: "24px",
  boxShadow:
    "var(--historietas-card-shadow, 0 14px 34px rgba(0,0,0,0.24))",
};

const obraCardSoonStyle: CSSProperties = {
  ...obraCardStyle,
  opacity: 0.9,
};

const desktopObraCardSoonStyle: CSSProperties = {
  ...desktopObraCardStyle,
  opacity: 0.9,
};

const coverThumbStyle: CSSProperties = {
  minHeight: "122px",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  backgroundImage:
    "radial-gradient(circle at top left, color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 62%, transparent), transparent 36%), linear-gradient(135deg, #18181B 0%, #0F0F0F 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopCoverThumbStyle: CSSProperties = {
  ...coverThumbStyle,
  minHeight: "142px",
  borderRadius: "18px",
};

const obraInfoStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  display: "grid",
  alignContent: "center",
  gap: "7px",
};

const obraTitleStyle: CSSProperties = {
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

const desktopObraTitleStyle: CSSProperties = {
  ...obraTitleStyle,
  fontSize: "21px",
  lineHeight: 1.06,
};

const statusBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background:
    "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 850,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const soonBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(113, 113, 122, 0.18)",
  border: "1px solid rgba(161, 161, 170, 0.22)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const authorStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D8C8FF)",
  fontSize: "12px",
  fontWeight: 750,
  maxWidth: "100%",
  ...safeTextStyle,
};

const soonLabelStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  minHeight: "31px",
  padding: "0 12px",
  marginTop: "3px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1.15,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const emptyBoxStyle: CSSProperties = {
  padding: "28px",
  borderRadius: "22px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#B3B3B3",
  fontWeight: 800,
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
  overflow: "hidden",
  ...safeTextStyle,
};