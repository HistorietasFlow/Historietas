"use client";

import { useLayoutEffect, type Dispatch, type SetStateAction } from "react";

type UseLerCapituloScrollProgressProps = {
  obraId?: string;
  capituloId?: string;
  setProgressoRolagem: Dispatch<SetStateAction<number>>;
};

export function useLerCapituloScrollProgress({
  obraId,
  capituloId,
  setProgressoRolagem,
}: UseLerCapituloScrollProgressProps) {
  useLayoutEffect(() => {
    function atualizarProgressoRolagem() {
      if (!capituloId) {
        setProgressoRolagem(0);
        return;
      }

      const alturaTotal = document.documentElement.scrollHeight - window.innerHeight;
      // Todo o documento já está visível quando não há área rolável.
      const progressoAtual = alturaTotal <= 0 ? 100 : Math.round(window.scrollY / alturaTotal * 100);
      setProgressoRolagem(Math.min(100, Math.max(0, progressoAtual)));
    }

    // Mede o DOM do capítulo atual antes de pintar o percentual anterior.
    atualizarProgressoRolagem();
    let atualizarProgressoTimer = window.setTimeout(atualizarProgressoRolagem, 0);
    function agendarRestauracao() {
      // popstate precede a restauração nativa da posição de rolagem.
      window.clearTimeout(atualizarProgressoTimer);
      atualizarProgressoTimer = window.setTimeout(atualizarProgressoRolagem, 0);
    }

    const observador = typeof ResizeObserver === "undefined"
      ? null : new ResizeObserver(atualizarProgressoRolagem);
    observador?.observe(document.documentElement);
    if (document.body) observador?.observe(document.body);

    window.addEventListener("scroll", atualizarProgressoRolagem);
    window.addEventListener("resize", atualizarProgressoRolagem);
    window.addEventListener("popstate", agendarRestauracao);
    window.addEventListener("pageshow", agendarRestauracao);

    return () => {
      window.clearTimeout(atualizarProgressoTimer);
      observador?.disconnect();
      window.removeEventListener("scroll", atualizarProgressoRolagem);
      window.removeEventListener("resize", atualizarProgressoRolagem);
      window.removeEventListener("popstate", agendarRestauracao);
      window.removeEventListener("pageshow", agendarRestauracao);
    };
  }, [obraId, capituloId, setProgressoRolagem]);
}
