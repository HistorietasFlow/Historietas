"use client";

import { useMemo } from "react";
import { type ObraEmBreveCard } from "../lib/em-breve-work-normalizers";
import { normalizarLancamentosSalvosComObrasEmBreve } from "../lib/em-breve-work-list-utils";

export function useEmBreveLancamentosSalvosNormalizados(
  usuarioIdLogado: string,
  obrasReaisEmBreve: ObraEmBreveCard[],
  obrasSalvas: string[]
) {
  const obrasSalvasNormalizadas = useMemo(() => {
    if (!usuarioIdLogado || obrasReaisEmBreve.length === 0) {
      return obrasSalvas;
    }

    return normalizarLancamentosSalvosComObrasEmBreve(
      obrasSalvas,
      obrasReaisEmBreve
    );
  }, [obrasReaisEmBreve, obrasSalvas, usuarioIdLogado]);

  return obrasSalvasNormalizadas;
}
