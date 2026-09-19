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
  minWidth: "22px",
  minHeight: "22px",
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
  width: "22px",
  height: "22px",
  borderWidth: "2.5px",
};

type CommunityLoadingSpinnerProps = {
  compacto?: boolean;
  label?: string;
};

export function CommunityLoadingSpinner({
  label = "Carregando",
  compacto = false,
}: CommunityLoadingSpinnerProps) {
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
