"use client";

import type { CSSProperties, ReactNode } from "react";
import { historietasThemeCss } from "../../../lib/historietasTheme";
import NotificacoesLanguageBridge from "./notificacoes-language-bridge";
import { notificacoesPageCss } from "../lib/notificacoes-page-css";
import {
  desktopTopWaterFadeStyle,
  mobileTopWaterFadeStyle,
} from "../lib/notificacoes-shell-styles";

type NotificacoesPageShellProps = {
  isDesktop: boolean;
  pageThemeStyle: CSSProperties;
  children: ReactNode;
};

export default function NotificacoesPageShell({
  isDesktop,
  pageThemeStyle,
  children,
}: NotificacoesPageShellProps) {
  return (
    <main data-historietas-notificacoes-root="true" style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${notificacoesPageCss}`}</style>
      <NotificacoesLanguageBridge />

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      {children}
    </main>
  );
}
