"use client";

import { useEffect } from "react";

export function useNotificacoesOverlayBodyLock(menuOverlayAberto: boolean) {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const raiz = document.documentElement;
    const corpo = document.body;

    if (!menuOverlayAberto) {
      raiz.removeAttribute("data-historietas-notificacoes-overlay-aberto");
      corpo.removeAttribute("data-historietas-notificacoes-overlay-aberto");
      return;
    }

    const overflowAnterior = corpo.style.overflow;
    const htmlOverflowAnterior = raiz.style.overflow;

    raiz.setAttribute(
      "data-historietas-notificacoes-overlay-aberto",
      "true"
    );
    corpo.setAttribute(
      "data-historietas-notificacoes-overlay-aberto",
      "true"
    );
    raiz.style.overflow = "hidden";
    corpo.style.overflow = "hidden";

    return () => {
      raiz.removeAttribute("data-historietas-notificacoes-overlay-aberto");
      corpo.removeAttribute("data-historietas-notificacoes-overlay-aberto");
      raiz.style.overflow = htmlOverflowAnterior;
      corpo.style.overflow = overflowAnterior;
    };
  }, [menuOverlayAberto]);
}
