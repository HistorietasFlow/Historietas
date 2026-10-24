"use client";

import { useEffect, useState } from "react";
import {
  lerStorageUsuarioPainel,
  salvarJsonStorageUsuarioPainel,
} from "../lib/painel-autor-storage-utils";

const PANEL_SUMMARY_STORAGE_KEY = "historietas-painel-resumo-visivel";

export function usePainelAutorSummaryPreference(usuarioIdLogado: string) {
  const [mostrarResumoPainel, setMostrarResumoPainel] = useState(true);

  useEffect(() => {
    if (!usuarioIdLogado) {
      return;
    }

    let mostrarResumoSalvo = true;

    try {
      const preferenciaSalva = lerStorageUsuarioPainel(
        PANEL_SUMMARY_STORAGE_KEY,
        usuarioIdLogado,
      );

      mostrarResumoSalvo =
        preferenciaSalva === null
          ? true
          : JSON.parse(preferenciaSalva) !== false;
    } catch {
      mostrarResumoSalvo = true;
    }

    const aplicarPreferenciaTimer = window.setTimeout(() => {
      setMostrarResumoPainel(mostrarResumoSalvo);
    }, 0);

    return () => {
      window.clearTimeout(aplicarPreferenciaTimer);
    };
  }, [usuarioIdLogado]);

  function alternarResumoPainel() {
    setMostrarResumoPainel((mostrarAtual) => {
      const proximoValor = !mostrarAtual;

      salvarJsonStorageUsuarioPainel(
        PANEL_SUMMARY_STORAGE_KEY,
        usuarioIdLogado,
        proximoValor,
      );

      return proximoValor;
    });
  }

  return { mostrarResumoPainel, alternarResumoPainel };
}
