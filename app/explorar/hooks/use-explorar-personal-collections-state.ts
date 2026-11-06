"use client";

import { useState } from "react";

export function useExplorarPersonalCollectionsState() {
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [obrasComLeitura, setObrasComLeitura] = useState<string[]>([]);
  const [colecoesCarregadas, setColecoesCarregadas] = useState(false);
  const [erroColecoesExplorar, setErroColecoesExplorar] = useState(false);
  const [versaoRetryColecoes, setVersaoRetryColecoes] = useState(0);

  return {
    obrasFavoritas,
    setObrasFavoritas,
    obrasConcluidas,
    setObrasConcluidas,
    obrasComLeitura,
    setObrasComLeitura,
    colecoesCarregadas,
    setColecoesCarregadas,
    erroColecoesExplorar,
    setErroColecoesExplorar,
    versaoRetryColecoes,
    setVersaoRetryColecoes,
  };
}
