"use client";

import { useState } from "react";
import type { PermissoesAbasPerfil } from "../../../lib/historietasPrivacy";
import { PERMISSOES_ABAS_PERFIL_PADRAO } from "../constants";

export function usePerfilAutorTabPrivacyState() {
  const [permissoesAbasPerfil, setPermissoesAbasPerfil] =
    useState<PermissoesAbasPerfil>(PERMISSOES_ABAS_PERFIL_PADRAO);
  const [privacidadePerfilCarregando, setPrivacidadePerfilCarregando] =
    useState(true);

  return {
    permissoesAbasPerfil,
    setPermissoesAbasPerfil,
    privacidadePerfilCarregando,
    setPrivacidadePerfilCarregando,
  };
}
