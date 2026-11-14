"use client";

import { useState } from "react";
import type { UsuarioComunidade } from "../components/community-user";

export function useComunidadeAuthAccountState() {
  const [versaoAutenticacao, setVersaoAutenticacao] = useState(0);
  const [usuario, setUsuario] = useState<UsuarioComunidade | null>(null);
  const [usuarioEhAdmin, setUsuarioEhAdmin] = useState(false);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);

  return {
    versaoAutenticacao,
    setVersaoAutenticacao,
    usuario,
    setUsuario,
    usuarioEhAdmin,
    setUsuarioEhAdmin,
    carregandoUsuario,
    setCarregandoUsuario,
  };
}
