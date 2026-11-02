"use client";

import { useState } from "react";
import type { ObraLocal } from "../lib/ler-capitulo-work-normalization";

export function useLerCapituloLoadedDataState() {
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [carregando, setCarregando] = useState(true);
  return { obras, setObras, carregando, setCarregando };
}
