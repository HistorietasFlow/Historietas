import type { CSSProperties, ReactNode } from "react";
import { historietasThemeCss } from "../../../lib/historietasTheme";
import { publicarPageCss } from "../lib/publicar-page-css";
import {
  containerStyle,
  desktopContainerStyle,
  desktopTopWaterFadeStyle,
  mobileTopWaterFadeStyle,
} from "../lib/publicar-layout-styles";
import { PublicarPageHeader } from "./PublicarPageHeader";

type PublicarShellProps = {
  children: ReactNode;
  isDesktop: boolean;
  novaObra: string;
  voltarHome: string;
};

type PublicarLoadingShellProps = {
  isDesktop: boolean;
  pageThemeStyle: CSSProperties;
};

export function PublicarLoadingShell({
  isDesktop,
  pageThemeStyle,
}: PublicarLoadingShellProps) {
  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${publicarPageCss}`}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
    </main>
  );
}

export function PublicarPageShell({
  children,
  isDesktop,
  novaObra,
  voltarHome,
}: PublicarShellProps) {
  return (
    <section style={isDesktop ? desktopContainerStyle : containerStyle}>
      <PublicarPageHeader
        isDesktop={isDesktop}
        voltarHome={voltarHome}
        novaObra={novaObra}
      />

      {children}
    </section>
  );
}
