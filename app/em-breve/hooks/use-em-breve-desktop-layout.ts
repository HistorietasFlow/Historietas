"use client";

import { useEffect, useState } from "react";

export function useEmBreveDesktopLayout() {
  const [desktopLayout, setDesktopLayout] = useState(false);

  useEffect(() => {
    const consultaDesktop = window.matchMedia("(min-width: 900px)");

    function atualizarLayoutDesktop() {
      setDesktopLayout(consultaDesktop.matches);
    }

    const atualizarLayoutDesktopTimer = window.setTimeout(
      atualizarLayoutDesktop,
      0
    );

    if (typeof consultaDesktop.addEventListener === "function") {
      consultaDesktop.addEventListener("change", atualizarLayoutDesktop);

      return () => {
        window.clearTimeout(atualizarLayoutDesktopTimer);
        consultaDesktop.removeEventListener("change", atualizarLayoutDesktop);
      };
    }

    consultaDesktop.addListener(atualizarLayoutDesktop);

    return () => {
      window.clearTimeout(atualizarLayoutDesktopTimer);
      consultaDesktop.removeListener(atualizarLayoutDesktop);
    };
  }, []);

  return desktopLayout;
}
