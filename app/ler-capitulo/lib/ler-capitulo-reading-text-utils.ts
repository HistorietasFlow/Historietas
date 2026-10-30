import type {
  CSSProperties,
} from "react";
import type {
  TamanhoFonte,
} from "../components/ler-capitulo-reader-content";
import {
  chapterTextStyle,
  desktopChapterTextStyle,
} from "./ler-capitulo-layout-styles";

export const FONT_SCALE_LEGACY_VALUES: Record<
  TamanhoFonte,
  1 | 3 | 5 | 7 | 10
> = {
  1: 1,
  2: 3,
  3: 5,
  4: 7,
  5: 10,
};

export function contarPalavras(texto: string) {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

export function criarTextoLeituraStyle(
  tamanhoFonte: TamanhoFonte,
): CSSProperties {
  const tamanhoLegado = FONT_SCALE_LEGACY_VALUES[tamanhoFonte];
  const fontSize = 12 + tamanhoLegado;
  const lineHeight =
    tamanhoLegado <= 3 ? 1.78 : tamanhoLegado <= 7 ? 1.9 : 1.98;

  return {
    ...chapterTextStyle,
    fontSize: `${fontSize}px`,
    lineHeight,
  };
}

export function criarTextoLeituraDesktopStyle(
  tamanhoFonte: TamanhoFonte,
): CSSProperties {
  const tamanhoLegado = FONT_SCALE_LEGACY_VALUES[tamanhoFonte];
  const fontSize = 14 + tamanhoLegado;
  const lineHeight =
    tamanhoLegado <= 3 ? 1.82 : tamanhoLegado <= 7 ? 1.94 : 2.02;

  return {
    ...desktopChapterTextStyle,
    fontSize: `${fontSize}px`,
    lineHeight,
  };
}
