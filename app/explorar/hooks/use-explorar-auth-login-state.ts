"use client";

import { useState } from "react";

export function useExplorarAuthLoginState() {
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [mensagemLogin, setMensagemLogin] = useState("");

  return { usuarioLogado, setUsuarioLogado, mensagemLogin, setMensagemLogin };
}
