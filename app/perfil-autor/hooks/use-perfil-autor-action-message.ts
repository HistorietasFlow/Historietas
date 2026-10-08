"use client";

import { useEffect, useState } from "react";

export function usePerfilAutorActionMessage() {
  const [mensagemAcao, setMensagemAcao] = useState("");

  useEffect(() => {
    if (!mensagemAcao) {
      return;
    }

    const timerMensagemAcao = window.setTimeout(() => {
      setMensagemAcao("");
    }, 3000);

    return () => {
      window.clearTimeout(timerMensagemAcao);
    };
  }, [mensagemAcao]);

  return {
    mensagemAcao,
    setMensagemAcao,
  };
}
