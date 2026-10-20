"use client";

import { useState } from "react";
import type { AtividadeSeguindo } from "../lib/seguindo-page-types";

export function useSeguindoPageLoadState() {
  const [, setAtividadesSeguindo] = useState<AtividadeSeguindo[]>([]);
  const [carregando, setCarregando] = useState(true);

  return { setAtividadesSeguindo, carregando, setCarregando };
}
