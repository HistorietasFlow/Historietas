import type { CSSProperties, ReactNode } from "react";
import { historietasThemeCss } from "../../../lib/historietasTheme";
import { emAltaPageCss } from "../lib/em-alta-page-css";
import { EmAltaLanguageBridge } from "./em-alta-language-bridge";

type EmAltaPageShellProps = {
  carregando?: boolean;
  children: ReactNode;
  pageThemeStyle: CSSProperties;
};

export function EmAltaPageShell({
  carregando = false,
  children,
  pageThemeStyle,
}: EmAltaPageShellProps) {
  if (carregando) {
    return (
      <main
        className="historietas-em-alta-page"
        data-historietas-em-alta-root="true"
        style={pageThemeStyle}
        aria-busy="true"
      >
        <style>{`${historietasThemeCss}${emAltaPageCss}`}</style>
        <EmAltaLanguageBridge />
        {children}
      </main>
    );
  }

  return (
    <main
      className="historietas-em-alta-page"
      data-historietas-em-alta-root="true"
      style={pageThemeStyle}
    >
      <style>{`${historietasThemeCss}${emAltaPageCss}`}</style>
      <EmAltaLanguageBridge />
      {children}
    </main>
  );
}
