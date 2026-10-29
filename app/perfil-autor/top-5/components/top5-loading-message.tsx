import { loadingStyle } from "../lib/top5-search-feedback-styles";

export function Top5LoadingMessage() {
  return (
    <p role="status" aria-live="polite" style={loadingStyle}>
      Carregando obras...
    </p>
  );
}
