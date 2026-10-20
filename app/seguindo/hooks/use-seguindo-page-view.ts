"use client";

import { useHistorietasTheme } from "../../../lib/historietasTheme";
import { pageStyle } from "../lib/seguindo-layout-styles";
import { useSeguindoSortingSheetBodyLock } from "./use-seguindo-sorting-sheet-body-lock";

export function useSeguindoPageView(
  mostrarPainelOrdenacao: boolean,
) {
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  useSeguindoSortingSheetBodyLock(mostrarPainelOrdenacao);

  return { pageThemeStyle };
}
