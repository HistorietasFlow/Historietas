"use client";

import { useState } from "react";
import type { UsuarioComunidade } from "../components/community-user";

export function useComunidadeAuthAccountState() {
  const [usuario, setUsuario] = useState<UsuarioComunidade | null>(null);
  const [usuarioEhAdmin, setUsuarioEhAdmin] = useState(false);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);

  return {
    usuario,
    setUsuario,
    usuarioEhAdmin,
    setUsuarioEhAdmin,
    carregandoUsuario,
    setCarregandoUsuario,
  };
}
