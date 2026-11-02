"use client";

import { useState } from "react";
import type { UsuarioBuscaComunidade } from "../components/community-user";

export function useComunidadeUserSearchFollowState() {
  const [buscaComunidadeAberta, setBuscaComunidadeAberta] = useState(false);
  const [usuariosBuscaComunidade, setUsuariosBuscaComunidade] = useState<
    UsuarioBuscaComunidade[]
  >([]);
  const [carregandoUsuariosBuscaComunidade, setCarregandoUsuariosBuscaComunidade] =
    useState(false);
  const [usuariosSeguidosIds, setUsuariosSeguidosIds] = useState<string[]>([]);
  const [usuarioSeguindoId, setUsuarioSeguindoId] = useState<string | null>(null);

  return {
    buscaComunidadeAberta,
    setBuscaComunidadeAberta,
    usuariosBuscaComunidade,
    setUsuariosBuscaComunidade,
    carregandoUsuariosBuscaComunidade,
    setCarregandoUsuariosBuscaComunidade,
    usuariosSeguidosIds,
    setUsuariosSeguidosIds,
    usuarioSeguindoId,
    setUsuarioSeguindoId,
  };
}
