"use client";

import { useState } from "react";
import type { CategoriaPerfil } from "../types";

export function useListasResultsNavigationState(
  categoriaInicial: CategoriaPerfil,
) {
  const [categoria, setCategoria] =
    useState<CategoriaPerfil>(categoriaInicial);
  const [quantidadeVisivel, setQuantidadeVisivel] = useState(40);
  const [obraDestacadaId, setObraDestacadaId] = useState("");

  return {
    categoria,
    setCategoria,
    quantidadeVisivel,
    setQuantidadeVisivel,
    obraDestacadaId,
    setObraDestacadaId,
  };
}
