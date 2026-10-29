import type { CSSProperties } from "react";
import { LoadingSpinner } from "./explorar-loading-spinner";

type ExplorarLoadingStateProps = {
  mainStyle: CSSProperties;
  themeCss: string;
  label: string;
};

export function ExplorarLoadingState({
  mainStyle,
  themeCss,
  label,
}: ExplorarLoadingStateProps) {
  return (
    <main
      style={mainStyle}
      aria-busy="true"
    >
      <style>{themeCss}</style>

      <LoadingSpinner label={label} />
    </main>
  );
}
