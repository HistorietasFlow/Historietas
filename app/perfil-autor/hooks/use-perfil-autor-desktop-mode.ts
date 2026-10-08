"use client";

import { useEffect, useState } from "react";

export function usePerfilAutorDesktopMode() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    function atualizarTelaDesktop() {
      setIsDesktop(window.innerWidth >= 1024);
    }

    atualizarTelaDesktop();
    window.addEventListener("resize", atualizarTelaDesktop);

    return () => {
      window.removeEventListener("resize", atualizarTelaDesktop);
    };
  }, []);

  return isDesktop;
}
