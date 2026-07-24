export const HISTORIETAS_LANGUAGE_STORAGE_KEY = "historietas-idioma";

export const HISTORIETAS_LANGUAGES = [
  {
    code: "pt-BR",
    label: "Português",
    shortLabel: "PT",
    htmlLang: "pt-BR",
  },
  {
    code: "en",
    label: "English",
    shortLabel: "EN",
    htmlLang: "en",
  },
  {
    code: "es",
    label: "Español",
    shortLabel: "ES",
    htmlLang: "es",
  },
] as const;

export type HistorietasLanguage =
  (typeof HISTORIETAS_LANGUAGES)[number]["code"];

export const DEFAULT_HISTORIETAS_LANGUAGE: HistorietasLanguage = "pt-BR";

const LANGUAGE_ALIASES: Record<string, HistorietasLanguage> = {
  pt: "pt-BR",
  "pt-br": "pt-BR",
  "pt-pt": "pt-BR",
  en: "en",
  "en-us": "en",
  "en-gb": "en",
  es: "es",
  "es-es": "es",
  "es-419": "es",
  "es-mx": "es",
  "es-ar": "es",
};

export function normalizeHistorietasLanguage(
  value: unknown
): HistorietasLanguage {
  if (typeof value !== "string") {
    return DEFAULT_HISTORIETAS_LANGUAGE;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (LANGUAGE_ALIASES[normalizedValue]) {
    return LANGUAGE_ALIASES[normalizedValue];
  }

  if (normalizedValue.startsWith("pt")) {
    return "pt-BR";
  }

  if (normalizedValue.startsWith("en")) {
    return "en";
  }

  if (normalizedValue.startsWith("es")) {
    return "es";
  }

  return DEFAULT_HISTORIETAS_LANGUAGE;
}

export function isHistorietasLanguage(
  value: unknown
): value is HistorietasLanguage {
  return value === "pt-BR" || value === "en" || value === "es";
}

export function getBrowserHistorietasLanguage(): HistorietasLanguage {
  if (typeof navigator === "undefined") {
    return DEFAULT_HISTORIETAS_LANGUAGE;
  }

  const browserLanguages =
    Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];

  for (const browserLanguage of browserLanguages) {
    const lowercaseLanguage = browserLanguage?.toLowerCase() ?? "";

    if (
      lowercaseLanguage.startsWith("pt") ||
      lowercaseLanguage.startsWith("en") ||
      lowercaseLanguage.startsWith("es")
    ) {
      return normalizeHistorietasLanguage(browserLanguage);
    }
  }

  return DEFAULT_HISTORIETAS_LANGUAGE;
}

export function readSavedHistorietasLanguage(): HistorietasLanguage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const savedValue = window.localStorage.getItem(
      HISTORIETAS_LANGUAGE_STORAGE_KEY
    );

    if (!savedValue) {
      return null;
    }

    try {
      const parsedValue: unknown = JSON.parse(savedValue);

      if (isHistorietasLanguage(parsedValue)) {
        return parsedValue;
      }

      return normalizeHistorietasLanguage(parsedValue);
    } catch {
      return normalizeHistorietasLanguage(savedValue);
    }
  } catch {
    return null;
  }
}

export function saveHistorietasLanguage(
  language: HistorietasLanguage
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      HISTORIETAS_LANGUAGE_STORAGE_KEY,
      language
    );
  } catch {
    // O site continua funcionando mesmo se o navegador bloquear o localStorage.
  }
}

export function applyHistorietasLanguageToDocument(
  language: HistorietasLanguage
): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.lang = language;
  document.documentElement.setAttribute(
    "data-historietas-idioma",
    language
  );
}

export function resolveInitialHistorietasLanguage(): HistorietasLanguage {
  return (
    readSavedHistorietasLanguage() ??
    getBrowserHistorietasLanguage()
  );
}

export type HistorietasTranslations<Key extends string> = Record<
  HistorietasLanguage,
  Record<Key, string>
>;

export function translateHistorietas<Key extends string>(
  language: HistorietasLanguage,
  translations: HistorietasTranslations<Key>,
  key: Key
): string {
  return (
    translations[language]?.[key] ??
    translations[DEFAULT_HISTORIETAS_LANGUAGE]?.[key] ??
    key
  );
}