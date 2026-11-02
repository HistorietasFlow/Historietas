"use client";

import { useState } from "react";

export function usePerfilAutorTopFiveState() {
  const [topFiveObraIds, setTopFiveObraIds] = useState<string[]>([]);
  const [topFiveCurtidasTotal, setTopFiveCurtidasTotal] = useState(0);
  const [topFiveCurtidoPorMim, setTopFiveCurtidoPorMim] = useState(false);
  const [topFiveCurtidaSalvando, setTopFiveCurtidaSalvando] = useState(false);
  const [mostrarDestaquesVisitante, setMostrarDestaquesVisitante] =
    useState(false);

  function alternarMostrarDestaquesVisitante() {
    setMostrarDestaquesVisitante((valorAtual) => !valorAtual);
  }

  return {
    topFiveObraIds,
    setTopFiveObraIds,
    topFiveCurtidasTotal,
    setTopFiveCurtidasTotal,
    topFiveCurtidoPorMim,
    setTopFiveCurtidoPorMim,
    topFiveCurtidaSalvando,
    setTopFiveCurtidaSalvando,
    mostrarDestaquesVisitante,
    setMostrarDestaquesVisitante,
    alternarMostrarDestaquesVisitante,
  };
}
