"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

type UseComunidadeOverlayBodyLockOptions = {
  bloqueioPrimario: boolean | string | null;
  bloqueioSecundario?: boolean | string | null;
  focoComposerRef?: RefObject<HTMLTextAreaElement | null>;
};

export function useComunidadeOverlayBodyLock({
  bloqueioPrimario,
  bloqueioSecundario,
  focoComposerRef,
}: UseComunidadeOverlayBodyLockOptions) {
  useEffect(() => {
    if (!bloqueioPrimario && !bloqueioSecundario) {
      return;
    }

    const overflowAnterior = document.body.style.getPropertyValue("overflow");
    const overscrollAnterior = document.documentElement.style.getPropertyValue(
      "overscroll-behavior"
    );

    document.body.style.setProperty("overflow", "hidden");
    document.documentElement.style.setProperty("overscroll-behavior", "none");

    const focoTimer = focoComposerRef
      ? window.setTimeout(() => {
          focoComposerRef.current?.focus();
        }, 80)
      : null;

    return () => {
      if (focoTimer !== null) {
        window.clearTimeout(focoTimer);
      }

      if (overflowAnterior) {
        document.body.style.setProperty("overflow", overflowAnterior);
      } else {
        document.body.style.removeProperty("overflow");
      }

      if (overscrollAnterior) {
        document.documentElement.style.setProperty(
          "overscroll-behavior",
          overscrollAnterior
        );
      } else {
        document.documentElement.style.removeProperty("overscroll-behavior");
      }
    };
  }, [bloqueioPrimario, bloqueioSecundario, focoComposerRef]);
}
