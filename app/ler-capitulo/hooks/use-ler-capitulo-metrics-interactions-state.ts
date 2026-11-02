"use client";

import { useState } from "react";
import type { MetricasCapituloLeitor } from "./use-ler-capitulo-interaction-data";
import { metricasCapituloVazias } from "../lib/ler-capitulo-metrics";

export function useLerCapituloMetricsInteractionsState() {
  const [metricasCapitulo, setMetricasCapitulo] =
    useState<MetricasCapituloLeitor>(metricasCapituloVazias);
  const [curtidaCapituloSalvando, setCurtidaCapituloSalvando] = useState(false);
  const [salvoCapituloSalvando, setSalvoCapituloSalvando] = useState(false);
  const [lidoCapituloSalvando, setLidoCapituloSalvando] = useState(false);

  return {
    metricasCapitulo,
    setMetricasCapitulo,
    curtidaCapituloSalvando,
    setCurtidaCapituloSalvando,
    salvoCapituloSalvando,
    setSalvoCapituloSalvando,
    lidoCapituloSalvando,
    setLidoCapituloSalvando,
  };
}
