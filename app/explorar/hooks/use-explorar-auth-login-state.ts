"use client";

import { useState } from "react";

export function useExplorarAuthLoginState() {
  const [usuarioIdExplorar, setUsuarioIdExplorar] = useState("");
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [mensagemLogin, setMensagemLogin] = useState("");

  return {
    usuarioIdExplorar,
    setUsuarioIdExplorar,
    usuarioLogado,
    setUsuarioLogado,
    mensagemLogin,
    setMensagemLogin,
  };
}
