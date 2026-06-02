"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { obras } from "../data/obras";
import type { Obra } from "../data/obras";
import { supabase } from "../../lib/supabase/client";

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
  texto: string | null;
  ordem: number | null;
  publicado: boolean | null;
  criado_em: string | null;
  atualizado_em: string | null;
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
  | "sobrenatural"
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

const formatosBase = [
  "Webnovel",
  "Light novel",
  "Fanfic",
  "Mangá",
  "Webtoon",
  "Conto",
  "Crônica",
  "Roteiro",
  "História Original",
  "Poesia",
  "Novel",
  "Livro",
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

function converterMetricaParaNumero(valor: string) {
  const texto = valor.trim().toLowerCase().replace(",", ".");

  if (texto.endsWith("k")) {
    return Number(texto.replace("k", "")) * 1000;
  }

  return Number(texto) || 0;
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

function carregarBackupArquivosObras(): ArquivosObrasBackup {
  try {
    const backupTexto = localStorage.getItem(FILE_BACKUP_STORAGE_KEY);
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
  slug: string
) {
  const arquivoAtual = normalizarArquivoObra(obra.arquivoObra);

  if (arquivoAtual) {
    return arquivoAtual;
  }

  const backupArquivos = carregarBackupArquivosObras();
  const chaves = criarChavesBackupObra(obra, slug);

  for (const chave of chaves) {
    const arquivoBackup = normalizarArquivoObra(backupArquivos[chave]);

    if (arquivoBackup) {
      return arquivoBackup;
    }
  }

  return null;
}

function salvarBackupsArquivosObras(obrasParaSalvar: ObraLocal[]) {
  const backupAtual = carregarBackupArquivosObras();
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

  localStorage.setItem(FILE_BACKUP_STORAGE_KEY, JSON.stringify(proximoBackup));
}

function normalizarObra(
  obra: Partial<ObraLocal> & Record<string, unknown>,
  index: number
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
    arquivoObra: obterArquivoObraComBackup(obra, slug),
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
        texto: capitulo.texto || capituloLocal?.texto || "",
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

async function carregarObrasPublicadasSupabase(obrasLocais: ObraLocal[]) {
  try {
    const { data: obrasBanco, error: erroObras } = await supabase
      .from("obras")
      .select("*")
      .eq("publicado", true)
      .order("criada_em", { ascending: false });

    if (erroObras) {
      console.warn(
        "Não consegui carregar obras publicadas do Supabase:",
        erroObras.message
      );
      return obrasLocais;
    }

    const obrasSupabase = ((obrasBanco || []) as SupabaseObraRow[]).filter(
      (obra) => Boolean(obra.id)
    );

    if (obrasSupabase.length === 0) {
      return obrasLocais;
    }

    const idsObras = obrasSupabase.map((obra) => obra.id);
    const { data: capitulosBanco, error: erroCapitulos } = await supabase
      .from("capitulos")
      .select("*")
      .in("obra_id", idsObras)
      .order("ordem", { ascending: true });

    if (erroCapitulos) {
      console.warn(
        "Não consegui carregar capítulos do Supabase no Explorar:",
        erroCapitulos.message
      );
    }

    const capitulosPorObra = new Map<string, SupabaseCapituloRow[]>();

    ((erroCapitulos ? [] : capitulosBanco || []) as SupabaseCapituloRow[]).forEach(
      (capitulo) => {
        const capitulosAtuais = capitulosPorObra.get(capitulo.obra_id) || [];
        capitulosAtuais.push(capitulo);
        capitulosPorObra.set(capitulo.obra_id, capitulosAtuais);
      }
    );

    const obrasSupabaseNormalizadas = obrasSupabase.map((obraBanco, index) => {
      const slugBanco = obraBanco.slug?.trim() || "";
      const obraLocal = obrasLocais.find((obraLocalAtual) => {
        const slugLocal =
          obraLocalAtual.slug || criarSlugBase(obraLocalAtual.titulo);

        return obraLocalAtual.id === obraBanco.id || slugLocal === slugBanco;
      });

      return normalizarObraSupabase(
        obraBanco,
        capitulosPorObra.get(obraBanco.id) || [],
        obraLocal,
        index
      );
    });

    const obrasMescladas = mesclarObrasSemDuplicar(
      obrasLocais,
      obrasSupabaseNormalizadas
    );

    salvarBackupsArquivosObras(obrasMescladas);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obrasMescladas));

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

function ordenarObrasFixas(lista: Obra[], ordenacao: OrdenacaoExplorar) {
  const novaLista = [...lista];

  if (ordenacao === "mais-curtidas") {
    return novaLista.sort(
      (a, b) =>
        converterMetricaParaNumero(b.likes) -
        converterMetricaParaNumero(a.likes)
    );
  }

  if (ordenacao === "mais-comentadas") {
    return novaLista.sort(
      (a, b) =>
        converterMetricaParaNumero(b.comentarios) -
        converterMetricaParaNumero(a.comentarios)
    );
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

function obterTemaCategoria(categoria: string) {
  const categoriaNormalizada = normalizarTexto(categoria);

  if (categoriaNormalizada === "fantasia") {
    return {
      accent: "#A78BFA",
      activeBackground: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
      pageBackground:
        "radial-gradient(circle at 18% 0%, rgba(124,58,237,0.36), transparent 30%), radial-gradient(circle at 90% 20%, rgba(167,139,250,0.16), transparent 24%), radial-gradient(circle at 50% 100%, rgba(249,115,22,0.08), transparent 30%), linear-gradient(180deg, #10071F 0%, #180B2D 42%, #1B1030 75%, #17101F 100%)",
      heroBackground:
        "radial-gradient(circle at 16% 0%, rgba(167,139,250,0.46), transparent 32%), radial-gradient(circle at 90% 45%, rgba(124,58,237,0.22), transparent 30%), linear-gradient(135deg, rgba(27,13,48,0.98) 0%, rgba(12,7,23,0.98) 100%)",
    };
  }

  if (categoriaNormalizada === "romance") {
    return {
      accent: "#F472B6",
      activeBackground: "linear-gradient(135deg, #BE185D 0%, #F472B6 100%)",
      pageBackground:
        "radial-gradient(circle at 18% 0%, rgba(244,114,182,0.30), transparent 30%), radial-gradient(circle at 90% 20%, rgba(124,58,237,0.18), transparent 24%), radial-gradient(circle at 50% 100%, rgba(249,115,22,0.08), transparent 30%), linear-gradient(180deg, #120718 0%, #1D0A23 42%, #21102D 75%, #17101F 100%)",
      heroBackground:
        "radial-gradient(circle at 16% 0%, rgba(244,114,182,0.42), transparent 32%), radial-gradient(circle at 90% 45%, rgba(190,24,93,0.20), transparent 30%), linear-gradient(135deg, rgba(34,13,40,0.98) 0%, rgba(12,7,23,0.98) 100%)",
    };
  }

  if (categoriaNormalizada === "terror") {
    return {
      accent: "#FB7185",
      activeBackground: "linear-gradient(135deg, #7F1D1D 0%, #FB7185 100%)",
      pageBackground:
        "radial-gradient(circle at 18% 0%, rgba(127,29,29,0.34), transparent 30%), radial-gradient(circle at 90% 20%, rgba(124,58,237,0.12), transparent 24%), radial-gradient(circle at 50% 100%, rgba(249,115,22,0.08), transparent 30%), linear-gradient(180deg, #0B060B 0%, #16080D 42%, #1B0E1E 75%, #161016 100%)",
      heroBackground:
        "radial-gradient(circle at 16% 0%, rgba(127,29,29,0.44), transparent 32%), radial-gradient(circle at 90% 45%, rgba(251,113,133,0.16), transparent 30%), linear-gradient(135deg, rgba(30,10,16,0.98) 0%, rgba(9,7,13,0.98) 100%)",
    };
  }

  if (categoriaNormalizada === "acao") {
    return {
      accent: "#F97316",
      activeBackground: "linear-gradient(135deg, #EA580C 0%, #F97316 100%)",
      pageBackground:
        "radial-gradient(circle at 18% 0%, rgba(249,115,22,0.22), transparent 30%), radial-gradient(circle at 90% 20%, rgba(124,58,237,0.18), transparent 24%), radial-gradient(circle at 50% 100%, rgba(249,115,22,0.09), transparent 30%), linear-gradient(180deg, #100712 0%, #170A22 42%, #1A0D2B 75%, #1A1217 100%)",
      heroBackground:
        "radial-gradient(circle at 16% 0%, rgba(249,115,22,0.28), transparent 32%), radial-gradient(circle at 90% 45%, rgba(124,58,237,0.20), transparent 30%), linear-gradient(135deg, rgba(27,13,33,0.98) 0%, rgba(12,7,23,0.98) 100%)",
    };
  }

  if (categoriaNormalizada === "ficcao" || categoriaNormalizada === "sci-fi" || categoriaNormalizada === "sci fi") {
    return {
      accent: "#38BDF8",
      activeBackground: "linear-gradient(135deg, #0369A1 0%, #38BDF8 100%)",
      pageBackground:
        "radial-gradient(circle at 18% 0%, rgba(56,189,248,0.24), transparent 30%), radial-gradient(circle at 90% 20%, rgba(124,58,237,0.18), transparent 24%), radial-gradient(circle at 50% 100%, rgba(249,115,22,0.06), transparent 30%), linear-gradient(180deg, #06111F 0%, #091B2D 42%, #11172E 75%, #11111F 100%)",
      heroBackground:
        "radial-gradient(circle at 16% 0%, rgba(56,189,248,0.30), transparent 32%), radial-gradient(circle at 90% 45%, rgba(124,58,237,0.20), transparent 30%), linear-gradient(135deg, rgba(9,27,45,0.98) 0%, rgba(8,7,23,0.98) 100%)",
    };
  }

  if (categoriaNormalizada === "drama") {
    return {
      accent: "#C084FC",
      activeBackground: "linear-gradient(135deg, #581C87 0%, #C084FC 100%)",
      pageBackground:
        "radial-gradient(circle at 18% 0%, rgba(192,132,252,0.24), transparent 30%), radial-gradient(circle at 90% 20%, rgba(249,115,22,0.08), transparent 24%), radial-gradient(circle at 50% 100%, rgba(249,115,22,0.07), transparent 30%), linear-gradient(180deg, #0E0718 0%, #160A24 42%, #1B1029 75%, #17101F 100%)",
      heroBackground:
        "radial-gradient(circle at 16% 0%, rgba(192,132,252,0.30), transparent 32%), radial-gradient(circle at 90% 45%, rgba(88,28,135,0.22), transparent 30%), linear-gradient(135deg, rgba(24,13,39,0.98) 0%, rgba(12,7,23,0.98) 100%)",
    };
  }

  if (categoriaNormalizada === "aventura") {
    return {
      accent: "#FBBF24",
      activeBackground: "linear-gradient(135deg, #B45309 0%, #FBBF24 100%)",
      pageBackground:
        "radial-gradient(circle at 18% 0%, rgba(251,191,36,0.18), transparent 30%), radial-gradient(circle at 90% 20%, rgba(124,58,237,0.18), transparent 24%), radial-gradient(circle at 50% 100%, rgba(249,115,22,0.08), transparent 30%), linear-gradient(180deg, #100B06 0%, #181020 42%, #1B1129 75%, #17101F 100%)",
      heroBackground:
        "radial-gradient(circle at 16% 0%, rgba(251,191,36,0.24), transparent 32%), radial-gradient(circle at 90% 45%, rgba(124,58,237,0.20), transparent 30%), linear-gradient(135deg, rgba(31,20,12,0.98) 0%, rgba(12,7,23,0.98) 100%)",
    };
  }

  if (categoriaNormalizada === "comedia") {
    return {
      accent: "#FDE047",
      activeBackground: "linear-gradient(135deg, #CA8A04 0%, #FDE047 100%)",
      pageBackground:
        "radial-gradient(circle at 18% 0%, rgba(253,224,71,0.22), transparent 30%), radial-gradient(circle at 90% 20%, rgba(249,115,22,0.16), transparent 24%), radial-gradient(circle at 50% 100%, rgba(124,58,237,0.08), transparent 30%), linear-gradient(180deg, #100D05 0%, #18120A 42%, #1B1328 75%, #17101F 100%)",
      heroBackground:
        "radial-gradient(circle at 16% 0%, rgba(253,224,71,0.28), transparent 32%), radial-gradient(circle at 90% 45%, rgba(249,115,22,0.18), transparent 30%), linear-gradient(135deg, rgba(31,23,10,0.98) 0%, rgba(12,7,23,0.98) 100%)",
    };
  }

  if (categoriaNormalizada === "sobrenatural") {
    return {
      accent: "#34D399",
      activeBackground: "linear-gradient(135deg, #065F46 0%, #34D399 100%)",
      pageBackground:
        "radial-gradient(circle at 18% 0%, rgba(52,211,153,0.20), transparent 30%), radial-gradient(circle at 90% 20%, rgba(124,58,237,0.18), transparent 24%), radial-gradient(circle at 50% 100%, rgba(249,115,22,0.06), transparent 30%), linear-gradient(180deg, #06120D 0%, #0B1D1C 42%, #12172B 75%, #10171A 100%)",
      heroBackground:
        "radial-gradient(circle at 16% 0%, rgba(52,211,153,0.24), transparent 32%), radial-gradient(circle at 90% 45%, rgba(124,58,237,0.18), transparent 30%), linear-gradient(135deg, rgba(8,30,22,0.98) 0%, rgba(12,7,23,0.98) 100%)",
    };
  }

  return {
    accent: "#F97316",
    activeBackground: "linear-gradient(135deg, #7C3AED 0%, #F97316 100%)",
    pageBackground:
      "radial-gradient(circle at 14% 0%, rgba(124,58,237,0.22), transparent 28%), radial-gradient(circle at 86% 18%, rgba(91,33,182,0.14), transparent 22%), radial-gradient(circle at 50% 100%, rgba(249,115,22,0.10), transparent 28%), linear-gradient(180deg, #0D0618 0%, #12081F 26%, #170A28 52%, #1A0D2B 72%, #1B1026 86%, #1A1217 100%)",
    heroBackground:
      "radial-gradient(circle at 18% 0%, rgba(124,58,237,0.42), transparent 32%), radial-gradient(circle at 90% 45%, rgba(249,115,22,0.12), transparent 28%), linear-gradient(135deg, rgba(26,13,43,0.98) 0%, rgba(12,7,23,0.98) 100%)",
  };
}

function criarTemaPaginaVisualExplorar(
  temaVisual: TemaVisualExplorar,
  tema: TemaVisualExplorarConfig,
  temaCategoria: ReturnType<typeof obterTemaCategoria>,
  categoriaSelecionada: string
): ReturnType<typeof obterTemaCategoria> {
  if (categoriaSelecionada.trim()) {
    return temaCategoria;
  }

  if (temaVisual === "original") {
    return temaCategoria;
  }

  const isBranco = temaVisual === "branco";
  const isEscuro = temaVisual === "escuro";
  const surface = tema.surface || "rgba(18,12,30,0.82)";
  const surfaceStrong = tema.surfaceStrong || "rgba(18,12,30,0.98)";

  if (isBranco) {
    return {
      accent: tema.accent,
      activeBackground: `linear-gradient(135deg, ${tema.accent} 0%, ${tema.secondary} 100%)`,
      pageBackground:
        "linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 56%, #F8F9FA 100%)",
      heroBackground:
        "linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 54%, #EEF3FE 100%)",
    };
  }

  if (isEscuro) {
    return {
      accent: tema.accent,
      activeBackground: `linear-gradient(135deg, ${tema.accent} 0%, ${tema.secondary} 100%)`,
      pageBackground: "linear-gradient(180deg, #000000 0%, #000000 100%)",
      heroBackground:
        "linear-gradient(135deg, #050505 0%, #000000 58%, #050505 100%)",
    };
  }

  return {
    accent: tema.accent,
    activeBackground: `linear-gradient(135deg, ${tema.accent} 0%, ${tema.secondary} 100%)`,
    pageBackground: `radial-gradient(circle at 18% 0%, ${tema.glowPrimary}, transparent 30%), radial-gradient(circle at 90% 20%, ${tema.glowSecondary}, transparent 24%), linear-gradient(180deg, ${tema.bgStart} 0%, ${tema.bgMid} 44%, ${tema.bgEnd} 100%)`,
    heroBackground: `radial-gradient(circle at 16% 0%, ${tema.glowPrimary}, transparent 32%), radial-gradient(circle at 90% 45%, ${tema.glowSecondary}, transparent 30%), linear-gradient(135deg, ${surface} 0%, ${surfaceStrong} 100%)`,
  };
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
  index: number,
  tema: ReturnType<typeof obterTemaCategoria>
): CSSProperties {
  const posicoes: CSSProperties[] = [
    { top: "8%", right: "8%", fontSize: "42px", transform: "rotate(-12deg)" },
    { top: "48%", right: "15%", fontSize: "28px", transform: "rotate(16deg)" },
    { bottom: "12%", right: "6%", fontSize: "34px", transform: "rotate(8deg)" },
    { top: "16%", left: "8%", fontSize: "22px", transform: "rotate(14deg)" },
    { bottom: "16%", left: "18%", fontSize: "26px", transform: "rotate(-10deg)" },
  ];

  return {
    position: "absolute",
    color: tema.accent,
    opacity: 0.13,
    lineHeight: 1,
    fontWeight: 950,
    filter: `drop-shadow(0 0 18px ${tema.accent}55)`,
    userSelect: "none",
    ...posicoes[index % posicoes.length],
  };
}

export default function ExplorarPage() {
  const [obrasLocais, setObrasLocais] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroFormato, setFiltroFormato] = useState("todos");
  const [filtroClassificacao, setFiltroClassificacao] = useState("todos");
  const [filtroCapitulos, setFiltroCapitulos] = useState("todos");
  const [filtroColecao, setFiltroColecao] =
    useState<FiltroColecaoExplorar>("todos");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoExplorar>("relevancia");
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [temaVisual, setTemaVisual] = useState<TemaVisualExplorar>("original");

  useEffect(() => {
    const temaSalvo = carregarTemaVisualExplorarSalvo();

    setTemaVisual(temaSalvo);
    aplicarTemaVisualExplorar(temaSalvo);
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

    async function carregarExplorar() {
      const params = new URLSearchParams(window.location.search);
      const categoriaParam = params.get("categoria") || "";

      setCategoriaSelecionada(categoriaParam.trim());

      try {
        const obrasSalvasTexto = localStorage.getItem(STORAGE_KEY);
        const obrasSalvasJson = obrasSalvasTexto
          ? JSON.parse(obrasSalvasTexto)
          : [];

        const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
          ? obrasSalvasJson.map((obra, index) => normalizarObra(obra, index))
          : [];

        salvarBackupsArquivosObras(obrasNormalizadas);
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

        if (!cancelado) {
          setObrasLocais(obrasNormalizadas);
          setObrasFavoritas(obrasFavoritasNormalizadas);
          setObrasConcluidas(obrasConcluidasNormalizadas);
        }

        const obrasComSupabase = await carregarObrasPublicadasSupabase(
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
        }
      }
    }

    carregarExplorar();

    return () => {
      cancelado = true;
    };
  }, []);

  const termoBusca = normalizarTexto(busca);

  const formatosDisponiveis = useMemo(() => {
    const formatosLocais = obrasLocais
      .map((obra) => obra.formato)
      .filter((formato) => formato && formato !== "Não informado");

    return Array.from(new Set([...formatosBase, ...formatosLocais])).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [obrasLocais]);

  const classificacoesDisponiveis = useMemo(() => {
    const classificacoesLocais = obrasLocais
      .map((obra) => obra.classificacaoIndicativa)
      .filter(
        (classificacao) => classificacao && classificacao !== "Não informada"
      );

    const classificacoesFixas = obras
      .map((obra) => obra.classificacaoIndicativa)
      .filter((classificacao) => classificacao && classificacao.trim());

    return Array.from(
      new Set([...classificacoesLocais, ...classificacoesFixas])
    ).sort((a, b) => a.localeCompare(b));
  }, [obrasLocais]);

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

      const passaPublicacao = obra.publicado;

      const passaCapitulos =
        filtroCapitulos === "todos"
          ? true
          : filtroCapitulos === "com-capitulos"
            ? obra.capitulos.length > 0
            : obra.capitulos.length === 0;

      const passaColecao =
        filtroColecao === "todos"
          ? true
          : filtroColecao === "favoritas"
            ? obrasFavoritas.includes(obra.id)
            : filtroColecao === "concluidas"
              ? obrasConcluidas.includes(obra.id)
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
    termoBusca,
    ordenacao,
    obrasFavoritas,
    obrasConcluidas,
  ]);

  const obrasFixasFiltradas = useMemo(() => {
    const filtradas = obras.filter((obra) => {
      const passaCategoria = categoriaSelecionada
        ? categoriaCombinaComGenero(categoriaSelecionada, obra.genero)
        : true;

      const passaFormato = filtroFormato === "todos";

      const passaClassificacao =
        filtroClassificacao === "todos"
          ? true
          : obra.classificacaoIndicativa === filtroClassificacao;

      const passaPublicacao = obra.disponivel;

      const passaCapitulos =
        filtroCapitulos === "todos"
          ? true
          : filtroCapitulos === "com-capitulos"
            ? false
            : true;

      const passaColecao = filtroColecao === "todos";

      const textoBusca = normalizarTexto(
        [
          obra.titulo,
          obra.autor,
          obra.genero,
          obra.classificacaoIndicativa,
          obra.status,
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

    return ordenarObrasFixas(filtradas, ordenacao);
  }, [
    categoriaSelecionada,
    filtroFormato,
    filtroClassificacao,
    filtroCapitulos,
    filtroColecao,
    termoBusca,
    ordenacao,
  ]);

  const totalResultados =
    obrasLocaisFiltradas.length + obrasFixasFiltradas.length;

  const totalFavoritasResultado = obrasLocaisFiltradas.filter((obra) =>
    obrasFavoritas.includes(obra.id)
  ).length;

  const totalConcluidasResultado = obrasLocaisFiltradas.filter((obra) =>
    obrasConcluidas.includes(obra.id)
  ).length;

  const totalLendoResultado = obrasLocaisFiltradas.filter((obra) =>
    obraTemAtividadeLeitura(obra)
  ).length;

  const filtrosAtivos = Boolean(
    categoriaSelecionada ||
      termoBusca ||
      filtroFormato !== "todos" ||
      filtroClassificacao !== "todos" ||
      filtroCapitulos !== "todos" ||
      filtroColecao !== "todos" ||
      ordenacao !== "relevancia"
  );

  const totalFiltrosAvancadosAtivos = [
    filtroFormato !== "todos",
    filtroClassificacao !== "todos",
    filtroCapitulos !== "todos",
    ordenacao !== "relevancia",
  ].filter(Boolean).length;

  const textoBotaoFiltrosAvancados =
    totalFiltrosAvancadosAtivos > 0
      ? `Filtros avançados (${totalFiltrosAvancadosAtivos})`
      : "Filtros avançados";

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
      delete raiz.dataset.historietasExplorarCategoriaAtiva;
      delete document.body.dataset.historietasExplorarCategoriaAtiva;
      document.body.style.background = "";
      raiz.style.background = "";
      return;
    }

    raiz.dataset.historietasExplorarCategoriaAtiva = "true";
    document.body.dataset.historietasExplorarCategoriaAtiva = "true";
    raiz.style.setProperty("--historietas-accent", temaCategoria.accent);
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

  const textoTotalResultados =
    totalResultados === 1
      ? "1 história encontrada"
      : `${totalResultados} histórias encontradas`;

  const detalhesResumo = [
    obrasLocaisFiltradas.length > 0
      ? `${obrasLocaisFiltradas.length} ${
          obrasLocaisFiltradas.length === 1 ? "publicação" : "publicações"
        } da comunidade`
      : "",
    obrasFixasFiltradas.length > 0
      ? `${obrasFixasFiltradas.length} do catálogo inicial`
      : "",
    totalLendoResultado > 0 ? `${totalLendoResultado} em leitura` : "",
    totalFavoritasResultado > 0
      ? `${totalFavoritasResultado} na lista`
      : "",
    totalConcluidasResultado > 0
      ? `${totalConcluidasResultado} ${
          totalConcluidasResultado === 1 ? "concluída" : "concluídas"
        }`
      : "",
  ].filter(Boolean);

  const resumoItens = [textoTotalResultados, ...detalhesResumo];

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

  function limparFiltros() {
    setCategoriaSelecionada("");
    setBusca("");
    setFiltroFormato("todos");
    setFiltroClassificacao("todos");
    setFiltroCapitulos("todos");
    setFiltroColecao("todos");
    setOrdenacao("relevancia");
    setMostrarFiltrosAvancados(false);
    window.history.pushState(null, "", "/explorar");
  }

  return (
    <main style={pageStyle}>
      <style>{themePageCss}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}

      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTopStyle : mobileTopStyle}>
          <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
            <span style={logoMarkStyle}>H</span>
            <span className="historietas-explorar-logo-text" style={logoTextStyle}>istorietas</span>
          </Link>

          <div style={isDesktop ? desktopTopActionsStyle : topActionsStyle}>
            <Link href="/em-breve" style={isDesktop ? desktopSoonTopButtonStyle : soonTopButtonStyle}>
              Em breve
            </Link>
          </div>
        </header>

        <section style={{ ...(isDesktop ? desktopHeroStyle : mobileHeroStyle), background: temaPagina.heroBackground }}>
          <div style={heroDecorationLayerStyle} aria-hidden="true">
            {decoracoesTema.map((decoracao, index) => (
              <span
                key={`${decoracao}-${index}`}
                style={criarDecoracaoTemaStyle(index, temaPagina)}
              >
                {decoracao}
              </span>
            ))}
          </div>


          <h1 className="historietas-explorar-hero-title" style={isDesktop ? desktopTitleStyle : titleStyle}>
            {categoriaSelecionada
              ? `${categoriaSelecionada}`
              : "Explorar histórias"}
          </h1>

          <p style={isDesktop ? desktopDescriptionStyle : descriptionStyle}>
            Descubra histórias, mangás, fanfics e obras autorais por gênero,
            estilo de leitura e momento da sua biblioteca.
          </p>
        </section>

        <section style={isDesktop ? desktopCategoriesStyle : categoriesStyle} aria-label="Categorias">
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

        <p style={criarCompactSummaryStyle(temaPagina, isDesktop, categoriaAtiva)}>
          {resumoItens.map((item, index) => (
            <span key={item} style={compactSummaryItemStyle}>
              {index > 0 && <span style={compactSummarySeparatorStyle}>•</span>}
              {item}
            </span>
          ))}
        </p>

        <section style={isDesktop ? criarDesktopSearchBoxStyle(temaPagina, categoriaAtiva) : criarSearchBoxStyle(temaPagina, categoriaAtiva)}>
          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por título, autor, gênero ou tags..."
            style={criarSearchInputStyle(temaPagina, isDesktop, categoriaAtiva)}
            type="text"
          />

          <div style={isDesktop ? desktopQuickFiltersStyle : quickFiltersStyle}>
            <button
              type="button"
              onClick={() => setFiltroColecao("todos")}
              style={
                filtroColecao === "todos"
                  ? criarQuickFilterActiveStyle(temaPagina, isDesktop)
                  : isDesktop
                    ? criarQuickFilterInactiveStyle(temaPagina, true, categoriaAtiva)
                    : criarQuickFilterInactiveStyle(temaPagina, false, categoriaAtiva)
              }
            >
              Todas
            </button>

            <button
              type="button"
              onClick={() => setFiltroColecao("lendo")}
              style={
                filtroColecao === "lendo"
                  ? criarQuickFilterActiveStyle(temaPagina, isDesktop)
                  : isDesktop
                    ? criarQuickFilterInactiveStyle(temaPagina, true, categoriaAtiva)
                    : criarQuickFilterInactiveStyle(temaPagina, false, categoriaAtiva)
              }
            >
              Lendo agora
            </button>

            <button
              type="button"
              onClick={() => setFiltroColecao("favoritas")}
              style={
                filtroColecao === "favoritas"
                  ? criarQuickFilterActiveStyle(temaPagina, isDesktop)
                  : isDesktop
                    ? criarQuickFilterInactiveStyle(temaPagina, true, categoriaAtiva)
                    : criarQuickFilterInactiveStyle(temaPagina, false, categoriaAtiva)
              }
            >
              Na lista
            </button>

            <button
              type="button"
              onClick={() => setFiltroColecao("concluidas")}
              style={
                filtroColecao === "concluidas"
                  ? criarQuickFilterActiveStyle(temaPagina, isDesktop)
                  : isDesktop
                    ? criarQuickFilterInactiveStyle(temaPagina, true, categoriaAtiva)
                    : criarQuickFilterInactiveStyle(temaPagina, false, categoriaAtiva)
              }
            >
              Concluídas
            </button>

            <button
              type="button"
              onClick={() => setFiltroColecao("sem-leitura")}
              style={
                filtroColecao === "sem-leitura"
                  ? criarQuickFilterActiveStyle(temaPagina, isDesktop)
                  : isDesktop
                    ? criarQuickFilterInactiveStyle(temaPagina, true, categoriaAtiva)
                    : criarQuickFilterInactiveStyle(temaPagina, false, categoriaAtiva)
              }
            >
              Sem leitura
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMostrarFiltrosAvancados((valorAtual) => !valorAtual)}
            style={criarToggleFiltrosStyle(temaPagina, categoriaAtiva)}
          >
            <span>{textoBotaoFiltrosAvancados}</span>
            <span>{mostrarFiltrosAvancados ? "↑" : "↓"}</span>
          </button>

          {mostrarFiltrosAvancados && (
            <div style={isDesktop ? desktopAdvancedFiltersStyle : advancedFiltersStyle}>
            <div style={criarFieldBoxStyle(temaPagina, categoriaAtiva)}>
              <label style={criarSearchLabelStyle(categoriaAtiva)}>Formato</label>

              <select
                value={filtroFormato}
                onChange={(event) => setFiltroFormato(event.target.value)}
                style={criarSelectStyle(temaPagina, categoriaAtiva)}
              >
                <option value="todos">Todos os formatos</option>

                {formatosDisponiveis.map((formato) => (
                  <option key={formato} value={formato}>
                    {formato}
                  </option>
                ))}
              </select>
            </div>

            <div style={criarFieldBoxStyle(temaPagina, categoriaAtiva)}>
              <label style={criarSearchLabelStyle(categoriaAtiva)}>Classificação</label>

              <select
                value={filtroClassificacao}
                onChange={(event) => setFiltroClassificacao(event.target.value)}
                style={criarSelectStyle(temaPagina, categoriaAtiva)}
              >
                <option value="todos">Todas</option>

                {classificacoesDisponiveis.map((classificacao) => (
                  <option key={classificacao} value={classificacao}>
                    {classificacao}
                  </option>
                ))}
              </select>
            </div>

            <div style={criarFieldBoxStyle(temaPagina, categoriaAtiva)}>
              <label style={criarSearchLabelStyle(categoriaAtiva)}>Capítulos</label>

              <select
                value={filtroCapitulos}
                onChange={(event) => setFiltroCapitulos(event.target.value)}
                style={criarSelectStyle(temaPagina, categoriaAtiva)}
              >
                <option value="todos">Com ou sem capítulos</option>
                <option value="com-capitulos">Com capítulos</option>
                <option value="sem-capitulos">Sem capítulos</option>
              </select>
            </div>

            <div style={criarFieldBoxStyle(temaPagina, categoriaAtiva)}>
              <label style={criarSearchLabelStyle(categoriaAtiva)}>Ordenar</label>

              <select
                value={ordenacao}
                onChange={(event) =>
                  setOrdenacao(event.target.value as OrdenacaoExplorar)
                }
                style={criarSelectStyle(temaPagina, categoriaAtiva)}
              >
                <option value="relevancia">Relevância</option>
                <option value="mais-curtidas">Mais curtidas</option>
                <option value="mais-salvas">Mais salvas</option>
                <option value="mais-comentadas">Mais comentadas</option>
                <option value="mais-recentes">Mais recentes</option>
                <option value="mais-capitulos">Mais capítulos</option>
              </select>
            </div>
            </div>
          )}

          {filtrosAtivos && (
            <div style={isDesktop ? desktopCompactClearFiltersStyle : compactClearFiltersStyle}>
              <button
                type="button"
                onClick={limparFiltros}
                style={criarClearFilterButtonStyle(temaPagina, categoriaAtiva)}
              >
                Limpar filtros
              </button>
            </div>
          )}
        </section>

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
                  favorita={obrasFavoritas.includes(obra.id)}
                  concluida={obrasConcluidas.includes(obra.id)}
                  tema={temaPagina}
                  isDesktop={isDesktop}
                />
              ))}
            </div>
          </section>
        )}

        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <SectionHeader
            title={
              categoriaSelecionada
                ? `Catálogo em ${categoriaSelecionada}`
                : "Catálogo inicial"
            }
            tema={temaPagina}
            isDesktop={isDesktop}
          />

          {obrasFixasFiltradas.length > 0 ? (
            <div style={isDesktop ? desktopGridStyle : gridStyle}>
              {obrasFixasFiltradas.map((obra) => (
                <ObraFixaCard key={obra.titulo} obra={obra} tema={temaPagina} isDesktop={isDesktop} />
              ))}
            </div>
          ) : totalResultados > 0 ? (
            <div style={isDesktop ? desktopEmptyBoxStyle : emptyBoxStyle}>
              Nenhuma obra do catálogo inicial encontrada com esses filtros.
            </div>
          ) : null}
        </section>

        {totalResultados === 0 && (
          <section style={isDesktop ? desktopEmptyBoxStyle : emptyBoxStyle}>
            Nenhuma obra encontrada no Explorar. Tente limpar os filtros ou usar
            outra busca.
          </section>
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
    color: tema.accent,
    textAlign: "center",
  };

  return (
    <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
      <h2 style={titleStyleTema}>{title}</h2>
    </div>
  );
}

function ObraFixaCard({ obra, tema, isDesktop }: { obra: Obra; tema: ReturnType<typeof obterTemaCategoria>; isDesktop?: boolean }) {
  const obraHref = obra.disponivel
    ? obra.link
    : `/em-breve?obra=${encodeURIComponent(obra.titulo)}`;

  const conteudoCard = (
    <>
      <div style={isDesktop ? criarDesktopCoverTemaStyle(tema) : criarCoverTemaStyle(tema)} />

      <div style={cardContentStyle}>
        <div style={cardTopStyle}>
          <h3 style={isDesktop ? desktopCardTitleStyle : cardTitleStyle}>{obra.titulo}</h3>

          <div style={statusRowStyle}>
            <span style={statusStyle}>{obra.status}</span>
            <span style={classificationBadgeStyle}>
              {obra.classificacaoIndicativa}
            </span>
            {!obra.disponivel && <span style={soonBadgeStyle}>Em breve</span>}
          </div>
        </div>

        <p style={authorStyle}>Por {obra.autor}</p>

        <div style={statsStyle}>
          <span style={metricItemStyle}>
            <span style={metricIconStyle}>👁</span>
            {obra.views}
          </span>

          <span style={metricItemStyle}>
            <span style={heartMetricIconStyle}>♥</span>
            {obra.likes}
          </span>

          <span style={metricItemStyle}>
            <span style={metricIconStyle}>💬</span>
            {obra.comentarios}
          </span>

          <span style={metricItemStyle}>
            <span style={metricIconStyle}>📚</span>
            0 cap.
          </span>
        </div>

        <div style={isDesktop ? desktopCardActionRowStyle : cardActionRowStyle}>
          <span style={isDesktop ? desktopCardGenreBadgeStyle : cardGenreBadgeStyle}>
            {obra.genero}
          </span>

          <span style={criarCardPrimaryActionStyle(tema, isDesktop)}>
            {obra.disponivel ? "Ver obra" : "Ver detalhes"}
          </span>
        </div>
      </div>
    </>
  );

  return (
    <Link
      href={obraHref}
      style={obra.disponivel ? (isDesktop ? criarDesktopCardTemaStyle(tema) : criarCardTemaStyle(tema)) : (isDesktop ? criarDesktopCardSoonTemaStyle(tema) : criarCardSoonTemaStyle(tema))}
      aria-label={`Abrir página da obra ${obra.titulo}`}
    >
      {conteudoCard}
    </Link>
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
  const perfilAutorHref = `/perfil-autor?autor=${encodeURIComponent(
    obra.autor
  )}`;

  return (
    <article style={isDesktop ? criarDesktopPublishedCardTemaStyle(tema) : criarPublishedCardTemaStyle(tema)}>
      <Link href={paginaPublicaHref} style={isDesktop ? criarDesktopPublishedCoverStyle(obra.capa, tema) : criarPublishedCoverStyle(obra.capa, tema)}>
        {!obra.capa && <span style={noCoverBadgeStyle}>Capa pendente</span>}
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
          {totalLidos > 0 && (
            <span style={metricItemStyle}>
              <span style={metricIconStyle}>👁</span>
              {totalLidos} lidos
            </span>
          )}

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

function criarActiveCategoryStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...activeCategoryStyle,
    background: tema.activeBackground,
    boxShadow: `0 12px 32px ${tema.accent}2E`,
  };
}

function criarQuickFilterActiveStyle(
  tema: ReturnType<typeof obterTemaCategoria>,
  isDesktop = false
): CSSProperties {
  return {
    ...(isDesktop ? desktopQuickFilterActiveStyle : quickFilterActiveStyle),
    background: tema.activeBackground,
    border: `1px solid color-mix(in srgb, ${tema.accent} 44%, rgba(255,255,255,0.14))`,
    color: "#FFFFFF",
    boxShadow: "none",
  };
}

function criarSearchBoxStyle(
  tema: ReturnType<typeof obterTemaCategoria>,
  categoriaAtiva = false
): CSSProperties {
  if (categoriaAtiva) {
    return {
      ...searchBoxStyle,
      background: `linear-gradient(135deg, color-mix(in srgb, ${tema.accent} 18%, rgba(5,5,12,0.88)) 0%, rgba(3,3,8,0.92) 100%)`,
      border: `1px solid color-mix(in srgb, ${tema.accent} 34%, rgba(255,255,255,0.10))`,
      boxShadow: "none",
    };
  }

  return {
    ...searchBoxStyle,
    background: `linear-gradient(135deg, color-mix(in srgb, ${tema.accent} 10%, rgba(255,255,255,0.055)) 0%, rgba(255,255,255,0.045) 100%)`,
    border: `1px solid color-mix(in srgb, ${tema.accent} 26%, rgba(255,255,255,0.08))`,
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
    gap: "8px",
    marginTop: "12px",
    padding: "10px 12px",
    borderRadius: "22px",
    overflow: "hidden",
    boxShadow: "none",
  };
}

function criarSearchInputStyle(
  tema: ReturnType<typeof obterTemaCategoria>,
  isDesktop: boolean,
  categoriaAtiva: boolean
): CSSProperties {
  const baseStyle = isDesktop ? desktopSearchInputStyle : searchInputStyle;

  if (!categoriaAtiva) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    background: "rgba(3,3,8,0.72)",
    border: `1px solid color-mix(in srgb, ${tema.accent} 30%, rgba(255,255,255,0.12))`,
    color: "#FFFFFF",
    boxShadow: "none",
  };
}

function criarQuickFilterInactiveStyle(
  tema: ReturnType<typeof obterTemaCategoria>,
  isDesktop = false,
  categoriaAtiva = false
): CSSProperties {
  const baseStyle = isDesktop ? desktopQuickFilterButtonStyle : quickFilterButtonStyle;

  if (!categoriaAtiva) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    background: `color-mix(in srgb, ${tema.accent} 10%, rgba(5,5,12,0.72))`,
    border: `1px solid color-mix(in srgb, ${tema.accent} 24%, rgba(255,255,255,0.10))`,
    color: "#FFFFFF",
    boxShadow: "none",
  };
}

