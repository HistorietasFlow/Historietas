"use client";

import { useState } from "react";

export function usePerfilAutorUserCollectionsState() {
  const [autoresSeguidos, setAutoresSeguidos] = useState<string[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);

  return {
    autoresSeguidos,
    setAutoresSeguidos,
    obrasFavoritas,
    setObrasFavoritas,
    obrasConcluidas,
    setObrasConcluidas,
  };
}
