"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { ConfiguracoesPageContent } from "./components/configuracoes-page-content";
import { ConfiguracoesPageLoadingState } from "./components/configuracoes-page-loading-state";
import { ConfiguracoesPageOverlays } from "./components/configuracoes-page-overlays";
import { useConfiguracoesActionMessage } from "./hooks/use-configuracoes-action-message";
import { useConfiguracoesBlockedUsers } from "./hooks/use-configuracoes-blocked-users";
import { useConfiguracoesAdminAccess } from "./hooks/use-configuracoes-admin-access";
import { useConfiguracoesInitialAccess } from "./hooks/use-configuracoes-initial-access";
import { useConfiguracoesAccountActionHandlers } from "./hooks/use-configuracoes-account-action-handlers";
import { useConfiguracoesPreferenceActions } from "./hooks/use-configuracoes-preference-actions";
import { useConfiguracoesPageViewModel } from "./hooks/use-configuracoes-page-view-model";
import { useConfiguracoesSecurityModalBodyLock } from "./hooks/use-configuracoes-security-modal-body-lock";
import { useConfiguracoesSecurityModalState } from "./hooks/use-configuracoes-security-modal-state";
import { configuracoesPageCss } from "./lib/configuracoes-page-css";
import {
  preferenciasPrivacidadePadrao,
} from "./lib/configuracoes-privacy-preferences";
import type {
  PreferenciasPrivacidadeHistorietas,
} from "./lib/configuracoes-privacy-preferences";
import { criarAcoesCamposOverlayConfiguracoes } from "./lib/configuracoes-overlay-field-actions";
import { preferenciasPadrao, resumoPadrao } from "./lib/configuracoes-account-models";
import type {
  PreferenciasConta,
  ResumoLocal,
  UsuarioConfiguracoes,
} from "./lib/configuracoes-account-models";
import { pageStyle } from "./lib/configuracoes-security-styles";

