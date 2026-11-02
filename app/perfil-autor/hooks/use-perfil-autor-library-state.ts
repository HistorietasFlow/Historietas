"use client";

import { useState } from "react";
import type { AbaBibliotecaPerfil } from "../types";

export function usePerfilAutorLibraryState() {
  const [abaBibliotecaPerfil, setAbaBibliotecaPerfil] =
    useState<AbaBibliotecaPerfil>("tudo");
  const [obrasSeguidasBiblioteca, setObrasSeguidasBiblioteca] =
    useState<string[]>([]);
  const [versaoSincronizacaoBiblioteca, setVersaoSincronizacaoBiblioteca] =
    useState(0);

  return {
    abaBibliotecaPerfil,
    setAbaBibliotecaPerfil,
    obrasSeguidasBiblioteca,
    setObrasSeguidasBiblioteca,
    versaoSincronizacaoBiblioteca,
    setVersaoSincronizacaoBiblioteca,
  };
}
