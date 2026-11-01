"use client";

import { useEffect, useRef, useState } from "react";
import type { TouchEvent } from "react";
import {
  deveExpandirComentariosPorArrasteComunidade,
  deveFecharComentariosPorArrasteComunidade,
  deveRecolherComentariosPorArrasteComunidade,
} from "../components/community-comments-sheet-drag-decisions";
import {
  obterLimiteInferiorArrasteComentariosComunidade,
  obterLimiteSuperiorArrasteComentariosComunidade,
} from "../components/community-comments-sheet-drag-limits";
import {
  calcularDeslocamentoArrasteComentariosComunidade,
  deveIgnorarCliqueAposArrasteComunidade,
  obterPosicaoAtualArrasteComentariosComunidade,
} from "../components/community-comments-sheet-drag-motion";

type UseCommunityCommentSheetGesturesParams = {
  isDesktop: boolean;
  onFecharComentarios: () => void;
};

export function useCommunityCommentSheetGestures({
  isDesktop,
  onFecharComentarios,
}: UseCommunityCommentSheetGesturesParams) {
  const sheetRef = useRef<HTMLElement | null>(null);
  const dragStartYRef = useRef(0);
  const dragOffsetYRef = useRef(0);
  const dragIgnorarCliqueRef = useRef(false);
  const dragResetTimerRef = useRef<number | null>(null);
  const [sheetExpandido, setSheetExpandido] = useState(false);

  useEffect(() => {
    return () => {
      if (dragResetTimerRef.current !== null) {
        window.clearTimeout(dragResetTimerRef.current);
      }
    };
  }, []);

  function fecharSheetComentarios() {
    setSheetExpandido(false);
    dragOffsetYRef.current = 0;
    onFecharComentarios();
  }

  function iniciarArraste(event: TouchEvent<HTMLDivElement>) {
    if (isDesktop) {
      return;
    }

    dragStartYRef.current = event.touches[0]?.clientY || 0;
    dragOffsetYRef.current = 0;
    dragIgnorarCliqueRef.current = false;

    if (dragResetTimerRef.current !== null) {
      window.clearTimeout(dragResetTimerRef.current);
      dragResetTimerRef.current = null;
    }

    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  }

  function moverArraste(event: TouchEvent<HTMLDivElement>) {
    if (isDesktop) {
      return;
    }

    const posicaoAtual = obterPosicaoAtualArrasteComentariosComunidade(
      event.touches[0]?.clientY,
      dragStartYRef.current
    );
    const limiteSuperior =
      obterLimiteSuperiorArrasteComentariosComunidade(sheetExpandido);
    const limiteInferior =
      obterLimiteInferiorArrasteComentariosComunidade(sheetExpandido);
    const deslocamento = calcularDeslocamentoArrasteComentariosComunidade(
      limiteSuperior,
      limiteInferior,
      posicaoAtual,
      dragStartYRef.current
    );

    dragOffsetYRef.current = deslocamento;

    if (deveIgnorarCliqueAposArrasteComunidade(deslocamento)) {
      dragIgnorarCliqueRef.current = true;
    }

    if (sheetRef.current) {
      const handle = sheetRef.current.querySelector(
        "[data-comments-sheet-handle='true']"
      ) as HTMLElement | null;

      if (handle) {
        handle.style.transform = `translate3d(0, ${deslocamento}px, 0)`;
      }
    }
  }

  function finalizarArraste() {
    if (isDesktop) {
      return;
    }

    const deslocamento = dragOffsetYRef.current;

    if (sheetRef.current) {
      sheetRef.current.style.transition = "height 220ms ease";

      const handle = sheetRef.current.querySelector(
        "[data-comments-sheet-handle='true']"
      ) as HTMLElement | null;

      if (handle) {
        handle.style.transition = "transform 160ms ease";
        handle.style.transform = "";
      }
    }

    if (dragIgnorarCliqueRef.current) {
      dragResetTimerRef.current = window.setTimeout(() => {
        dragIgnorarCliqueRef.current = false;
        dragResetTimerRef.current = null;
      }, 350);
    }

    if (deveExpandirComentariosPorArrasteComunidade(deslocamento)) {
      setSheetExpandido(true);
      return;
    }

    if (
      deveRecolherComentariosPorArrasteComunidade(
        deslocamento,
        sheetExpandido
      )
    ) {
      setSheetExpandido(false);
      return;
    }

    if (
      deveFecharComentariosPorArrasteComunidade(deslocamento, sheetExpandido)
    ) {
      fecharSheetComentarios();
    }
  }

  function alternarExpansaoComentarios() {
    if (isDesktop || dragIgnorarCliqueRef.current) {
      return;
    }

    setSheetExpandido((expandidoAtual) => !expandidoAtual);
  }

  return {
    sheetRef,
    sheetExpandido,
    fecharSheetComentarios,
    iniciarArraste,
    moverArraste,
    finalizarArraste,
    alternarExpansaoComentarios,
  };
}
