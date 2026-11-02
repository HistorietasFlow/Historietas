"use client";

import { useState } from "react";

export function usePerfilAutorAuthLoadingState() {
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [autenticacaoCarregada, setAutenticacaoCarregada] = useState(false);
  const [carregando, setCarregando] = useState(true);

  return {
    usuarioIdLogado,
    setUsuarioIdLogado,
    autenticacaoCarregada,
    setAutenticacaoCarregada,
    carregando,
    setCarregando,
  };
}
