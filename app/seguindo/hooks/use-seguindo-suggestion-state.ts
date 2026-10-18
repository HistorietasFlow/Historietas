"use client";

import { useState } from "react";
import type { UsuarioSeguido } from "../lib/seguindo-page-types";

export function useSeguindoSuggestionState() {
  const [usuariosSugestoesBusca, setUsuariosSugestoesBusca] = useState<
    UsuarioSeguido[]
  >([]);
  const [carregandoUsuariosSugestoes, setCarregandoUsuariosSugestoes] =
    useState(false);
  const [usuarioSugestaoSeguindoId, setUsuarioSugestaoSeguindoId] =
    useState<string | null>(null);

  return {
    usuariosSugestoesBusca, setUsuariosSugestoesBusca,
    carregandoUsuariosSugestoes, setCarregandoUsuariosSugestoes,
    usuarioSugestaoSeguindoId, setUsuarioSugestaoSeguindoId,
  };
}
