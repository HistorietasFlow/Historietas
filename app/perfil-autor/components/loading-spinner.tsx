import {
  loadingInlineStyle,
  loadingPageStyle,
  loadingSpinnerCompactStyle,
  loadingSpinnerStyle,
} from "../styles";

type LoadingSpinnerProps = {
  label?: string;
  compacto?: boolean;
};

export function LoadingSpinner({
  label = "Carregando",
  compacto = false,
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      style={compacto ? loadingInlineStyle : loadingPageStyle}
    >
      <span
        className="historietas-loading-spinner"
        style={compacto ? loadingSpinnerCompactStyle : loadingSpinnerStyle}
        aria-hidden="true"
      />
    </div>
  );
}
