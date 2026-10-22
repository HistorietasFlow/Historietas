import { LoadingSpinner } from "./configuracoes-loading-spinner";
import type { ConfiguracoesPageLoadingStateProps } from "./configuracoes-page-loading-state-props";

export function ConfiguracoesPageLoadingState({
  pageThemeStyle,
  themeCss,
  pageCss,
  label,
}: ConfiguracoesPageLoadingStateProps) {
  return (
    <main style={pageThemeStyle}>
      <style>{`${themeCss}${pageCss}`}</style>
      <LoadingSpinner label={label} />
    </main>
  );
}
