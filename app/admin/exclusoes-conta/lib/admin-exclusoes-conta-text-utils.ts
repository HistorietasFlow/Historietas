import type { HistorietasLanguage } from "../../../../lib/i18n";
import type { StatusSolicitacaoExclusao } from "./admin-exclusoes-conta-normalization-utils";

export type TextoTraduzido = {
  pt: string;
  en: string;
  es: string;
};

export const STATUS_LABEL: Record<StatusSolicitacaoExclusao, TextoTraduzido> = {
  pendente: {
    pt: "Pendente",
    en: "Pending",
    es: "Pendiente",
  },
  verificando: {
    pt: "Verificando identidade",
    en: "Verifying identity",
    es: "Verificando identidad",
  },
  concluida: {
    pt: "Concluída",
    en: "Completed",
    es: "Completada",
  },
  recusada: {
    pt: "Recusada",
    en: "Rejected",
    es: "Rechazada",
  },
  cancelada: {
    pt: "Cancelada",
    en: "Canceled",
    es: "Cancelada",
  },
};

export const ORIGEM_LABEL: Record<string, TextoTraduzido> = {
  pagina_publica: {
    pt: "Página pública",
    en: "Public page",
    es: "Página pública",
  },
  suporte: {
    pt: "Suporte",
    en: "Support",
    es: "Soporte",
  },
  administracao: {
    pt: "Administração",
    en: "Administration",
    es: "Administración",
  },
};

export function traduzir(texto: TextoTraduzido, idioma: HistorietasLanguage) {
  if (idioma === "en") return texto.en;
  if (idioma === "es") return texto.es;
  return texto.pt;
}

export function corStatus(status: StatusSolicitacaoExclusao) {
  if (status === "pendente") return "#F59E0B";
  if (status === "verificando") return "#60A5FA";
  if (status === "concluida") return "#4ADE80";
  if (status === "recusada") return "#FB7185";
  return "#A1A1AA";
}

export function origemTraduzida(origem: string, idioma: HistorietasLanguage) {
  const conhecida = ORIGEM_LABEL[origem];
  return conhecida ? traduzir(conhecida, idioma) : origem || "—";
}
