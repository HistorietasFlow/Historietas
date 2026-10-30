"use client";

import {
  useEffect,
  type Dispatch,
  type SetStateAction,
} from "react";

type UseLerCapituloScrollProgressProps = {
  capituloId?: string;
  setProgressoRolagem:
    Dispatch<SetStateAction<number>>;
};

export function useLerCapituloScrollProgress({
  capituloId,
  setProgressoRolagem,
}: UseLerCapituloScrollProgressProps) {
  useEffect(() => {
    function atualizarProgressoRolagem() {
      const alturaTotal =
        document.documentElement.scrollHeight -
        window.innerHeight;

      if (alturaTotal <= 0) {
        setProgressoRolagem(0);
        return;
      }

      const progressoAtual =
        Math.round(
          (
            window.scrollY /
            alturaTotal
          ) * 100,
        );

      setProgressoRolagem(
        Math.min(
          100,
          Math.max(
            0,
            progressoAtual,
          ),
        ),
      );
    }

    const atualizarProgressoTimer =
      window.setTimeout(
        atualizarProgressoRolagem,
        0,
      );

    window.addEventListener(
      "scroll",
      atualizarProgressoRolagem,
    );

    window.addEventListener(
      "resize",
      atualizarProgressoRolagem,
    );

    return () => {
      window.clearTimeout(
        atualizarProgressoTimer,
      );

      window.removeEventListener(
        "scroll",
        atualizarProgressoRolagem,
      );

      window.removeEventListener(
        "resize",
        atualizarProgressoRolagem,
      );
    };
  }, [
    capituloId,
    setProgressoRolagem,
  ]);
}
