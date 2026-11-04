"use client";

import { useCallback, useState } from "react";
import type { ObraLocal } from "../lib/ler-capitulo-work-normalization";

export function useLerCapituloLoadedDataState(
  obrasIniciais: ObraLocal[] = [],
) {
  const [obras, setObras] = useState<ObraLocal[]>(obrasIniciais);
  const [carregando, setCarregando] = useState(obrasIniciais.length === 0);
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
