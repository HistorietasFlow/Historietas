"use client";

import { useSeguindoDesktopMode } from "./use-seguindo-desktop-mode";
import { useSeguindoPageAccessContextState } from "./use-seguindo-page-access-context-state";
import { useSeguindoPageView } from "./use-seguindo-page-view";

export function useSeguindoPageContext(
  mostrarPainelOrdenacao: boolean,
) {
  const isDesktop = useSeguindoDesktopMode();
  const accessContextState = useSeguindoPageAccessContextState();
  const { pageThemeStyle } = useSeguindoPageView(mostrarPainelOrdenacao);

  return { isDesktop, ...accessContextState, pageThemeStyle };
}
