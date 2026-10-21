"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { ConfiguracoesAccountActionsSection } from "./components/configuracoes-account-actions-section";
import { LoadingSpinner } from "./components/configuracoes-loading-spinner";
import { ConfiguracoesAccountDeletionModal } from "./components/configuracoes-account-deletion-modal";
import { ConfiguracoesActionToast } from "./components/configuracoes-action-toast";
import { ConfiguracoesDiaryPrivacySection } from "./components/configuracoes-diary-privacy-section";
import { ConfiguracoesPageHeader } from "./components/configuracoes-page-header";
import { ConfiguracoesProfileCard } from "./components/configuracoes-profile-card";
import { ConfiguracoesProfilePrivacySection } from "./components/configuracoes-profile-privacy-section";
import { ConfiguracoesProfileTabVisibilitySection } from "./components/configuracoes-profile-tab-visibility-section";
import { ConfiguracoesSearch } from "./components/configuracoes-search";
import { ConfiguracoesSecurityPasswordModal } from "./components/configuracoes-security-password-modal";
import { ConfiguracoesDataSection } from "./components/configuracoes-data-section";
import { ConfiguracoesModerationSection } from "./components/configuracoes-moderation-section";
import { ConfiguracoesPreferencesSection } from "./components/configuracoes-preferences-section";
import { ConfiguracoesSupportSection } from "./components/configuracoes-support-section";
import { ConfiguracoesUsageSummarySection } from "./components/configuracoes-usage-summary-section";
import {
  SettingsInput,
  SettingsRow,
  SettingsSection,
  ValorLinha,
} from "./components/configuracoes-settings-primitives";
import { useConfiguracoesActionMessage } from "./hooks/use-configuracoes-action-message";
import { useConfiguracoesBlockedUsers } from "./hooks/use-configuracoes-blocked-users";
import { useConfiguracoesAdminAccess } from "./hooks/use-configuracoes-admin-access";
import { useConfiguracoesInitialAccess } from "./hooks/use-configuracoes-initial-access";
import { useConfiguracoesAccountActionHandlers } from "./hooks/use-configuracoes-account-action-handlers";
import { useConfiguracoesPreferenceActions } from "./hooks/use-configuracoes-preference-actions";
import { useConfiguracoesSecurityModalBodyLock } from "./hooks/use-configuracoes-security-modal-body-lock";
import { useConfiguracoesSecurityModalState } from "./hooks/use-configuracoes-security-modal-state";
import { configuracoesPageCss } from "./lib/configuracoes-page-css";
import {
  normalizarTextoBuscaConfiguracoes,
  textoIdioma,
} from "./lib/configuracoes-search-utils";
import { deveMostrarSecaoConfiguracoes } from "./lib/configuracoes-search-visibility-utils";
import { containerStyle } from "./lib/configuracoes-shell-styles";
import { normalizarUsernameConfiguracoes } from "./lib/configuracoes-account-utils";
import {
  preferenciasPrivacidadePadrao,
} from "./lib/configuracoes-privacy-preferences";
import type {
  PreferenciasPrivacidadeHistorietas,
} from "./lib/configuracoes-privacy-preferences";
import {
  calcularTotalBibliotecaConfiguracoes,
} from "./lib/configuracoes-account-preference-state-utils";
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

  function t(portugues: string, ingles: string, espanhol: string) {
    return textoIdioma(language, portugues, ingles, espanhol);
  }

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

  const buscaNormalizada = normalizarTextoBuscaConfiguracoes(busca);

  const deveMostrar = (...termos: string[]) =>
    deveMostrarSecaoConfiguracoes(buscaNormalizada, ...termos);

  const totalBiblioteca = useMemo(
    () =>
      calcularTotalBibliotecaConfiguracoes(
        resumo.favoritas,
        resumo.concluidas,
        resumo.seguindoObras,
      ),
    [resumo.concluidas, resumo.favoritas, resumo.seguindoObras],
  );

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

  if (verificandoAcesso) {
    return (
      <main style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${configuracoesPageCss}`}</style>
        <LoadingSpinner
          label={t(
            "Carregando configurações",
            "Loading settings",
            "Cargando configuración",
          )}
        />
      </main>
    );
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${configuracoesPageCss}`}</style>

      <section style={containerStyle}>
        <ConfiguracoesPageHeader
          onVoltar={() => router.back()}
          traduzirTexto={t}
        />

        <ConfiguracoesSearch
          busca={busca}
          onBuscaChange={setBusca}
          traduzirTexto={t}
        />

        <ConfiguracoesProfileCard
          nomeExibicao={preferencias.nomeExibicao}
          username={preferencias.username}
          emailContato={preferencias.emailContato}
          usuarioNome={usuario?.nome}
          usuarioEmail={usuario?.email}
          traduzirTexto={t}
        />

        {deveMostrar(
          "conta",
          "nome",
          "username",
          "usuário",
          "email",
          "senha",
          "privacidade",
          "salvar",
        ) ? (
          <SettingsSection
            title={t("Sua conta", "Your account", "Tu cuenta")}
          >
            {deveMostrar("nome", "exibição", "autor") ? (
              <SettingsInput
                icon="user"
                label={t(
                  "Nome de exibição",
                  "Display name",
                  "Nombre visible",
                )}
                value={preferencias.nomeExibicao}
                onChange={(valor) =>
                  atualizarPreferencia("nomeExibicao", valor)
                }
                placeholder={t(
                  "Ex: Nome do autor",
                  "Example: Author name",
                  "Ejemplo: Nombre del autor",
                )}
                maxLength={80}
                autoComplete="name"
              />
            ) : null}

            {deveMostrar("username", "usuário", "perfil", "arroba") ? (
              <SettingsInput
                icon="user"
                label="@username"
                value={preferencias.username}
                onChange={(valor) => {
                  setErroUsername("");
                  atualizarPreferencia(
                    "username",
                    normalizarUsernameConfiguracoes(valor),
                  );
                }}
                placeholder={t(
                  "ex: username",
                  "example: username",
                  "ejemplo: username",
                )}
                maxLength={30}
                autoComplete="username"
                helperText={erroUsername || undefined}
                error={Boolean(erroUsername)}
              />
            ) : null}

            {deveMostrar("email", "contato") ? (
              <SettingsInput
                icon="mail"
                label={t(
                  "E-mail de contato",
                  "Contact email",
                  "Correo de contacto",
                )}
                value={preferencias.emailContato}
                onChange={(valor) =>
                  atualizarPreferencia("emailContato", valor)
                }
                placeholder={t(
                  "Ex: seuemail@email.com",
                  "Example: youremail@email.com",
                  "Ejemplo: tucorreo@email.com",
                )}
                type="email"
                maxLength={254}
                autoComplete="email"
              />
            ) : null}

            {deveMostrar("salvar", "alterações", "configurações") ? (
              <SettingsRow
                icon="check"
                title={
                  salvando
                    ? t("Salvando...", "Saving...", "Guardando...")
                    : t(
                        "Salvar alterações",
                        "Save changes",
                        "Guardar cambios",
                      )
                }
                subtitle={t(
                  "Grava suas preferências nesta conta",
                  "Saves your preferences to this account",
                  "Guarda tus preferencias en esta cuenta",
                )}
                right={
                  salvando ? (
                    <LoadingSpinner
                      compacto
                      label={t(
                        "Salvando alterações",
                        "Saving changes",
                        "Guardando cambios",
                      )}
                    />
                  ) : undefined
                }
                onClick={salvar}
                hideChevron={salvando}
              />
            ) : null}

            {deveMostrar("senha", "segurança") ? (
              <SettingsRow
                icon="lock"
                title={t(
                  "Senha e segurança",
                  "Password and security",
                  "Contraseña y seguridad",
                )}
                subtitle={t(
                  "Altere com segurança sua senha de acesso",
                  "Securely change your access password",
                  "Cambia de forma segura tu contraseña de acceso",
                )}
                right={
                  <ValorLinha>
                    {t("Alterar", "Change", "Cambiar")}
                  </ValorLinha>
                }
                onClick={abrirSeguranca}
              />
            ) : null}
          </SettingsSection>
        ) : null}

        <ConfiguracoesProfilePrivacySection
          deveMostrar={deveMostrar}
          traduzirTexto={t}
          privacidade={privacidade}
          onAlternarPerfilPrivado={alternarPerfilPrivado}
          onAlternarAprovacaoNovosSeguidores={alternarAprovacaoNovosSeguidores}
          mostrarUsuariosBloqueados={mostrarUsuariosBloqueados}
          usuariosBloqueados={usuariosBloqueados}
          carregandoUsuariosBloqueados={carregandoUsuariosBloqueados}
          desbloqueandoUsuarioId={desbloqueandoUsuarioId}
          erroUsuariosBloqueados={erroUsuariosBloqueados}
          onCarregarUsuariosBloqueados={carregarUsuariosBloqueados}
          onAlternarUsuariosBloqueados={alternarUsuariosBloqueados}
          onDesbloquearUsuario={desbloquearUsuarioConfiguracoes}
        />

        <ConfiguracoesProfileTabVisibilitySection
          deveMostrar={deveMostrar}
          traduzirTexto={t}
          privacidade={privacidade}
          onAtualizarPrivacidade={atualizarPrivacidade}
        />

        <ConfiguracoesDiaryPrivacySection
          deveMostrar={deveMostrar}
          traduzirTexto={t}
          privacidade={privacidade}
          onAplicarPrivacidadeAtualizada={aplicarPrivacidadeAtualizada}
          onAtualizarPrivacidade={atualizarPrivacidade}
        />

        <ConfiguracoesModerationSection
          adminLiberado={adminLiberado}
          deveMostrar={deveMostrar}
          traduzirTexto={t}
        />

        <ConfiguracoesUsageSummarySection
          deveMostrar={deveMostrar}
          traduzirTexto={t}
          resumo={resumo}
          totalBiblioteca={totalBiblioteca}
          notificacoesNaoLidas={notificacoesNaoLidas}
        />

        <ConfiguracoesPreferencesSection
          deveMostrar={deveMostrar}
          traduzirTexto={t}
          preferencias={preferencias}
          onAlternarReceberAvisos={alternarReceberAvisos}
        />

        <ConfiguracoesDataSection
          deveMostrar={deveMostrar}
          traduzirTexto={t}
          resumo={resumo}
          onCopiarBackup={copiarBackup}
          onBaixarBackup={baixarBackup}
        />

        <ConfiguracoesSupportSection
          deveMostrar={deveMostrar}
          traduzirTexto={t}
        />

        <ConfiguracoesAccountActionsSection
          deveMostrar={deveMostrar}
          traduzirTexto={t}
          onAbrirExclusaoConta={abrirExclusaoConta}
          onSairDaConta={sairDaConta}
        />
      </section>

      {mostrarSeguranca ? (
        <ConfiguracoesSecurityPasswordModal
          onFechar={fecharSeguranca}
          onSubmit={alterarSenha}
          senhaAtual={senhaAtual}
          onSenhaAtualChange={(valor) => {
            setSenhaAtual(valor);
            setErroSenha("");
          }}
          novaSenha={novaSenha}
          onNovaSenhaChange={(valor) => {
            setNovaSenha(valor);
            setErroSenha("");
          }}
          confirmarNovaSenha={confirmarNovaSenha}
          onConfirmarNovaSenhaChange={(valor) => {
            setConfirmarNovaSenha(valor);
            setErroSenha("");
          }}
          salvandoSenha={salvandoSenha}
          erroSenha={erroSenha}
          senhaAlterada={senhaAlterada}
          traduzirTexto={t}
        />
      ) : null}

      {mostrarExclusaoConta ? (
        <ConfiguracoesAccountDeletionModal
          onFechar={fecharExclusaoConta}
          onSubmit={excluirConta}
          senhaExclusaoConta={senhaExclusaoConta}
          onSenhaExclusaoContaChange={(valor) => {
            setSenhaExclusaoConta(valor);
            setErroExclusaoConta("");
          }}
          confirmacaoExclusaoConta={confirmacaoExclusaoConta}
          onConfirmacaoExclusaoContaChange={(valor) => {
            setConfirmacaoExclusaoConta(valor);
            setErroExclusaoConta("");
          }}
          excluindoConta={excluindoConta}
          erroExclusaoConta={erroExclusaoConta}
          traduzirTexto={t}
        />
      ) : null}

      {mensagemAcao ? (
        <ConfiguracoesActionToast
          mensagem={mensagemAcao}
          onFechar={() => setMensagemAcao(null)}
          traduzirTexto={t}
        />
      ) : null}
    </main>
  );
}
