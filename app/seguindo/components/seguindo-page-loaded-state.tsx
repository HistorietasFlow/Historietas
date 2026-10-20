"use client";

import type { ComponentProps, CSSProperties } from "react";
import { SeguindoPageContent } from "./seguindo-page-content";
import { SeguindoPageControls } from "./seguindo-page-controls";
import { SeguindoPageFrame } from "./seguindo-page-frame";
import {
  containerStyle,
  desktopContainerStyle,
} from "../lib/seguindo-layout-styles";

type SeguindoPageLoadedStateProps = {
  isDesktop: boolean;
  pageThemeStyle: CSSProperties;
  controls: ComponentProps<typeof SeguindoPageControls>;
  content: ComponentProps<typeof SeguindoPageContent>;
};

export function SeguindoPageLoadedState({
  isDesktop,
  pageThemeStyle,
  controls,
  content,
}: SeguindoPageLoadedStateProps) {
  return (
    <SeguindoPageFrame isDesktop={isDesktop} pageThemeStyle={pageThemeStyle}>
      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <SeguindoPageControls {...controls} />
        <SeguindoPageContent {...content} />
      </section>
    </SeguindoPageFrame>
  );
}
