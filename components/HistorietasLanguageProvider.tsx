"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyHistorietasLanguageToDocument,
  DEFAULT_HISTORIETAS_LANGUAGE,
  HISTORIETAS_LANGUAGE_STORAGE_KEY,
  isHistorietasLanguage,
  normalizeHistorietasLanguage,
  resolveInitialHistorietasLanguage,
  saveHistorietasLanguage,
  type HistorietasLanguage,
} from "../lib/i18n";

type HistorietasLanguageContextValue = {
  language: HistorietasLanguage;
  setLanguage: (language: HistorietasLanguage) => void;
  isLanguageReady: boolean;
};

const HistorietasLanguageContext =
  createContext<HistorietasLanguageContextValue | null>(null);

type HistorietasLanguageProviderProps = {
  children: ReactNode;
};

export function HistorietasLanguageProvider({
  children,
}: HistorietasLanguageProviderProps) {
  const [language, setLanguageState] = useState<HistorietasLanguage>(
    DEFAULT_HISTORIETAS_LANGUAGE
  );
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  const applyLanguage = useCallback(
    (
      nextLanguage: HistorietasLanguage,
      options?: {
        save?: boolean;
      }
    ) => {
      setLanguageState(nextLanguage);
      applyHistorietasLanguageToDocument(nextLanguage);

      if (options?.save !== false) {
        saveHistorietasLanguage(nextLanguage);
      }
    },
    []
  );

  const setLanguage = useCallback(
    (nextLanguage: HistorietasLanguage) => {
      applyLanguage(nextLanguage);
    },
    [applyLanguage]
  );

  useEffect(() => {
    const initialLanguage = resolveInitialHistorietasLanguage();

    applyLanguage(initialLanguage, { save: true });
    setIsLanguageReady(true);
  }, [applyLanguage]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (
        event.key !== HISTORIETAS_LANGUAGE_STORAGE_KEY ||
        event.newValue === null
      ) {
        return;
      }

      let nextValue: unknown = event.newValue;

      try {
        nextValue = JSON.parse(event.newValue);
      } catch {
        nextValue = event.newValue;
      }

      const nextLanguage = isHistorietasLanguage(nextValue)
        ? nextValue
        : normalizeHistorietasLanguage(nextValue);

      applyLanguage(nextLanguage, { save: false });
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [applyLanguage]);

  const contextValue = useMemo<HistorietasLanguageContextValue>(
    () => ({
      language,
      setLanguage,
      isLanguageReady,
    }),
    [language, setLanguage, isLanguageReady]
  );

  return (
    <HistorietasLanguageContext.Provider value={contextValue}>
      {children}
    </HistorietasLanguageContext.Provider>
  );
}

export function useHistorietasLanguage(): HistorietasLanguageContextValue {
  const context = useContext(HistorietasLanguageContext);

  if (!context) {
    throw new Error(
      "useHistorietasLanguage deve ser usado dentro de HistorietasLanguageProvider."
    );
  }

  return context;
}