"use client";

import type { Dispatch, SetStateAction } from "react";
import type { OrdenacaoSeguindo } from "../lib/seguindo-page-types";
import {
  sortingHandleStyle,
  sortingTitleStyle,
  sortingOptionsListStyle,
  sortingOptionStyle,
  sortingOptionActiveStyle,
  sortingOptionRadioStyle,
  sortingOptionRadioActiveStyle,
} from "../lib/seguindo-sorting-controls-styles";
import {
  sortingBackdropStyle,
  sortingSheetStyle,
  desktopSortingSheetStyle,
} from "../lib/seguindo-sorting-sheet-base-styles";

type SeguindoSortingPanelProps = {
  isDesktop: boolean;
  opcoesOrdenacao: Array<{ valor: OrdenacaoSeguindo; rotulo: string }>;
  ordenacao: OrdenacaoSeguindo;
  setOrdenacao: Dispatch<SetStateAction<OrdenacaoSeguindo>>;
  setMostrarPainelOrdenacao: Dispatch<SetStateAction<boolean>>;
};

export function SeguindoSortingPanel({
  isDesktop,
  opcoesOrdenacao,
  ordenacao,
  setOrdenacao,
  setMostrarPainelOrdenacao,
}: SeguindoSortingPanelProps) {
  return (
    <div
      style={sortingBackdropStyle}
      onClick={() => setMostrarPainelOrdenacao(false)}
    >
      <div
        style={isDesktop ? desktopSortingSheetStyle : sortingSheetStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <span style={sortingHandleStyle} />

        <h2 style={sortingTitleStyle}>Classificar por</h2>

        <div style={sortingOptionsListStyle}>
          {opcoesOrdenacao.map((opcao) => {
            const ativo = ordenacao === opcao.valor;

            return (
              <button
                key={opcao.valor}
                type="button"
                onClick={() => {
                  setOrdenacao(opcao.valor);
                  setMostrarPainelOrdenacao(false);
                }}
                style={
                  ativo ? sortingOptionActiveStyle : sortingOptionStyle
                }
              >
                <span>{opcao.rotulo}</span>

                <span
                  style={
                    ativo
                      ? sortingOptionRadioActiveStyle
                      : sortingOptionRadioStyle
                  }
                >
                  {ativo ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
