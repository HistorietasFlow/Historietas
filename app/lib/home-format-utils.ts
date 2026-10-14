import type { HistorietasLanguage } from "../../lib/i18n";

export type AvaliacaoAutorHome = {
  media: number;
  total: number;
};

export function normalizarNumeroHome(valor: unknown, fallback = 0) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return Math.max(0, Math.round(valor));
  }

  if (typeof valor === "string" && valor.trim()) {
    const numero = Number(valor.replace(/\./g, "").replace(",", "."));

    if (Number.isFinite(numero)) {
      return Math.max(0, Math.round(numero));
    }
  }

  return fallback;
}

export function obterLocaleHomeAtual() {
  if (typeof document === "undefined") {
    return {
      locale: "pt-BR",
      language: "pt-BR" as HistorietasLanguage,
    };
  }

  const language = document.documentElement.lang;

  if (language === "en" || language.toLowerCase().startsWith("en-")) {
    return {
      locale: "en-US",
      language: "en" as HistorietasLanguage,
    };
  }

  if (language === "es" || language.toLowerCase().startsWith("es-")) {
    return {
      locale: "es-ES",
      language: "es" as HistorietasLanguage,
    };
  }

  return {
    locale: "pt-BR",
    language: "pt-BR" as HistorietasLanguage,
  };
}

export function compactarNumeroHome(valor: number) {
  const numero = Math.max(0, Math.round(valor));
  const { locale, language } = obterLocaleHomeAtual();

  if (numero >= 1000000) {
    const numeroCompactado = (numero / 1000000).toLocaleString(locale, {
      maximumFractionDigits: 1,
    });

    if (language === "en") {
      return `${numeroCompactado}M`;
    }

    if (language === "es") {
      return `${numeroCompactado} M`;
    }

    return `${numeroCompactado} mi`;
  }

  if (numero >= 1000) {
    const numeroCompactado = (numero / 1000).toLocaleString(locale, {
      maximumFractionDigits: 1,
    });

    if (language === "en") {
      return `${numeroCompactado}K`;
    }

    return `${numeroCompactado} mil`;
  }

  return numero.toLocaleString(locale);
}

export function formatarMediaAvaliacaoAutorHome(
  avaliacao: AvaliacaoAutorHome | undefined
) {
  if (
    !avaliacao ||
    avaliacao.total <= 0 ||
    !Number.isFinite(avaliacao.media) ||
    avaliacao.media <= 0
  ) {
    return "—";
  }

  return avaliacao.media.toLocaleString(obterLocaleHomeAtual().locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}
