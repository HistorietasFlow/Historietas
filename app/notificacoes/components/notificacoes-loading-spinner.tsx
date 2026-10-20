"use client";

import type { CSSProperties } from "react";

type NotificacoesLoadingSpinnerProps = {
  label?: string;
  pageStyle: CSSProperties;
  spinnerStyle: CSSProperties;
};

export default function NotificacoesLoadingSpinner({
  label = "Carregando",
  pageStyle,
  spinnerStyle,
}: NotificacoesLoadingSpinnerProps) {
  return (
    <div role="status" aria-live="polite" aria-label={label} style={pageStyle}>
      <span
        className="historietas-loading-spinner"
        style={spinnerStyle}
        aria-hidden="true"
      />
    </div>
  );
}
