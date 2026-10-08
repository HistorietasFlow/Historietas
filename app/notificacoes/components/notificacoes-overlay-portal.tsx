"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

export default function NotificacoesOverlayPortal({ children }: { children: ReactNode }) {
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const montarPortalTimer = window.setTimeout(() => {
      setMontado(true);
    }, 0);

    return () => {
      window.clearTimeout(montarPortalTimer);
    };
  }, []);

  if (!montado || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}
