"use client";

import { useState } from "react";
import {
  comunidadePerfilVazia,
  diarioPerfilVazio,
} from "../constants";
import type {
  ComunidadePerfilEstado,
  DiarioPerfilEstado,
} from "../types";

export function usePerfilAutorContentState() {
  const [diarioPerfil, setDiarioPerfil] =
    useState<DiarioPerfilEstado>(diarioPerfilVazio);
  const [comunidadePerfil, setComunidadePerfil] =
    useState<ComunidadePerfilEstado>(comunidadePerfilVazia);

  return {
    diarioPerfil,
    setDiarioPerfil,
    comunidadePerfil,
    setComunidadePerfil,
  };
}
