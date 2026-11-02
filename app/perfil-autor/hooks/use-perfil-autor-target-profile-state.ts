"use client";

import { useState } from "react";
import type { PerfilUsuarioRemoto } from "../types";

export function usePerfilAutorTargetProfileState() {
  const [autorSelecionado, setAutorSelecionado] = useState("");
  const [autorIdSelecionado, setAutorIdSelecionado] = useState("");
  const [perfilUsuarioRemoto, setPerfilUsuarioRemoto] =
    useState<PerfilUsuarioRemoto | null>(null);

  return {
    autorSelecionado,
    setAutorSelecionado,
    autorIdSelecionado,
    setAutorIdSelecionado,
    perfilUsuarioRemoto,
    setPerfilUsuarioRemoto,
  };
}
