"use client";

import { useState } from "react";
import type {
  AtividadeSeguindo,
  ObraLocal,
  SolicitacaoSeguidor,
  UsuarioSeguido,
} from "../lib/seguindo-page-types";

export function useSeguindoDataState() {
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [obrasSeguidas, setObrasSeguidas] = useState<string[]>([]);
  const [autoresSeguidos, setAutoresSeguidos] = useState<string[]>([]);
  const [usuariosSeguidos, setUsuariosSeguidos] = useState<UsuarioSeguido[]>([]);
  const [usuariosSeguidores, setUsuariosSeguidores] = useState<UsuarioSeguido[]>([]);
  const [solicitacoesSeguidores, setSolicitacoesSeguidores] = useState<
    SolicitacaoSeguidor[]
  >([]);
  const [solicitacoesEnviadasIds, setSolicitacoesEnviadasIds] = useState<
    string[]
  >([]);
  const [, setAtividadesSeguindo] = useState<AtividadeSeguindo[]>([]);
  const [carregando, setCarregando] = useState(true);

  return {
    obras,
    setObras,
    obrasSeguidas,
    setObrasSeguidas,
    autoresSeguidos,
    setAutoresSeguidos,
    usuariosSeguidos,
    setUsuariosSeguidos,
    usuariosSeguidores,
    setUsuariosSeguidores,
    solicitacoesSeguidores,
    setSolicitacoesSeguidores,
    solicitacoesEnviadasIds,
    setSolicitacoesEnviadasIds,
    setAtividadesSeguindo,
    carregando,
    setCarregando,
  };
}