function criarFieldBoxStyle(
  tema: ReturnType<typeof obterTemaCategoria>,
  categoriaAtiva: boolean
): CSSProperties {
  if (!categoriaAtiva) {
    return fieldBoxStyle;
  }

  return {
    ...fieldBoxStyle,
    background: `color-mix(in srgb, ${tema.accent} 10%, rgba(5,5,12,0.74))`,
    border: `1px solid color-mix(in srgb, ${tema.accent} 22%, rgba(255,255,255,0.10))`,
  };
}

function criarSearchLabelStyle(categoriaAtiva: boolean): CSSProperties {
  if (!categoriaAtiva) {
    return searchLabelStyle;
  }

  return {
    ...searchLabelStyle,
    color: "#FFFFFF",
  };
}

function criarSelectStyle(
  tema: ReturnType<typeof obterTemaCategoria>,
  categoriaAtiva: boolean
): CSSProperties {
  if (!categoriaAtiva) {
    return selectStyle;
  }

  return {
    ...selectStyle,
    background: "rgba(3,3,8,0.78)",
    border: `1px solid color-mix(in srgb, ${tema.accent} 28%, rgba(255,255,255,0.12))`,
    color: "#FFFFFF",
  };
}

function criarCompactSummaryStyle(
  tema: ReturnType<typeof obterTemaCategoria>,
  isDesktop: boolean,
  categoriaAtiva: boolean
): CSSProperties {
  const baseStyle = isDesktop ? desktopCompactSummaryStyle : compactSummaryStyle;

  if (!categoriaAtiva) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    background: `linear-gradient(135deg, color-mix(in srgb, ${tema.accent} 14%, rgba(5,5,12,0.80)) 0%, rgba(3,3,8,0.86) 100%)`,
    border: `1px solid color-mix(in srgb, ${tema.accent} 30%, rgba(255,255,255,0.10))`,
    color: "#FFFFFF",
    boxShadow: "none",
  };
}

