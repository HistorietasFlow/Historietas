"use client";

import { useState } from "react";

export function usePublicarPageState() {
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [verificandoAutenticacao, setVerificandoAutenticacao] = useState(true);

  return {
    processando,
    setProcessando,
    erro,
    setErro,
    verificandoAutenticacao,
    setVerificandoAutenticacao,
  };
}
