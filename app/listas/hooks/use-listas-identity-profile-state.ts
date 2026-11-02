"use client";

import { useState } from "react";
import type { PerfilLista } from "../types";

export function useListasIdentityProfileState() {
  const [usuarioAtualId, setUsuarioAtualId] = useState("");
  const [usuarioAtualPerfil, setUsuarioAtualPerfil] =
    useState<PerfilLista | null>(null);
  const [perfil, setPerfil] = useState<PerfilLista | null>(null);

  return {
    usuarioAtualId,
    setUsuarioAtualId,
    usuarioAtualPerfil,
    setUsuarioAtualPerfil,
    perfil,
    setPerfil,
  };
}
