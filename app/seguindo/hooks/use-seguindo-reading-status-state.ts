"use client";

import { useState } from "react";

export function useSeguindoReadingStatusState() {
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);

  return { obrasFavoritas, setObrasFavoritas, obrasConcluidas, setObrasConcluidas };
}
