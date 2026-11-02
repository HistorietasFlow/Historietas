"use client";

import { useState } from "react";
import type { EstadoRelacionamentoPerfil } from "../../../lib/historietasPrivacy";

export function usePerfilAutorFollowRelationshipState() {
  const [seguindoUsuarioPerfil, setSeguindoUsuarioPerfil] = useState(false);
  const [seguidoresUsuarioPerfilTotal, setSeguidoresUsuarioPerfilTotal] =
    useState(0);
  const [seguindoUsuarioPerfilTotal, setSeguindoUsuarioPerfilTotal] =
    useState(0);
  const [seguirUsuarioSalvando, setSeguirUsuarioSalvando] = useState(false);
  const [estadoRelacionamentoPerfil, setEstadoRelacionamentoPerfil] =
    useState<EstadoRelacionamentoPerfil>("nenhum");

  return {
    seguindoUsuarioPerfil,
    setSeguindoUsuarioPerfil,
    seguidoresUsuarioPerfilTotal,
    setSeguidoresUsuarioPerfilTotal,
    seguindoUsuarioPerfilTotal,
    setSeguindoUsuarioPerfilTotal,
    seguirUsuarioSalvando,
    setSeguirUsuarioSalvando,
    estadoRelacionamentoPerfil,
    setEstadoRelacionamentoPerfil,
  };
}
