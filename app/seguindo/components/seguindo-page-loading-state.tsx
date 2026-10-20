"use client";

import type { CSSProperties } from "react";
import { SeguindoPageFrame } from "./seguindo-page-frame";
import { LoadingSpinner } from "./seguindo-loading-spinner";

type SeguindoPageLoadingStateProps = {
  isDesktop: boolean;
  pageThemeStyle: CSSProperties;
};

export function SeguindoPageLoadingState({
  isDesktop,
  pageThemeStyle,
}: SeguindoPageLoadingStateProps) {
  return (
    <SeguindoPageFrame isDesktop={isDesktop} pageThemeStyle={pageThemeStyle}>
      <LoadingSpinner label="Carregando seguindo" />
    </SeguindoPageFrame>
  );
}
