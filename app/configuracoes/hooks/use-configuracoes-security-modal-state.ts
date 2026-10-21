"use client";

import { useState } from "react";
import {
  abrirExclusaoContaConfiguracoes,
  abrirSegurancaConfiguracoes,
  fecharExclusaoContaConfiguracoes,
  fecharSegurancaConfiguracoes,
} from "../lib/configuracoes-modal-state-actions";

export function useConfiguracoesSecurityModalState() {
  const [mostrarSeguranca, setMostrarSeguranca] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState("");
  const [senhaAlterada, setSenhaAlterada] = useState(false);
  const [mostrarExclusaoConta, setMostrarExclusaoConta] = useState(false);
  const [senhaExclusaoConta, setSenhaExclusaoConta] = useState("");
  const [confirmacaoExclusaoConta, setConfirmacaoExclusaoConta] = useState("");
  const [excluindoConta, setExcluindoConta] = useState(false);
  const [erroExclusaoConta, setErroExclusaoConta] = useState("");

  function abrirExclusaoConta() {
    abrirExclusaoContaConfiguracoes({
      setSenhaExclusaoConta,
      setConfirmacaoExclusaoConta,
      setErroExclusaoConta,
      setMostrarExclusaoConta,
    });
  }

  function fecharExclusaoConta() {
    fecharExclusaoContaConfiguracoes({
      excluindoConta,
      setSenhaExclusaoConta,
      setConfirmacaoExclusaoConta,
      setErroExclusaoConta,
      setMostrarExclusaoConta,
    });
  }

  function abrirSeguranca() {
    abrirSegurancaConfiguracoes({
      setSenhaAtual,
      setNovaSenha,
      setConfirmarNovaSenha,
      setErroSenha,
      setSenhaAlterada,
      setMostrarSeguranca,
    });
  }

  function fecharSeguranca() {
    fecharSegurancaConfiguracoes({
      salvandoSenha,
      setSenhaAtual,
      setNovaSenha,
      setConfirmarNovaSenha,
      setErroSenha,
      setSenhaAlterada,
      setMostrarSeguranca,
    });
  }

  return {
    mostrarSeguranca,
    setMostrarSeguranca,
    senhaAtual,
    setSenhaAtual,
    novaSenha,
    setNovaSenha,
    confirmarNovaSenha,
    setConfirmarNovaSenha,
    salvandoSenha,
    setSalvandoSenha,
    erroSenha,
    setErroSenha,
    senhaAlterada,
    setSenhaAlterada,
    mostrarExclusaoConta,
    setMostrarExclusaoConta,
    senhaExclusaoConta,
    setSenhaExclusaoConta,
    confirmacaoExclusaoConta,
    setConfirmacaoExclusaoConta,
    excluindoConta,
    setExcluindoConta,
    erroExclusaoConta,
    setErroExclusaoConta,
    abrirExclusaoConta,
    fecharExclusaoConta,
    abrirSeguranca,
    fecharSeguranca,
  };
}
