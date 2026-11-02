"use client";

import { useState } from "react";
import type { AlvoDenunciaLeitor } from "../lib/ler-capitulo-report-actions";

export function useLerCapituloFeedbackOverlaysState() {
  const [denunciaAlvo, setDenunciaAlvo] =
    useState<AlvoDenunciaLeitor | null>(null);
  const [mensagemAcao, setMensagemAcao] = useState("");
  const [mostrarAjustes, setMostrarAjustes] = useState(false);

  return {
    denunciaAlvo,
    setDenunciaAlvo,
    mensagemAcao,
    setMensagemAcao,
    mostrarAjustes,
    setMostrarAjustes,
  };
}
