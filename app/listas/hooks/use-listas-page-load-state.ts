"use client";

import { useState } from "react";

export function useListasPageLoadState() {
  const [carregando, setCarregando] = useState(true);
  const [bloqueado, setBloqueado] = useState(false);
  const [erro, setErro] = useState("");

  return {
    carregando,
    setCarregando,
    bloqueado,
    setBloqueado,
    erro,
    setErro,
  };
}
