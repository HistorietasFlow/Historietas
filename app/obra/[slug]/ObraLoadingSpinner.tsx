import type { CSSProperties } from "react";

const loadingPageStyle: CSSProperties = {
  position: "relative",
  zIndex: 2,
  width: "100%",
  minHeight: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

const loadingInlineStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "18px",
  height: "18px",
  lineHeight: 1,
  verticalAlign: "middle",
  boxSizing: "border-box",
};

const loadingSpinnerStyle: CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "999px",
  border: "3px solid rgba(255,255,255,0.20)",
  borderTopColor: "#FFFFFF",
  boxSizing: "border-box",
  animation: "historietas-loading-spin 0.78s linear infinite",
  flex: "0 0 auto",
};

const loadingSpinnerCompactStyle: CSSProperties = {
  ...loadingSpinnerStyle,
  width: "18px",
  height: "18px",
  borderWidth: "2px",
};

export default function LoadingSpinner({
  label = "Carregando",
  compacto = false,
}: {
  label?: string;
  compacto?: boolean;
}) {
  if (compacto) {
    return (
      <span
        role="status"
        aria-live="polite"
        aria-label={label}
        style={loadingInlineStyle}
      >
        <span
          className="historietas-loading-spinner"
          style={loadingSpinnerCompactStyle}
          aria-hidden="true"
        />
      </span>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      style={loadingPageStyle}
    >
      <span
        className="historietas-loading-spinner"
        style={loadingSpinnerStyle}
        aria-hidden="true"
      />
    </div>
  );
}

