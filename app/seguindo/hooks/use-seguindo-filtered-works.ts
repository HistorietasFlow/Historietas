"use client";

import { useMemo } from "react";
import type { AbaConteudoSeguindo, FiltroSeguindo, ObraLocal, OrdenacaoSeguindo } from "../lib/seguindo-page-types";
import { filtrarObrasSeguindo } from "../lib/seguindo-filtered-works";

export function useSeguindoFilteredWorks(
  obrasSeguidasBase: ObraLocal[],
  termoBusca: string,
  filtro: FiltroSeguindo,
  ordenacao: OrdenacaoSeguindo,
  obrasFavoritas: string[],
  obrasConcluidas: string[],
  abaConteudo: AbaConteudoSeguindo,
): ObraLocal[] {
  const obrasFiltradas = useMemo(
    () => filtrarObrasSeguindo(
      obrasSeguidasBase,
      termoBusca,
      filtro,
      ordenacao,
      obrasFavoritas,
      obrasConcluidas,
      abaConteudo,
    ),
    [obrasSeguidasBase, termoBusca, filtro, ordenacao, obrasFavoritas, obrasConcluidas, abaConteudo],
  );
  return obrasFiltradas;
}
