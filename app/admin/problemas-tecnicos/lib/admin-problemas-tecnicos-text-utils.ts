import type { HistorietasLanguage } from "../../../../lib/i18n";
import type {
  CategoriaProblemaTecnico,
  PrioridadeProblemaTecnico,
  StatusProblemaTecnico,
} from "./admin-problemas-tecnicos-normalization-utils";

export type TextoTraduzido = {
  pt: string;
  en: string;
  es: string;
};

export const STATUS_LABEL: Record<StatusProblemaTecnico, TextoTraduzido> = {
  aberto: {
    pt: "Aberto",
    en: "Open",
    es: "Abierto",
  },
  em_analise: {
    pt: "Em análise",
    en: "Under review",
    es: "En revisión",
  },
  aguardando_usuario: {
    pt: "Aguardando usuário",
    en: "Waiting for user",
    es: "Esperando al usuario",
  },
  resolvido: {
    pt: "Resolvido",
    en: "Resolved",
    es: "Resuelto",
  },
  fechado: {
    pt: "Fechado",
    en: "Closed",
    es: "Cerrado",
  },
};

export const PRIORIDADE_LABEL: Record<PrioridadeProblemaTecnico, TextoTraduzido> = {
  baixa: {
    pt: "Baixa",
    en: "Low",
    es: "Baja",
  },
  normal: {
    pt: "Normal",
    en: "Normal",
    es: "Normal",
  },
  alta: {
    pt: "Alta",
    en: "High",
    es: "Alta",
  },
  urgente: {
    pt: "Urgente",
    en: "Urgent",
    es: "Urgente",
  },
};

export const CATEGORIA_LABEL: Record<CategoriaProblemaTecnico, TextoTraduzido> = {
  conta_acesso: {
    pt: "Conta e acesso",
    en: "Account and access",
    es: "Cuenta y acceso",
  },
  publicacao: {
    pt: "Publicação",
    en: "Publishing",
    es: "Publicación",
  },
  leitura: {
    pt: "Leitura",
    en: "Reading",
    es: "Lectura",
  },
  comunidade: {
    pt: "Comunidade",
    en: "Community",
    es: "Comunidad",
  },
  diario: {
    pt: "Diário",
    en: "Journal",
    es: "Diario",
  },
  notificacoes: {
    pt: "Notificações",
    en: "Notifications",
    es: "Notificaciones",
  },
  privacidade: {
    pt: "Privacidade",
    en: "Privacy",
    es: "Privacidad",
  },
  desempenho: {
    pt: "Desempenho",
    en: "Performance",
    es: "Rendimiento",
  },
  outro: {
    pt: "Outro",
    en: "Other",
    es: "Otro",
  },
};

export function traduzir(
  texto: TextoTraduzido,
  idioma: HistorietasLanguage,
) {
  if (idioma === "en") return texto.en;
  if (idioma === "es") return texto.es;
  return texto.pt;
}

export function corStatus(status: StatusProblemaTecnico) {
  if (status === "aberto") return "#F59E0B";
  if (status === "em_analise") return "#60A5FA";
  if (status === "aguardando_usuario") return "#C084FC";
  if (status === "resolvido") return "#4ADE80";
  return "#A1A1AA";
}

export function corPrioridade(prioridade: PrioridadeProblemaTecnico) {
  if (prioridade === "urgente") return "#FB7185";
  if (prioridade === "alta") return "#F59E0B";
  if (prioridade === "baixa") return "#94A3B8";
  return "#60A5FA";
}

