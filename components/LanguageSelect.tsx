"use client";

import {
  useId,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import {
  HISTORIETAS_LANGUAGES,
  type HistorietasLanguage,
} from "../lib/i18n";
import { useHistorietasLanguage } from "./HistorietasLanguageProvider";

type LanguageSelectProps = {
  id?: string;
  className?: string;
  labelClassName?: string;
  selectClassName?: string;
  showLabel?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
  selectStyle?: CSSProperties;
  onLanguageChange?: (language: HistorietasLanguage) => void;
};

const LABELS: Record<HistorietasLanguage, string> = {
  "pt-BR": "Idioma",
  en: "Language",
  es: "Idioma",
};

export default function LanguageSelect({
  id,
  className,
  labelClassName,
  selectClassName,
  showLabel = true,
  disabled = false,
  style,
  selectStyle,
  onLanguageChange,
}: LanguageSelectProps) {
  const generatedId = useId();
  const selectId = id ?? `historietas-language-${generatedId}`;
  const {
    language,
    setLanguage,
    isLanguageReady,
  } = useHistorietasLanguage();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLanguage = event.target.value as HistorietasLanguage;

    setLanguage(nextLanguage);
    onLanguageChange?.(nextLanguage);
  }

  return (
    <div
      className={className}
      style={{
        display: "grid",
        gap: 8,
        ...style,
      }}
    >
      {showLabel ? (
        <label
          htmlFor={selectId}
          className={labelClassName}
        >
          {LABELS[language]}
        </label>
      ) : null}

      <select
        id={selectId}
        value={language}
        onChange={handleChange}
        className={selectClassName}
        disabled={disabled || !isLanguageReady}
        aria-label={LABELS[language]}
        style={{
          width: "100%",
          minHeight: 44,
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(167, 139, 250, 0.35)",
          background: "rgba(7, 2, 18, 0.92)",
          color: "#FFFFFF",
          font: "inherit",
          cursor: disabled || !isLanguageReady ? "not-allowed" : "pointer",
          opacity: disabled || !isLanguageReady ? 0.7 : 1,
          outline: "none",
          ...selectStyle,
        }}
      >
        {HISTORIETAS_LANGUAGES.map((item) => (
          <option
            key={item.code}
            value={item.code}
          >
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}