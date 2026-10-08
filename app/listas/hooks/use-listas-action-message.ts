"use client";

import { useEffect, useState } from "react";

export function useListasActionMessage() {
  const [mensagemAcao, setMensagemAcao] = useState("");

  useEffect(() => {
    if (!mensagemAcao) {
      return;
    }

    const timer = window.setTimeout(() => setMensagemAcao(""), 2600);
    return () => window.clearTimeout(timer);
  }, [mensagemAcao]);

  return {
    mensagemAcao,
    setMensagemAcao,
  };
}
