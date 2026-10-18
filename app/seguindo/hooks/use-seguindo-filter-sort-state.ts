"use client";

import { useState } from "react";
import type { FiltroSeguindo, OrdenacaoSeguindo } from "../lib/seguindo-page-types";

export function useSeguindoFilterSortState() {
  const [filtro, setFiltro] = useState<FiltroSeguindo>("todos");
  const [ordenacao, setOrdenacao] =
    useState<OrdenacaoSeguindo>("padrao");

  return { filtro, setFiltro, ordenacao, setOrdenacao };
}
