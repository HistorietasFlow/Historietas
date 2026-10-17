"use client";

import { useEffect } from "react";

type UseSeguindoDataLoadTriggerParams = {
  usuarioLogadoId: string;
  carregarDadosSeguindo: () => void | Promise<void>;
};

export function useSeguindoDataLoadTrigger({
  usuarioLogadoId,
  carregarDadosSeguindo,
}: UseSeguindoDataLoadTriggerParams) {
  useEffect(() => {
    if (!usuarioLogadoId) {
      return;
    }

    const carregarDadosTimer = window.setTimeout(() => {
      void carregarDadosSeguindo();
    }, 0);

    return () => {
      window.clearTimeout(carregarDadosTimer);
    };
  }, [carregarDadosSeguindo, usuarioLogadoId]);
}
