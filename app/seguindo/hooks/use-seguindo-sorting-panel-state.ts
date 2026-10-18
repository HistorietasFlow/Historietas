"use client";

import { useState } from "react";

export function useSeguindoSortingPanelState() {
  const [mostrarPainelOrdenacao, setMostrarPainelOrdenacao] = useState(false);

  return { mostrarPainelOrdenacao, setMostrarPainelOrdenacao };
}
