"use client";

import { useEffect, useState } from "react";
import type {
  MensagemAcaoConfiguracoes,
  TipoMensagemAcaoConfiguracoes,
} from "../lib/configuracoes-callback-types";

export function useConfiguracoesActionMessage() {
  const [mensagemAcao, setMensagemAcao] =
    useState<MensagemAcaoConfiguracoes | null>(null);

  function mostrarMensagemAcao(
    tipo: TipoMensagemAcaoConfiguracoes,
    texto: string,
  ) {
    setMensagemAcao((mensagemAtual) => ({
      id: (mensagemAtual?.id ?? 0) + 1,
      tipo,
      texto,
    }));
  }

  useEffect(() => {
    if (!mensagemAcao) {
      return;
    }

    const mensagemId = mensagemAcao.id;

    const timer = window.setTimeout(() => {
      setMensagemAcao((mensagemAtual) =>
        mensagemAtual?.id === mensagemId ? null : mensagemAtual,
      );
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [mensagemAcao]);

  return {
    mensagemAcao,
    setMensagemAcao,
    mostrarMensagemAcao,
  };
}
