"use client";

import { useEffect } from "react";

export function useSeguindoSortingSheetBodyLock(
  mostrarPainelOrdenacao: boolean,
) {
  useEffect(() => {
    if (!mostrarPainelOrdenacao || typeof document === "undefined") {
      return;
    }

    const overflowAnterior = document.body.style.overflow;
    const overscrollAnterior = document.body.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.body.style.overscrollBehavior = overscrollAnterior;
    };
  }, [mostrarPainelOrdenacao]);
}
