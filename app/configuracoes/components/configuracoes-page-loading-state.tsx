import type { CSSProperties } from "react";
import { LoadingSpinner } from "./configuracoes-loading-spinner";

type ConfiguracoesPageLoadingStateProps = {
  pageThemeStyle: CSSProperties;
  themeCss: string;
  pageCss: string;
  label: string;
};

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
