"use client";

import type { CSSProperties, ReactNode } from "react";
import { historietasThemeCss } from "../../../lib/historietasTheme";
import { seguindoPageCss } from "../lib/seguindo-page-css";
import {
  desktopTopWaterFadeStyle,
  mobileTopWaterFadeStyle,
} from "../lib/seguindo-surface-styles";
import { SeguindoLanguageBridge } from "./seguindo-language-bridge";

type SeguindoPageFrameProps = {
  isDesktop: boolean;
  pageThemeStyle: CSSProperties;
  children: ReactNode;
};

export function SeguindoPageFrame({
  isDesktop,
  pageThemeStyle,
  children,
}: SeguindoPageFrameProps) {
  return (
    <main data-historietas-seguindo-root="true" style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${seguindoPageCss}`}</style>
      <SeguindoLanguageBridge />

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}

      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      {children}
    </main>
  );
}
