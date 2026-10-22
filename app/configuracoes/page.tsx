"use client";

import { useRouter } from "next/navigation";
import { historietasThemeCss } from "../../lib/historietasTheme";
import { ConfiguracoesPageContent } from "./components/configuracoes-page-content";
import { ConfiguracoesPageLoadingState } from "./components/configuracoes-page-loading-state";
import { ConfiguracoesPageOverlays } from "./components/configuracoes-page-overlays";
import { useConfiguracoesActionMessage } from "./hooks/use-configuracoes-action-message";
import { useConfiguracoesAccessOrchestration } from "./hooks/use-configuracoes-access-orchestration";
import { useConfiguracoesAccountActionHandlers } from "./hooks/use-configuracoes-account-action-handlers";
import { useConfiguracoesPreferenceActions } from "./hooks/use-configuracoes-preference-actions";
import { useConfiguracoesPagePresentation } from "./hooks/use-configuracoes-page-presentation";
import { useConfiguracoesPageState } from "./hooks/use-configuracoes-page-state";
import { useConfiguracoesSecurityModalBodyLock } from "./hooks/use-configuracoes-security-modal-body-lock";
import { useConfiguracoesSecurityModalState } from "./hooks/use-configuracoes-security-modal-state";
import { configuracoesPageCss } from "./lib/configuracoes-page-css";
import { criarAcoesPaginaConfiguracoes } from "./lib/configuracoes-page-actions";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const {
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
  } = useConfiguracoesPageState();
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
  const {
    pageThemeStyle,
    notificacoesNaoLidas,
    language,
    usuarioIdLogado,
    t,
    deveMostrar,
    totalBiblioteca,
  } = useConfiguracoesPagePresentation({
    busca,
    resumo,
    usuario,
  });

  const {
    mostrarUsuariosBloqueados,
    usuariosBloqueados,
    carregandoUsuariosBloqueados,
    desbloqueandoUsuarioId,
    erroUsuariosBloqueados,
    carregarUsuariosBloqueados,
    alternarUsuariosBloqueados,
    desbloquearUsuarioConfiguracoes,
  } = useConfiguracoesAccessOrchestration({
    router,
    setVerificandoAcesso,
    setUsuario,
    setPreferencias,
    setPrivacidade,
    setResumo,
    verificandoAcesso,
    setAdminLiberado,
    traduzirTexto: t,
    mostrarMensagemAcao,
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
    onVoltar,
    onLimparErroUsername,
  } = criarAcoesPaginaConfiguracoes({
    router,
    setErroUsername,
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
        onVoltar={onVoltar}
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
        onLimparErroUsername={onLimparErroUsername}
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
