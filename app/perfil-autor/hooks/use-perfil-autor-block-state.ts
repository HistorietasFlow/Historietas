"use client";

import { useState } from "react";
import type { EstadoBloqueioPerfil } from "../../../lib/historietasPrivacy";

export function usePerfilAutorBlockState() {
  const [estadoBloqueioPerfil, setEstadoBloqueioPerfil] =
    useState<EstadoBloqueioPerfil>({
      bloqueadoPorMim: false,
      bloqueadoPeloPerfil: false,
      existeBloqueio: false,
    });
  const [bloqueioPerfilSalvando, setBloqueioPerfilSalvando] =
    useState(false);

  return {
    estadoBloqueioPerfil,
    setEstadoBloqueioPerfil,
    bloqueioPerfilSalvando,
    setBloqueioPerfilSalvando,
  };
}