function criarClearFilterButtonStyle(
  tema: ReturnType<typeof obterTemaCategoria>,
  categoriaAtiva: boolean
): CSSProperties {
  if (!categoriaAtiva) {
    return clearFilterButtonStyle;
  }

  return {
    ...clearFilterButtonStyle,
    background: `color-mix(in srgb, ${tema.accent} 16%, rgba(5,5,12,0.78))`,
    border: `1px solid color-mix(in srgb, ${tema.accent} 32%, rgba(255,255,255,0.10))`,
    color: "#FFFFFF",
  };
}

function criarFilterInfoBoxStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...filterInfoBoxStyle,
    background: `color-mix(in srgb, ${tema.accent} 14%, rgba(255,255,255,0.05))`,
    border: `1px solid color-mix(in srgb, ${tema.accent} 32%, rgba(255,255,255,0.08))`,
  };
}


function criarCardTemaStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...cardStyle,
    border: `1px solid color-mix(in srgb, ${tema.accent} 24%, rgba(255,255,255,0.08))`,
    boxShadow: "none",
  };
}

function criarCardSoonTemaStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...criarCardTemaStyle(tema),
    opacity: 0.9,
  };
}

function criarDesktopCardTemaStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...desktopCardStyle,
    border: `1px solid color-mix(in srgb, ${tema.accent} 28%, rgba(255,255,255,0.08))`,
    boxShadow: `0 16px 34px ${tema.accent}14, 0 12px 30px rgba(0,0,0,0.20)`,
  };
}

function criarDesktopCardSoonTemaStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...criarDesktopCardTemaStyle(tema),
    opacity: 0.9,
  };
}

function criarPublishedCardTemaStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...publishedCardStyle,
    border: `1px solid color-mix(in srgb, ${tema.accent} 24%, rgba(139,92,246,0.14))`,
    boxShadow: "none",
  };
}

function criarDesktopPublishedCardTemaStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...desktopPublishedCardStyle,
    border: `1px solid color-mix(in srgb, ${tema.accent} 28%, rgba(139,92,246,0.14))`,
    boxShadow: `0 16px 34px ${tema.accent}14, 0 12px 30px rgba(0,0,0,0.20)`,
  };
}

function criarCoverTemaStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...coverStyle,
    backgroundImage: `radial-gradient(circle at top left, color-mix(in srgb, ${tema.accent} 34%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 42%, transparent), transparent 36%), linear-gradient(135deg, var(--historietas-surface, #18181B) 0%, var(--historietas-surface-strong, #0F0F0F) 100%)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarDesktopCoverTemaStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...desktopCoverStyle,
    backgroundImage: `radial-gradient(circle at top left, color-mix(in srgb, ${tema.accent} 34%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 42%, transparent), transparent 36%), linear-gradient(135deg, var(--historietas-surface, #18181B) 0%, var(--historietas-surface-strong, #0F0F0F) 100%)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarPublishedCoverTemaStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...publishedCoverStyle,
    backgroundImage: `radial-gradient(circle at top left, color-mix(in srgb, ${tema.accent} 28%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 42%, transparent), transparent 38%), linear-gradient(135deg, var(--historietas-surface, #18181B) 0%, var(--historietas-surface-strong, #0F0F0F) 100%)`,
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

function criarDesktopPublishedCoverTemaStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...desktopPublishedCoverStyle,
    backgroundImage: `radial-gradient(circle at top left, color-mix(in srgb, ${tema.accent} 28%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 42%, transparent), transparent 38%), linear-gradient(135deg, var(--historietas-surface, #18181B) 0%, var(--historietas-surface-strong, #0F0F0F) 100%)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function criarProgressTrackStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...progressTrackStyle,
    border: `1px solid color-mix(in srgb, ${tema.accent} 22%, rgba(255,255,255,0.1))`,
  };
}

function criarProgressBarStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...progressBarStyle,
    background: `linear-gradient(135deg, ${tema.accent} 0%, var(--historietas-secondary, #7C3AED) 100%)`,
  };
}

function criarReadStyle(tema: ReturnType<typeof obterTemaCategoria>): CSSProperties {
  return {
    ...readStyle,
    color: "#FFFFFF",
    background: `linear-gradient(135deg, ${tema.accent} 0%, var(--historietas-secondary, #7C3AED) 100%)`,
    border: `1px solid color-mix(in srgb, ${tema.accent} 44%, rgba(255,255,255,0.16))`,
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

function criarToggleFiltrosStyle(
  tema: ReturnType<typeof obterTemaCategoria>,
  categoriaAtiva = false
): CSSProperties {
  return {
    minHeight: "34px",
    borderRadius: "999px",
    border: `1px solid color-mix(in srgb, ${tema.accent} ${categoriaAtiva ? "38%" : "22%"}, rgba(255,255,255,0.10))`,
    background: categoriaAtiva
      ? `linear-gradient(135deg, color-mix(in srgb, ${tema.accent} 24%, rgba(5,5,12,0.80)) 0%, rgba(3,3,8,0.88) 100%)`
      : `linear-gradient(135deg, color-mix(in srgb, ${tema.accent} 8%, rgba(255,255,255,0.045)) 0%, rgba(255,255,255,0.032) 100%)`,
    color: categoriaAtiva ? "#FFFFFF" : "var(--historietas-text-primary, #FFFFFF)",
    fontSize: "11px",
    fontWeight: 900,
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "center",
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow: "none",
    ...safeTextStyle,
  };
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

  html[data-historietas-tema-visual] nav a[href="/explorar"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/explorar"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/explorar"] {
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

  html[data-historietas-tema-visual="branco"]:not([data-historietas-explorar-categoria-ativa="true"]) .historietas-explorar-logo-text,
  html[data-historietas-tema-visual="branco"]:not([data-historietas-explorar-categoria-ativa="true"]) .historietas-explorar-hero-title {
    background: none !important;
    color: #1A73E8 !important;
    -webkit-text-fill-color: #1A73E8 !important;
    text-shadow: none !important;
  }

  html[data-historietas-explorar-categoria-ativa="true"],
  html[data-historietas-explorar-categoria-ativa="true"] body {
    background-color: #030308 !important;
  }

  html[data-historietas-explorar-categoria-ativa="true"] .historietas-explorar-logo-text,
  html[data-historietas-explorar-categoria-ativa="true"] .historietas-explorar-hero-title {
    background: none !important;
    color: var(--historietas-accent, #F97316) !important;
    -webkit-text-fill-color: var(--historietas-accent, #F97316) !important;
    text-shadow: none !important;
  }

  html[data-historietas-explorar-categoria-ativa="true"] nav,
  html[data-historietas-explorar-categoria-ativa="true"] [data-bottom-nav],
  html[data-historietas-explorar-categoria-ativa="true"] [data-mobile-nav],
  html[data-historietas-explorar-categoria-ativa="true"] nav:has(a[href="/publicar"]),
  html[data-historietas-explorar-categoria-ativa="true"] div:has(> a[href="/publicar"]):has(> a[href="/biblioteca"]) {
    background: var(--historietas-bottom-nav-bg, rgba(3,3,8,0.98)) !important;
    border-color: var(--historietas-bottom-nav-border, rgba(255,255,255,0.10)) !important;
    box-shadow: none !important;
  }

  html[data-historietas-explorar-categoria-ativa="true"] nav a[href="/explorar"],
  html[data-historietas-explorar-categoria-ativa="true"] [data-bottom-nav] a[href="/explorar"],
  html[data-historietas-explorar-categoria-ativa="true"] [data-mobile-nav] a[href="/explorar"] {
    background: var(--historietas-bottom-nav-hover-bg, rgba(255,255,255,0.06)) !important;
    border-color: color-mix(in srgb, var(--historietas-accent, #F97316) 34%, rgba(255,255,255,0.10)) !important;
    color: var(--historietas-accent, #F97316) !important;
  }

  html[data-historietas-explorar-categoria-ativa="true"] nav a[href="/publicar"],
  html[data-historietas-explorar-categoria-ativa="true"] [data-bottom-nav] a[href="/publicar"],
  html[data-historietas-explorar-categoria-ativa="true"] [data-mobile-nav] a[href="/publicar"] {
    background: var(--historietas-bottom-nav-main-bg, linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, #7C3AED 100%)) !important;
    border-color: var(--historietas-bottom-nav-main-border, color-mix(in srgb, var(--historietas-accent, #F97316) 55%, transparent)) !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual="branco"] input::placeholder {
    color: #80868B !important;
  }

  html[data-historietas-tema-visual="branco"] input,
  html[data-historietas-tema-visual="branco"] textarea,
  html[data-historietas-tema-visual="branco"] select {
    color: #202124 !important;
  }

  html[data-historietas-tema-visual="branco"] article,
  html[data-historietas-tema-visual="branco"] a[aria-label^="Abrir página da obra"] {
    color: #202124 !important;
  }

  html[data-historietas-tema-visual="branco"] button {
    color: inherit;
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
  height: "min(340px, 48vh)",
  pointerEvents: "none",
  zIndex: 0,
  background:
    "radial-gradient(ellipse at 8% 74%, var(--historietas-glow-primary, rgba(42,20,76,0.54)) 0%, transparent 62%), radial-gradient(ellipse at 76% 68%, var(--historietas-glow-secondary, rgba(32,13,58,0.36)) 0%, transparent 64%), linear-gradient(180deg, var(--historietas-bg-start, rgba(10,6,18,0.98)) 0%, var(--historietas-bg-mid, rgba(18,8,31,0.96)) 42%, transparent 100%)",
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
  background:
    "radial-gradient(circle at 12% 0%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)), transparent 28%), radial-gradient(circle at 88% 14%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)), transparent 22%), radial-gradient(circle at 50% 100%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)), transparent 30%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 38%, var(--historietas-bg-end, #17101B) 100%)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(900px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "18px 0 calc(24px + env(safe-area-inset-bottom))",
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
  fontSize: "25px",
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
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  boxShadow:
    "0 0 22px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent), inset 0 1px 0 rgba(255,255,255,0.22)",
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #DDD6FE) 40%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow:
    "var(--historietas-logo-shadow, 0 0 28px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, transparent))",
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
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.055) 100%)",
  border: "1px solid rgba(255,255,255,0.13)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  textAlign: "center",
  boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
  ...safeTextStyle,
};

const libraryButtonTopStyle: CSSProperties = {
  ...backButtonStyle,
  background: "rgba(124,58,237,0.18)",
  border: "1px solid rgba(139,92,246,0.28)",
  color: "#DDD6FE",
};

const soonTopButtonStyle: CSSProperties = {
  ...backButtonStyle,
  minHeight: "38px",
  padding: "0 13px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, transparent) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 38%, rgba(255,255,255,0.08))",
  color: "var(--historietas-accent, #FDBA74)",
  boxShadow: "none",
};

const desktopSoonTopButtonStyle: CSSProperties = {
  ...soonTopButtonStyle,
  minHeight: "42px",
  padding: "0 18px",
  background:
    "linear-gradient(135deg, rgba(249,115,22,0.16) 0%, rgba(124,58,237,0.13) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 34%, rgba(255,255,255,0.10))",
  color: "var(--historietas-accent, #FFD6A8)",
};

const heroStyle: CSSProperties = {
  position: "relative",
  borderRadius: "30px",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, rgba(255,255,255,0.08))",
  background:
    "radial-gradient(circle at 18% 0%, rgba(124,58,237,0.42), transparent 32%), radial-gradient(circle at 90% 45%, rgba(249,115,22,0.12), transparent 28%), linear-gradient(135deg, rgba(26,13,43,0.98) 0%, rgba(12,7,23,0.98) 100%)",
  padding: "18px",
  boxShadow:
    "var(--historietas-hero-shadow, 0 26px 70px rgba(0,0,0,0.36), 0 0 46px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, transparent), inset 0 1px 0 rgba(255,255,255,0.08))",
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
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 18%, rgba(255,255,255,0.04)) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, rgba(255,255,255,0.04)) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 34%, rgba(255,255,255,0.08))",
  color: "#FDEDD3",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.10em",
  boxShadow:
    "0 0 24px color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent)",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const desktopBadgeStyle: CSSProperties = {
  ...badgeStyle,
  padding: "9px 13px",
  fontSize: "11px",
};

const heroDecorationLayerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 0,
};

const titleStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: "8px auto 0",
  fontSize: "clamp(34px, 10vw, 60px)",
  lineHeight: 0.92,
  fontWeight: 950,
  letterSpacing: "-0.085em",
  maxWidth: "100%",
  textAlign: "center",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 44%, var(--historietas-accent, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "0 18px 42px rgba(0,0,0,0.22)",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: "10px auto 0",
  color: "var(--historietas-text-secondary, #E4E4E7)",
  fontSize: "13px",
  lineHeight: 1.62,
  fontWeight: 650,
  maxWidth: "620px",
  textAlign: "center",
  ...safeTextStyle,
};

const categoriesStyle: CSSProperties = {
  display: "flex",
  gap: "9px",
  overflowX: "auto",
  padding: "18px 0 6px",
  maxWidth: "100%",
  scrollbarWidth: "none",
};

const categoryStyle: CSSProperties = {
  flex: "0 0 auto",
  maxWidth: "220px",
  padding: "10px 14px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(255,255,255,0.082)) 0%, var(--historietas-surface-strong, rgba(255,255,255,0.042)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxShadow: "var(--historietas-card-shadow, none)",
  ...safeTextStyle,
};

const activeCategoryStyle: CSSProperties = {
  ...categoryStyle,
  background: "linear-gradient(135deg, #7C3AED 0%, #F97316 100%)",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "#FFFFFF",
  boxShadow: "0 12px 32px rgba(124, 58, 237, 0.22)",
};

const compactSummaryStyle: CSSProperties = {
  margin: "12px 0 0",
  padding: "12px 16px",
  borderRadius: "20px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, var(--historietas-surface, rgba(255,255,255,0.06))) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 12%, var(--historietas-surface-strong, rgba(255,255,255,0.04))) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 20%, var(--historietas-border-soft, rgba(255,255,255,0.10)))",
  color: "var(--historietas-text-primary, #F1E9FF)",
  fontSize: "12.5px",
  fontWeight: 860,
  lineHeight: 1.5,
  textAlign: "center",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px 8px",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
  letterSpacing: "-0.015em",
  ...safeTextStyle,
};

const compactSummaryItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  whiteSpace: "nowrap",
};

const compactSummarySeparatorStyle: CSSProperties = {
  opacity: 0.9,
};

const searchBoxStyle: CSSProperties = {
  marginTop: "14px",
  display: "grid",
  gap: "10px",
  padding: "12px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(255,255,255,0.062)) 0%, var(--historietas-surface-strong, rgba(255,255,255,0.034)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  boxShadow: "var(--historietas-card-shadow, none)",
  minWidth: 0,
  overflow: "hidden",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const searchLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 870,
  ...safeTextStyle,
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  height: "46px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
  background: "var(--historietas-input-bg, rgba(8,5,18,0.62))",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 16px",
  outline: "none",
  fontSize: "14px",
  fontWeight: 720,
  textAlign: "center",
  boxSizing: "border-box",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.045)",
  minWidth: 0,
};

const desktopSearchInputStyle: CSSProperties = {
  ...searchInputStyle,
  height: "42px",
  fontSize: "14px",
  padding: "0 15px",
};

const quickFiltersStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  overflowX: "auto",
  paddingBottom: "2px",
  maxWidth: "100%",
  scrollbarWidth: "none",
};

const quickFilterButtonStyle: CSSProperties = {
  flex: "0 0 auto",
  maxWidth: "210px",
  minHeight: "32px",
  padding: "0 11px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.038))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10.5px",
  fontWeight: 880,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxShadow: "0 7px 16px rgba(0,0,0,0.09)",
  ...safeTextStyle,
};

const desktopQuickFilterButtonStyle: CSSProperties = {
  ...quickFilterButtonStyle,
  minHeight: "34px",
  padding: "0 13px",
  fontSize: "11.5px",
  fontWeight: 900,
  maxWidth: "none",
};

const quickFilterActiveStyle: CSSProperties = {
  ...quickFilterButtonStyle,
  background: "rgba(124,58,237,0.28)",
  border: "1px solid rgba(139,92,246,0.34)",
  color: "#FFFFFF",
  boxShadow: "0 12px 28px rgba(124,58,237,0.18)",
};

const desktopQuickFilterActiveStyle: CSSProperties = {
  ...desktopQuickFilterButtonStyle,
  background: "rgba(124,58,237,0.28)",
  border: "1px solid rgba(139,92,246,0.34)",
  color: "#FFFFFF",
  boxShadow: "none",
};

const advancedFiltersStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "10px",
  minWidth: 0,
  paddingTop: "2px",
};

const fieldBoxStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
  padding: "8px",
  borderRadius: "15px",
  background: "var(--historietas-surface, rgba(255,255,255,0.03))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.06))",
};

const selectStyle: CSSProperties = {
  width: "100%",
  height: "40px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
  background: "var(--historietas-input-bg, #120B1F)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "0 12px",
  outline: "none",
  fontSize: "11.5px",
  fontWeight: 820,
  boxSizing: "border-box",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const filterInfoBoxStyle: CSSProperties = {
  marginTop: "0",
  padding: "9px 10px",
  borderRadius: "15px",
  background: "rgba(124, 58, 237, 0.07)",
  border: "1px solid rgba(139, 92, 246, 0.14)",
  display: "grid",
  gap: "7px",
  minWidth: 0,
  overflow: "hidden",
};

const compactClearFiltersStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  width: "100%",
  marginTop: "2px",
};

const desktopCompactClearFiltersStyle: CSSProperties = {
  ...compactClearFiltersStyle,
  justifyContent: "center",
};

const clearFilterButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.055))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 12px",
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
  background:
    "linear-gradient(145deg, var(--historietas-surface, rgba(26,17,43,0.96)) 0%, var(--historietas-surface-strong, rgba(13,9,25,0.98)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const cardStyle: CSSProperties = {
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
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const cardSoonStyle: CSSProperties = {
  ...cardStyle,
  opacity: 0.9,
};

const publishedCoverStyle: CSSProperties = {
  minHeight: "122px",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  backgroundImage:
    "radial-gradient(circle at top left, color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 36%, transparent), transparent 36%), linear-gradient(135deg, var(--historietas-surface, #18181B) 0%, var(--historietas-surface-strong, #0F0F0F) 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  minWidth: 0,
  textDecoration: "none",
  display: "block",
  boxSizing: "border-box",
};

const coverStyle: CSSProperties = {
  minHeight: "122px",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  backgroundImage:
    "radial-gradient(circle at top left, color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 62%, transparent), transparent 36%), linear-gradient(135deg, #18181B 0%, #0F0F0F 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  minWidth: 0,
  boxSizing: "border-box",
};

const genreBadgeStyle: CSSProperties = {
  position: "absolute",
  left: "8px",
  right: "8px",
  bottom: "8px",
  maxWidth: "calc(100% - 16px)",
  padding: "7px 8px",
  borderRadius: "999px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 92%, rgba(0,0,0,0.18)), color-mix(in srgb, var(--historietas-accent, #F97316) 26%, rgba(0,0,0,0.18)))",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#FFFFFF",
  fontSize: "9px",
  fontWeight: 900,
  textAlign: "center",
  whiteSpace: "normal",
  boxShadow: "0 10px 22px rgba(0,0,0,0.22)",
  ...safeTextStyle,
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
  fontSize: "9px",
  fontWeight: 900,
  textAlign: "center",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const cardContentStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  display: "grid",
  alignContent: "center",
  gap: "7px",
};

const cardTopStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const cardTitleStyle: CSSProperties = {
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

const statusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, var(--historietas-surface, transparent))",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, var(--historietas-border-soft, transparent))",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "9px",
  fontWeight: 850,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const soonBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(113,113,122,0.18))",
  border: "1px solid var(--historietas-border-soft, rgba(161,161,170,0.22))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  fontWeight: 880,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const publishedStatusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(34, 197, 94, 0.22)",
  color: "#86EFAC",
  fontSize: "9px",
  fontWeight: 880,
  whiteSpace: "normal",
  ...safeTextStyle,
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
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 12%, var(--historietas-surface, rgba(255,255,255,0.08)))",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, var(--historietas-border-soft, rgba(255,255,255,0.12)))",
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
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, var(--historietas-surface, rgba(124,58,237,0.16)))",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 35%, var(--historietas-border-soft, rgba(255,255,255,0.12)))",
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
  background: "rgba(34, 197, 94, 0.12)",
  border: "1px solid rgba(34, 197, 94, 0.24)",
  color: "#86EFAC",
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
  background: "rgba(249, 115, 22, 0.12)",
  border: "1px solid rgba(249, 115, 22, 0.24)",
  color: "#FDBA74",
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

const authorStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #B3B3B3)",
  fontSize: "13px",
  fontWeight: 700,
  maxWidth: "100%",
  ...safeTextStyle,
};

const authorLinkStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  margin: 0,
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  fontWeight: 820,
  textDecoration: "none",
  borderBottom: "1px solid rgba(249, 115, 22, 0.18)",
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
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "16px",
  minWidth: "16px",
  lineHeight: 1,
};

const heartMetricIconStyle: CSSProperties = {
  ...metricIconStyle,
  color: "#E11D48",
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
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.1)",
  overflow: "hidden",
};

const progressBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(135deg, #F97316 0%, #7C3AED 100%)",
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
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1.15,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const soonReadStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  marginTop: "2px",
  color: "#FDBA74",
  fontSize: "14px",
  fontWeight: 950,
  textDecoration: "none",
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
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 12%, var(--historietas-surface, rgba(255,255,255,0.06)))",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, var(--historietas-border-soft, rgba(255,255,255,0.11)))",
  color: "var(--historietas-text-primary, #EDE9FE)",
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
  ...safeTextStyle,
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
  flex: "0 1 46%",
  maxWidth: "46%",
  padding: "0 8px",
  textAlign: "center",
  whiteSpace: "normal",
  overflow: "visible",
  textOverflow: "clip",
};