export default function ConfiguracoesPage() {
  const router = useRouter();
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
  const {
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
  } = useConfiguracoesSecurityModalState();
  const {
    mensagemAcao,
    setMensagemAcao,
    mostrarMensagemAcao,
  } = useConfiguracoesActionMessage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { notificacoesNaoLidas } = useNotificacoes();
  const { language } = useHistorietasLanguage();

  const usuarioIdLogado = usuario?.id || "";
  const { t, deveMostrar, totalBiblioteca } =
    useConfiguracoesPageViewModel({
      language,
      busca,
      resumo,
    });

  const {
    mostrarUsuariosBloqueados,
    usuariosBloqueados,
    setUsuariosBloqueados,
    carregandoUsuariosBloqueados,
    desbloqueandoUsuarioId,
    erroUsuariosBloqueados,
    carregarUsuariosBloqueados,
    alternarUsuariosBloqueados,
    desbloquearUsuarioConfiguracoes,
  } = useConfiguracoesBlockedUsers({
    traduzirTexto: t,
    mostrarMensagemAcao,
  });

  useConfiguracoesInitialAccess({
    router,
    setVerificandoAcesso,
    setUsuario,
    setPreferencias,
    setPrivacidade,
    setResumo,
    setUsuariosBloqueados,
  });


  useConfiguracoesAdminAccess({
    verificandoAcesso,
    setAdminLiberado,
  });

  useConfiguracoesSecurityModalBodyLock({
    mostrarSeguranca,
    salvandoSenha,
    setMostrarSeguranca,
    setSenhaAtual,
    setNovaSenha,
    setConfirmarNovaSenha,
    setErroSenha,
    setSenhaAlterada,
  });

  const {
    atualizarPreferencia,
    alternarReceberAvisos,
    aplicarPrivacidadeAtualizada,
    atualizarPrivacidade,
    alternarPerfilPrivado,
    alternarAprovacaoNovosSeguidores,
  } = useConfiguracoesPreferenceActions({
    preferencias,
    privacidade,
    usuarioIdLogado,
    setPreferencias,
    setPrivacidade,
    setMensagemAcao,
    mostrarMensagemAcao,
    traduzirTexto: t,
  });


  const {
    salvar,
    excluirConta,
    alterarSenha,
    copiarBackup,
    baixarBackup,
    sairDaConta,
  } = useConfiguracoesAccountActionHandlers({
    router,
    salvando,
    usuarioIdLogado,
    preferencias,
    privacidade,
    usuario,
    language,
    setMensagemAcao,
    mostrarMensagemAcao,
    traduzirTexto: t,
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
  });

  const {
    onSenhaAtualChange,
    onNovaSenhaChange,
    onConfirmarNovaSenhaChange,
    onSenhaExclusaoContaChange,
    onConfirmacaoExclusaoContaChange,
    onFecharMensagemAcao,
  } = criarAcoesCamposOverlayConfiguracoes({
    setSenhaAtual,
    setNovaSenha,
    setConfirmarNovaSenha,
    setErroSenha,
    setSenhaExclusaoConta,
    setConfirmacaoExclusaoConta,
    setErroExclusaoConta,
    setMensagemAcao,
  });

  if (verificandoAcesso) {
    return (
      <ConfiguracoesPageLoadingState
        pageThemeStyle={pageThemeStyle}
        themeCss={historietasThemeCss}
        pageCss={configuracoesPageCss}
        label={t(
          "Carregando configurações",
          "Loading settings",
          "Cargando configuración",
        )}
      />
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${configuracoesPageCss}`}</style>

      <ConfiguracoesPageContent
        busca={busca}
        onBuscaChange={setBusca}
        onVoltar={() => router.back()}
        traduzirTexto={t}
        deveMostrar={deveMostrar}
        preferencias={preferencias}
        privacidade={privacidade}
        resumo={resumo}
        totalBiblioteca={totalBiblioteca}
        notificacoesNaoLidas={notificacoesNaoLidas}
        usuarioNome={usuario?.nome}
        usuarioEmail={usuario?.email}
        erroUsername={erroUsername}
        salvando={salvando}
        adminLiberado={adminLiberado}
        mostrarUsuariosBloqueados={mostrarUsuariosBloqueados}
        usuariosBloqueados={usuariosBloqueados}
        carregandoUsuariosBloqueados={carregandoUsuariosBloqueados}
        desbloqueandoUsuarioId={desbloqueandoUsuarioId}
        erroUsuariosBloqueados={erroUsuariosBloqueados}
        onAtualizarPreferencia={atualizarPreferencia}
        onLimparErroUsername={() => setErroUsername("")}
        onSalvar={salvar}
        onAbrirSeguranca={abrirSeguranca}
        onAlternarPerfilPrivado={alternarPerfilPrivado}
        onAlternarAprovacaoNovosSeguidores={alternarAprovacaoNovosSeguidores}
        onCarregarUsuariosBloqueados={carregarUsuariosBloqueados}
        onAlternarUsuariosBloqueados={alternarUsuariosBloqueados}
        onDesbloquearUsuario={desbloquearUsuarioConfiguracoes}
        onAtualizarPrivacidade={atualizarPrivacidade}
        onAplicarPrivacidadeAtualizada={aplicarPrivacidadeAtualizada}
        onAlternarReceberAvisos={alternarReceberAvisos}
        onCopiarBackup={copiarBackup}
        onBaixarBackup={baixarBackup}
        onAbrirExclusaoConta={abrirExclusaoConta}
        onSairDaConta={sairDaConta}
      />

      <ConfiguracoesPageOverlays
        mostrarSeguranca={mostrarSeguranca}
        onFecharSeguranca={fecharSeguranca}
        onAlterarSenha={alterarSenha}
        senhaAtual={senhaAtual}
        onSenhaAtualChange={onSenhaAtualChange}
        novaSenha={novaSenha}
        onNovaSenhaChange={onNovaSenhaChange}
        confirmarNovaSenha={confirmarNovaSenha}
        onConfirmarNovaSenhaChange={onConfirmarNovaSenhaChange}
        salvandoSenha={salvandoSenha}
        erroSenha={erroSenha}
        senhaAlterada={senhaAlterada}
        mostrarExclusaoConta={mostrarExclusaoConta}
        onFecharExclusaoConta={fecharExclusaoConta}
        onExcluirConta={excluirConta}
        senhaExclusaoConta={senhaExclusaoConta}
        onSenhaExclusaoContaChange={onSenhaExclusaoContaChange}
        confirmacaoExclusaoConta={confirmacaoExclusaoConta}
        onConfirmacaoExclusaoContaChange={onConfirmacaoExclusaoContaChange}
        excluindoConta={excluindoConta}
        erroExclusaoConta={erroExclusaoConta}
        mensagemAcao={mensagemAcao}
        onFecharMensagemAcao={onFecharMensagemAcao}
        traduzirTexto={t}
      />
    </main>
  );
}
