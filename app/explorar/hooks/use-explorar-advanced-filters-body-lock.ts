"use client";

import { useEffect } from "react";

export function useExplorarAdvancedFiltersBodyLock(
  mostrarFiltrosAvancados: boolean,
) {
  useEffect(() => {
    if (!mostrarFiltrosAvancados || typeof document === "undefined") {
      return;
    }

    const bodyOverflowAnterior = document.body.style.overflow;
    const htmlOverflowAnterior = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = bodyOverflowAnterior;
      document.documentElement.style.overflow = htmlOverflowAnterior;
    };
  }, [mostrarFiltrosAvancados]);
}
