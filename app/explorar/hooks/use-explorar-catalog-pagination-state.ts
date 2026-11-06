"use client";

import { useState } from "react";
import type { CursorCatalogo } from "../../../lib/catalogo";
import type { ObraLocal } from "../lib/explorar-work-normalizers";

export type ErroCatalogoExplorar = "consulta" | "paginacao" | null;

export function useExplorarCatalogPaginationState() {
  const [obrasLocais, setObrasLocais] = useState<ObraLocal[]>([]);
  const [dadosExplorarCarregados, setDadosExplorarCarregados] = useState(false);
  const [proximoCursorCatalogo, setProximoCursorCatalogo] =
    useState<CursorCatalogo | null>(null);
  const [catalogoTemMais, setCatalogoTemMais] = useState(false);
  const [carregandoMaisCatalogo, setCarregandoMaisCatalogo] = useState(false);
  const [obraIdsBuscaRemota, setObraIdsBuscaRemota] = useState<
    string[] | null
  >(null);
  const [erroCatalogoExplorar, setErroCatalogoExplorar] =
    useState<ErroCatalogoExplorar>(null);
  const [versaoRetryCatalogo, setVersaoRetryCatalogo] = useState(0);

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
    obraIdsBuscaRemota,
    setObraIdsBuscaRemota,
    erroCatalogoExplorar,
    setErroCatalogoExplorar,
    versaoRetryCatalogo,
    setVersaoRetryCatalogo,
  };
}
