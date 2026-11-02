"use client";

import { useState } from "react";

export function useExplorarInterfaceControlsState() {
  const [buscaMobileAberta, setBuscaMobileAberta] = useState(false);
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
  const [mostrarConfirmacaoConteudo18, setMostrarConfirmacaoConteudo18] =
    useState(false);
  const [confirmouIdadeConteudo18, setConfirmouIdadeConteudo18] =
    useState(false);

  return {
    buscaMobileAberta,
    setBuscaMobileAberta,
    mostrarFiltrosAvancados,
    setMostrarFiltrosAvancados,
    mostrarConfirmacaoConteudo18,
    setMostrarConfirmacaoConteudo18,
    confirmouIdadeConteudo18,
    setConfirmouIdadeConteudo18,
  };
}
