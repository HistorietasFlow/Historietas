"use client";

import { useState } from "react";
import {
  preferenciasPrivacidadePadrao,
  type EstadoRelacionamentoPerfil,
  type PreferenciasPrivacidadeHistorietas,
} from "../../../lib/historietasPrivacy";

export function useListasProfileAccessState() {
  const [preferenciasPerfil, setPreferenciasPerfil] =
    useState<PreferenciasPrivacidadeHistorietas>(preferenciasPrivacidadePadrao);
  const [relacionamentoPerfil, setRelacionamentoPerfil] =
    useState<EstadoRelacionamentoPerfil>("nenhum");

  return {
    preferenciasPerfil,
    setPreferenciasPerfil,
    relacionamentoPerfil,
    setRelacionamentoPerfil,
  };
}
