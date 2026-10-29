import type {
  HistorietasLanguage,
} from "../../../lib/i18n";

import type {
  TextoTraduzido,
} from "./ajuda-content";

import type {
  StatusProblemaTecnico,
} from "./ajuda-technical-support";

export function traduzirTexto(
  texto: TextoTraduzido,
  idioma: HistorietasLanguage,
) {
  if (idioma === "en") {
    return texto.en;
  }

  if (idioma === "es") {
    return texto.es;
  }

  return texto.pt;
}

export function rotuloStatusProblema(
  status: StatusProblemaTecnico,
  idioma: HistorietasLanguage,
) {
  const rotulos: Record<
    StatusProblemaTecnico,
    TextoTraduzido
  > = {
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
      pt: "Aguardando você",
      en: "Waiting for you",
      es: "Esperando tu respuesta",
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

  return traduzirTexto(
    rotulos[status],
    idioma,
  );
}

export function formatarDataChamado(
  data: string,
  idioma: HistorietasLanguage,
) {
  const timestamp = new Date(data).getTime();

  if (!Number.isFinite(timestamp)) {
    return "";
  }

  return new Intl.DateTimeFormat(
    idioma === "en"
      ? "en-US"
      : idioma === "es"
        ? "es-ES"
        : "pt-BR",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(timestamp));
}
