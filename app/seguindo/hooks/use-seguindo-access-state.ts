"use client";

import { useState } from "react";

export function useSeguindoAccessState() {
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [usuarioLogadoId, setUsuarioLogadoId] = useState("");

  return { verificandoAcesso, setVerificandoAcesso, usuarioLogadoId, setUsuarioLogadoId };
}
