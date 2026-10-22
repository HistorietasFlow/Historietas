"use client";

import { useState } from "react";
import { preferenciasPadrao, resumoPadrao } from "../lib/configuracoes-account-models";
import type {
  PreferenciasConta,
  ResumoLocal,
  UsuarioConfiguracoes,
} from "../lib/configuracoes-account-models";
import {
  preferenciasPrivacidadePadrao,
} from "../lib/configuracoes-privacy-preferences";
import type {
  PreferenciasPrivacidadeHistorietas,
} from "../lib/configuracoes-privacy-preferences";

export function useConfiguracoesPageState() {
  const [verificandoAcesso, setVerificandoAcesso] = useState(true);
  const [usuario, setUsuario] = useState<UsuarioConfiguracoes | null>(null);
  const [preferencias, setPreferencias] =
    useState<PreferenciasConta>(preferenciasPadrao);
  const [privacidade, setPrivacidade] =
    useState<PreferenciasPrivacidadeHistorietas>(
      preferenciasPrivacidadePadrao,
    );
  const [resumo, setResumo] = useState<ResumoLocal>(resumoPadrao);
  const [erroUsername, setErroUsername] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [adminLiberado, setAdminLiberado] = useState(false);

  return {
    verificandoAcesso,
    setVerificandoAcesso,
    usuario,
    setUsuario,
    preferencias,
    setPreferencias,
    privacidade,
    setPrivacidade,
    resumo,
    setResumo,
    erroUsername,
    setErroUsername,
    salvando,
    setSalvando,
    busca,
    setBusca,
    adminLiberado,
    setAdminLiberado,
  };
}