const desktopCardPrimaryActionStyle: CSSProperties = {
  ...cardPrimaryActionStyle,
  justifyContent: "center",
  textAlign: "center",
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1220px, calc(100% - 64px))",
  padding: "26px 0 40px",
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
  padding: "18px 0 8px",
};

const desktopCompactSummaryStyle: CSSProperties = {
  ...compactSummaryStyle,
  margin: "12px auto 0",
  padding: "11px 18px",
  fontSize: "13px",
  lineHeight: 1.55,
  width: "fit-content",
  maxWidth: "100%",
  textAlign: "center",
  opacity: 1,
};

const desktopQuickFiltersStyle: CSSProperties = {
  ...quickFiltersStyle,
  flexWrap: "wrap",
  overflowX: "visible",
  paddingBottom: 0,
  gap: "8px",
  minWidth: 0,
  scrollbarWidth: "none",
};

const desktopAdvancedFiltersStyle: CSSProperties = {
  ...advancedFiltersStyle,
  gridColumn: "1 / -1",
  gridTemplateColumns: "repeat(7, minmax(128px, 1fr))",
  gap: "8px",
  alignItems: "end",
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

const desktopGridStyle: CSSProperties = {
  ...gridStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  justifyContent: "stretch",
  alignItems: "stretch",
  gap: "18px",
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
  background:
    "linear-gradient(145deg, var(--historietas-surface, rgba(31,20,50,0.98)) 0%, var(--historietas-surface-strong, rgba(13,9,25,0.99)) 100%)",
};

const desktopCardStyle: CSSProperties = {
  ...cardStyle,
  gridTemplateColumns: "126px minmax(0, 1fr)",
  gap: "17px",
  padding: "14px",
  borderRadius: "24px",
  minHeight: "178px",
  background:
    "linear-gradient(145deg, var(--historietas-surface, rgba(31,20,50,0.98)) 0%, var(--historietas-surface-strong, rgba(13,9,25,0.99)) 100%)",
};

const desktopPublishedCoverStyle: CSSProperties = {
  ...publishedCoverStyle,
  minHeight: "150px",
  borderRadius: "18px",
};

const desktopCoverStyle: CSSProperties = {
  ...coverStyle,
  minHeight: "150px",
  borderRadius: "18px",
};

const desktopCardTitleStyle: CSSProperties = {
  ...cardTitleStyle,
  fontSize: "22px",
  lineHeight: 1.08,
};

const desktopPublishedTitleStyle: CSSProperties = {
  ...publishedTitleStyle,
  fontSize: "22px",
  lineHeight: 1.08,
  letterSpacing: "-0.03em",
};

const emptyBoxStyle: CSSProperties = {
  padding: "28px",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(255,255,255,0.07)) 0%, var(--historietas-surface-strong, rgba(255,255,255,0.04)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontWeight: 850,
  boxShadow: "0 18px 42px rgba(0,0,0,0.20)",
  minWidth: 0,
  overflow: "hidden",
  ...safeTextStyle,
};


const desktopEmptyBoxStyle: CSSProperties = {
  ...emptyBoxStyle,
  padding: "34px",
};