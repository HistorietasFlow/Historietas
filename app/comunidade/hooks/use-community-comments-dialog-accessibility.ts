"use client";

import { useEffect, useRef } from "react";
import type { KeyboardEvent, RefObject } from "react";
import {
  focarInicioDialogo,
  manterFocoNoDialogo,
  obterElementoComFocoAtual,
  restaurarFocoAnterior,
} from "../../obra/[slug]/lib/obra-dialog-focus";

type UseCommunityCommentsDialogAccessibilityParams = {
  aberto: boolean;
  dialogRef: RefObject<HTMLElement | null>;
  onFechar: () => void;
};

export function useCommunityCommentsDialogAccessibility({
  aberto,
  dialogRef,
  onFechar,
}: UseCommunityCommentsDialogAccessibilityParams) {
  const focoAnteriorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!aberto) {
      return;
    }

    focoAnteriorRef.current = obterElementoComFocoAtual();

    const focoTimer = window.setTimeout(() => {
      focarInicioDialogo(dialogRef.current);
    }, 0);

    return () => {
      window.clearTimeout(focoTimer);

      const focoAnterior = focoAnteriorRef.current;
      focoAnteriorRef.current = null;
      restaurarFocoAnterior(focoAnterior);
    };
  }, [aberto, dialogRef]);

  function aoPressionarTeclaDialogo(event: KeyboardEvent<HTMLElement>) {
    manterFocoNoDialogo(event, onFechar);
  }

  return {
    aoPressionarTeclaDialogo,
  };
}
