"use client";

import { useEffect, useState } from "react";

export function usePainelAutorDesktopMode() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    function atualizarLayoutDesktop() {
      setIsDesktop(window.innerWidth >= 1024);
    }

    atualizarLayoutDesktop();
    window.addEventListener("resize", atualizarLayoutDesktop);

    return () => {
      window.removeEventListener("resize", atualizarLayoutDesktop);
    };
  }, []);

  return isDesktop;
}
