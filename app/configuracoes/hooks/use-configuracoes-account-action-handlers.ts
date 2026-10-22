"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { supabase } from "../../../lib/supabase/client";
import { excluirContaConfiguracoes } from "../lib/configuracoes-account-deletion-action";
import {
  baixarBackupContaConfiguracoes,
  copiarBackupConfiguracoes,
} from "../lib/configuracoes-account-backup-actions";
import type {
  PreferenciasConta,
  ResumoLocal,
  UsuarioConfiguracoes,
} from "../lib/configuracoes-account-models";
import { alterarSenhaConfiguracoes } from "../lib/configuracoes-password-change-action";
import { salvarConfiguracoesPerfil } from "../lib/configuracoes-profile-save-action";
import type { PreferenciasPrivacidadeHistorietas } from "../lib/configuracoes-privacy-preferences";
import { criarLoginHrefConfiguracoes } from "../lib/configuracoes-route-utils";
import { sairDaContaConfiguracoes } from "../lib/configuracoes-sign-out-action";
import type { RouterConfiguracoesAtualizavel } from "../lib/configuracoes-navigation-types";
import type {
  LimparMensagemAcaoConfiguracoes,
  MostrarMensagemAcaoConfiguracoes,
  TraduzirTextoConfiguracoes,
} from "../lib/configuracoes-callback-types";

export function useConfiguracoesAccountActionHandlers({
  router,
  salvando,
  usuarioIdLogado,
  preferencias,
  privacidade,
  usuario,
  language,
  setMensagemAcao,
  mostrarMensagemAcao,
  traduzirTexto,
  setErroUsername,
  setSalvando,
  setPreferencias,
  setUsuario,
  setResumo,
  excluindoConta,
  senhaExclusaoConta,
  confirmacaoExclusaoConta,
  setErroExclusaoConta,
  setExcluindoConta,
  salvandoSenha,
  senhaAlterada,
  senhaAtual,
  novaSenha,
  confirmarNovaSenha,
  setSenhaAtual,
  setNovaSenha,
  setConfirmarNovaSenha,
  setSalvandoSenha,
  setErroSenha,
  setSenhaAlterada,
}: {
  router: RouterConfiguracoesAtualizavel;
  salvando: boolean;
  usuarioIdLogado: string;
  preferencias: PreferenciasConta;
  privacidade: PreferenciasPrivacidadeHistorietas;
  usuario: UsuarioConfiguracoes | null;
  language: HistorietasLanguage;
  setMensagemAcao: LimparMensagemAcaoConfiguracoes;
  mostrarMensagemAcao: MostrarMensagemAcaoConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
  setErroUsername: Dispatch<SetStateAction<string>>;
  setSalvando: Dispatch<SetStateAction<boolean>>;
  setPreferencias: Dispatch<SetStateAction<PreferenciasConta>>;
  setUsuario: Dispatch<SetStateAction<UsuarioConfiguracoes | null>>;
  setResumo: Dispatch<SetStateAction<ResumoLocal>>;
  excluindoConta: boolean;
  senhaExclusaoConta: string;
  confirmacaoExclusaoConta: string;
  setErroExclusaoConta: Dispatch<SetStateAction<string>>;
  setExcluindoConta: Dispatch<SetStateAction<boolean>>;
  salvandoSenha: boolean;
  senhaAlterada: boolean;
  senhaAtual: string;
  novaSenha: string;
  confirmarNovaSenha: string;
  setSenhaAtual: Dispatch<SetStateAction<string>>;
  setNovaSenha: Dispatch<SetStateAction<string>>;
  setConfirmarNovaSenha: Dispatch<SetStateAction<string>>;
  setSalvandoSenha: Dispatch<SetStateAction<boolean>>;
  setErroSenha: Dispatch<SetStateAction<string>>;
  setSenhaAlterada: Dispatch<SetStateAction<boolean>>;
}) {
  async function salvar() {
    await salvarConfiguracoesPerfil({
      salvando,
      usuarioIdLogado,
      preferencias,
      privacidade,
      usuario,
      language,
      redirecionarLogin: () => router.replace(criarLoginHrefConfiguracoes()),
      setMensagemAcao,
      mostrarMensagemAcao,
      traduzirTexto,
      setErroUsername,
      setSalvando,
      setPreferencias,
      setUsuario,
      setResumo,
    });
  }

  async function excluirConta(event: FormEvent<HTMLFormElement>) {
    await excluirContaConfiguracoes({
      event,
      excluindoConta,
      senhaExclusaoConta,
      confirmacaoExclusaoConta,
      language,
      usuarioIdLogado,
      setErroExclusaoConta,
      setExcluindoConta,
      redirecionarLogin: () => router.replace("/login"),
      atualizarRota: () => router.refresh(),
      traduzirTexto,
    });
  }

  async function alterarSenha(event: FormEvent<HTMLFormElement>) {
    await alterarSenhaConfiguracoes({
      event,
      salvandoSenha,
      senhaAlterada,
      senhaAtual,
      novaSenha,
      confirmarNovaSenha,
      language,
      usuarioIdLogado,
      setSenhaAtual,
      setNovaSenha,
      setConfirmarNovaSenha,
      setSalvandoSenha,
      setErroSenha,
      setSenhaAlterada,
      traduzirTexto,
    });
  }

  const copiarBackup = () =>
    copiarBackupConfiguracoes({
      usuarioIdLogado,
      setMensagemAcao,
      mostrarMensagemAcao,
      traduzirTexto,
    });

  const baixarBackup = () =>
    baixarBackupContaConfiguracoes({
      usuarioIdLogado,
      setMensagemAcao,
      mostrarMensagemAcao,
      traduzirTexto,
    });

  async function sairDaConta() {
    await sairDaContaConfiguracoes({
      limparMensagem: () => setMensagemAcao(null),
      encerrarSessao: () => supabase.auth.signOut(),
      redirecionarLogin: () => router.replace("/login"),
      atualizarRota: () => router.refresh(),
      mostrarMensagemAcao,
      traduzirTexto,
    });
  }

  return {
    salvar,
    excluirConta,
    alterarSenha,
    copiarBackup,
    baixarBackup,
    sairDaConta,
  };
}
