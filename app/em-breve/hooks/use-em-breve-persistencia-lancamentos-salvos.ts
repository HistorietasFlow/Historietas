"use client";

import { useEffect } from "react";
import {
  SAVED_RELEASES_STORAGE_KEY,
  salvarJsonUsuarioEmBreve,
} from "../lib/em-breve-storage-utils";
import type { ObraEmBreveCard } from "../lib/em-breve-work-normalizers";

export function useEmBrevePersistenciaLancamentosSalvos(
  usuarioIdLogado: string,
  obrasReaisEmBreve: ObraEmBreveCard[],
  obrasSalvasNormalizadas: string[]
) {
  useEffect(() => {
    if (!usuarioIdLogado || obrasReaisEmBreve.length === 0) {
      return;
    }

    salvarJsonUsuarioEmBreve(
      SAVED_RELEASES_STORAGE_KEY,
      usuarioIdLogado,
      obrasSalvasNormalizadas
    );
  }, [
    obrasReaisEmBreve.length,
    obrasSalvasNormalizadas,
    usuarioIdLogado,
  ]);
}
