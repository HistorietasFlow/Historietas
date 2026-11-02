"use client";

import { useState } from "react";
import type { CursorCatalogo } from "../../../lib/catalogo";
import type { ObraLocal } from "../lib/explorar-work-normalizers";

export function useExplorarCatalogPaginationState() {
  const [obrasLocais, setObrasLocais] = useState<ObraLocal[]>([]);
  const [dadosExplorarCarregados, setDadosExplorarCarregados] = useState(false);
  const [proximoCursorCatalogo, setProximoCursorCatalogo] =
    useState<CursorCatalogo | null>(null);
  const [catalogoTemMais, setCatalogoTemMais] = useState(false);
  const [carregandoMaisCatalogo, setCarregandoMaisCatalogo] = useState(false);

  return {
    obrasLocais,
    setObrasLocais,
    dadosExplorarCarregados,
    setDadosExplorarCarregados,
    proximoCursorCatalogo,
    setProximoCursorCatalogo,
    catalogoTemMais,
    setCatalogoTemMais,
    carregandoMaisCatalogo,
    setCarregandoMaisCatalogo,
  };
}
