"use client";

import { useState } from "react";
import type {
  SolicitacaoSeguidor,
  UsuarioSeguido,
} from "../lib/seguindo-page-types";

export function useSeguindoSocialListState() {
  const [usuariosSeguidos, setUsuariosSeguidos] = useState<UsuarioSeguido[]>([]);
  const [usuariosSeguidores, setUsuariosSeguidores] = useState<UsuarioSeguido[]>([]);
  const [solicitacoesSeguidores, setSolicitacoesSeguidores] = useState<
    SolicitacaoSeguidor[]
  >([]);
  const [solicitacoesEnviadasIds, setSolicitacoesEnviadasIds] = useState<
    string[]
  >([]);

  return {
    usuariosSeguidos,
    setUsuariosSeguidos,
    usuariosSeguidores,
    setUsuariosSeguidores,
    solicitacoesSeguidores,
    setSolicitacoesSeguidores,
    solicitacoesEnviadasIds,
    setSolicitacoesEnviadasIds,
  };
}
