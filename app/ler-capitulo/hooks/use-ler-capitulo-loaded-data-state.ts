"use client";

import { useCallback, useState } from "react";
import type { ObraLocal } from "../lib/ler-capitulo-work-normalization";

export function useLerCapituloLoadedDataState() {
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState(false);
  const [versaoCarregamento, setVersaoCarregamento] = useState(0);

  const tentarCarregarNovamente = useCallback(() => {
    setErroCarregamento(false);
    setCarregando(true);
    setVersaoCarregamento((versaoAtual) => versaoAtual + 1);
  }, []);

  return {
    obras,
    setObras,
    carregando,
    setCarregando,
    erroCarregamento,
    setErroCarregamento,
    versaoCarregamento,
    tentarCarregarNovamente,
  };
}
