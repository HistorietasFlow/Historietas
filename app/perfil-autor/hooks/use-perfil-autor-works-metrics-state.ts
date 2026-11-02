"use client";

import { useState } from "react";
import { totaisInteracoesObrasPerfilVazio } from "../constants";
import type {
  ObraLocal,
  TotaisInteracoesObrasPerfilAutor,
} from "../types";

export function usePerfilAutorWorksMetricsState() {
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [totaisInteracoesObras, setTotaisInteracoesObras] =
    useState<TotaisInteracoesObrasPerfilAutor>(
      totaisInteracoesObrasPerfilVazio,
    );

  return {
    obras,
    setObras,
    totaisInteracoesObras,
    setTotaisInteracoesObras,
  };
}
