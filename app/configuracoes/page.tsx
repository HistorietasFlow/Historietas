"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../../lib/supabase/client";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import LanguageSelect from "../../components/LanguageSelect";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { LoadingSpinner } from "./components/configuracoes-loading-spinner";
import { ConfiguracoesActionToast } from "./components/configuracoes-action-toast";
import { ConfiguracoesBlockedUsersPanel } from "./components/configuracoes-blocked-users-panel";
import { ConfiguracoesPageHeader } from "./components/configuracoes-page-header";
import { ConfiguracoesProfileCard } from "./components/configuracoes-profile-card";
import { ConfiguracoesSearch } from "./components/configuracoes-search";
import { SvgIcon } from "./components/configuracoes-svg-icon";
import { Toggle } from "./components/configuracoes-toggle";
import {
  SettingsInput,
  SettingsRow,
  SettingsSection,
  SectionTitle,
  ValorLinha,
} from "./components/configuracoes-settings-primitives";
import { useConfiguracoesActionMessage } from "./hooks/use-configuracoes-action-message";
import { useConfiguracoesBlockedUsers } from "./hooks/use-configuracoes-blocked-users";
import { useConfiguracoesAdminAccess } from "./hooks/use-configuracoes-admin-access";
import { useConfiguracoesInitialAccess } from "./hooks/use-configuracoes-initial-access";
import { useConfiguracoesPreferenceActions } from "./hooks/use-configuracoes-preference-actions";
import { useConfiguracoesSecurityModalBodyLock } from "./hooks/use-configuracoes-security-modal-body-lock";
import { useConfiguracoesSecurityModalState } from "./hooks/use-configuracoes-security-modal-state";
import { configuracoesPageCss } from "./lib/configuracoes-page-css";
import {
  normalizarTextoBuscaConfiguracoes,
  textoIdioma,
} from "./lib/configuracoes-search-utils";
import { deveMostrarSecaoConfiguracoes } from "./lib/configuracoes-search-visibility-utils";
import { sectionStyle } from "./lib/configuracoes-settings-primitives-styles";
import { containerStyle } from "./lib/configuracoes-shell-styles";
import { normalizarUsernameConfiguracoes } from "./lib/configuracoes-account-utils";
import {
  preferenciasPrivacidadePadrao,
} from "./lib/configuracoes-privacy-preferences";
import type {
  PreferenciasPrivacidadeHistorietas,
  QuemPodeAvaliarDiario,
  QuemPodeComentarDiario,
  VisibilidadeAbaPerfil,
} from "./lib/configuracoes-privacy-preferences";
import { criarLoginHrefConfiguracoes } from "./lib/configuracoes-route-utils";
import { salvarConfiguracoesPerfil } from "./lib/configuracoes-profile-save-action";
import { excluirContaConfiguracoes } from "./lib/configuracoes-account-deletion-action";
import { alterarSenhaConfiguracoes } from "./lib/configuracoes-password-change-action";
import {
  baixarBackupContaConfiguracoes,
  copiarBackupConfiguracoes,
} from "./lib/configuracoes-account-backup-actions";
import {
  calcularTotalBibliotecaConfiguracoes,
} from "./lib/configuracoes-account-preference-state-utils";
import { sairDaContaConfiguracoes } from "./lib/configuracoes-sign-out-action";
import { preferenciasPadrao, resumoPadrao } from "./lib/configuracoes-account-models";
import type {
  PreferenciasConta,
  ResumoLocal,
  UsuarioConfiguracoes,
} from "./lib/configuracoes-account-models";
import {
  deleteDangerButtonDisabledStyle,
  deleteDangerButtonStyle,
  deleteModalIconStyle,
  deletePublicLinkStyle,
  deleteWarningListStyle,
  deleteWarningStyle,
  listCardTransparentStyle,
  pageStyle,
  privacySelectStyle,
  securityActionsStyle,
  securityCloseButtonDisabledStyle,
  securityCloseButtonStyle,
  securityDoneButtonStyle,
  securityErrorStyle,
  securityFeedbackTextStyle,
  securityFieldLabelStyle,
  securityFieldStyle,
  securityFormStyle,
  securityHintStyle,
  securityModalHeaderStyle,
  securityModalHeadingStyle,
  securityModalIconStyle,
  securityModalStyle,
  securityModalSubtitleStyle,
  securityModalTitleStyle,
  securityOverlayStyle,
  securityPasswordInputStyle,
  securityPrimaryButtonDisabledStyle,
  securityPrimaryButtonStyle,
  securitySecondaryButtonDisabledStyle,
  securitySecondaryButtonStyle,
  securitySuccessStyle,
} from "./lib/configuracoes-security-styles";

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
      traduzirTexto: t,
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
      traduzirTexto: t,
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
      traduzirTexto: t,
    });
  }

  const copiarBackup = () =>
    copiarBackupConfiguracoes({
      usuarioIdLogado,
      setMensagemAcao,
      mostrarMensagemAcao,
      traduzirTexto: t,
    });

  const baixarBackup = () =>
    baixarBackupContaConfiguracoes({
      usuarioIdLogado,
      setMensagemAcao,
      mostrarMensagemAcao,
      traduzirTexto: t,
    });

  async function sairDaConta() {
    await sairDaContaConfiguracoes({
      limparMensagem: () => setMensagemAcao(null),
      encerrarSessao: () => supabase.auth.signOut(),
      redirecionarLogin: () => router.replace("/login"),
      atualizarRota: () => router.refresh(),
      mostrarMensagemAcao,
      traduzirTexto: t,
    });
  }

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

        {deveMostrar(
          "privacidade",
          "perfil",
          "privado",
          "seguidores",
          "aprovação",
          "solicitações",
          "bloqueio",
          "bloqueados",
          "desbloquear",
        ) ? (
          <SettingsSection
            title={t(
              "Privacidade do perfil",
              "Profile privacy",
              "Privacidad del perfil",
            )}
          >
            {deveMostrar("perfil", "privado", "visibilidade") ? (
              <SettingsRow
                icon="lock"
                title={t(
                  "Perfil privado",
                  "Private profile",
                  "Perfil privado",
                )}
                subtitle={t(
                  "Controla quem pode seguir você.",
                  "Controls who can follow you.",
                  "Controla quién puede seguirte.",
                )}
                right={
                  <Toggle
                    checked={privacidade.perfilPrivado}
                    onChange={alternarPerfilPrivado}
                    ariaLabel={t(
                      "Ativar ou desativar perfil privado",
                      "Enable or disable private profile",
                      "Activar o desactivar el perfil privado",
                    )}
                  />
                }
                hideChevron
              />
            ) : null}

            {deveMostrar(
              "aprovar",
              "aprovação",
              "seguidores",
              "solicitações",
            ) ? (
              <SettingsRow
                icon="user"
                title={t(
                  "Aprovar novos seguidores",
                  "Approve new followers",
                  "Aprobar nuevos seguidores",
                )}
                subtitle={
                  privacidade.perfilPrivado
                    ? t(
                        "Novos seguidores precisam da sua aprovação",
                        "New followers need your approval",
                        "Los nuevos seguidores necesitan tu aprobación",
                      )
                    : t(
                        "Ative para receber solicitações antes de alguém seguir você",
                        "Turn this on to receive requests before someone follows you",
                        "Actívalo para recibir solicitudes antes de que alguien te siga",
                      )
                }
                right={
                  <Toggle
                    checked={privacidade.aprovarNovosSeguidores}
                    onChange={alternarAprovacaoNovosSeguidores}
                    ariaLabel={t(
                      "Ativar ou desativar aprovação de novos seguidores",
                      "Enable or disable approval of new followers",
                      "Activar o desactivar la aprobación de nuevos seguidores",
                    )}
                  />
                }
                hideChevron
              />
            ) : null}

            {deveMostrar(
              "bloqueio",
              "bloqueados",
              "desbloquear",
              "privacidade",
            ) ? (
              <>
                <SettingsRow
                  icon="shield"
                  title={t(
                    "Usuários bloqueados",
                    "Blocked users",
                    "Usuarios bloqueados",
                  )}
                  subtitle={t(
                    "Revise e desbloqueie perfis da sua lista",
                    "Review and unblock profiles on your list",
                    "Revisa y desbloquea perfiles de tu lista",
                  )}
                  right={
                    carregandoUsuariosBloqueados ? (
                      <LoadingSpinner
                        compacto
                        label={t(
                          "Carregando usuários bloqueados",
                          "Loading blocked users",
                          "Cargando usuarios bloqueados",
                        )}
                      />
                    ) : (
                      <ValorLinha>{usuariosBloqueados.length}</ValorLinha>
                    )
                  }
                  onClick={alternarUsuariosBloqueados}
                />

                {mostrarUsuariosBloqueados ? (
                  <ConfiguracoesBlockedUsersPanel
                    usuarios={usuariosBloqueados}
                    carregando={carregandoUsuariosBloqueados}
                    erro={erroUsuariosBloqueados}
                    desbloqueandoUsuarioId={desbloqueandoUsuarioId}
                    onRecarregar={carregarUsuariosBloqueados}
                    onDesbloquear={desbloquearUsuarioConfiguracoes}
                    traduzirTexto={t}
                  />
                ) : null}
              </>
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar(
          "privacidade",
          "visibilidade",
          "obras",
          "sobre",
          "diário",
          "comunidade",
          "biblioteca",
          "atividades",
          "público",
          "seguidores",
          "pessoas que sigo",
          "somente eu",
        ) ? (
          <SettingsSection
            title={t(
              "Visibilidade das abas",
              "Tab visibility",
              "Visibilidad de las pestañas",
            )}
          >
            {deveMostrar("obras", "publicadas", "visibilidade") ? (
              <SettingsRow
                icon="book"
                title={t("Obras", "Works", "Obras")}
                right={
                  <select
                    value={privacidade.visibilidadeObras}
                    onChange={(event) =>
                      atualizarPrivacidade(
                        "visibilidadeObras",
                        event.target.value as VisibilidadeAbaPerfil,
                      )
                    }
                    aria-label={t(
                      "Visibilidade da aba Obras",
                      "Works tab visibility",
                      "Visibilidad de la pestaña Obras",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="publico">{t("Público", "Public", "Público")}</option>
                    <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
                    <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
                    <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
                  </select>
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("sobre", "perfil", "visibilidade") ? (
              <SettingsRow
                icon="file"
                title={t("Sobre", "About", "Acerca de")}
                right={
                  <select
                    value={privacidade.visibilidadeSobre}
                    onChange={(event) =>
                      atualizarPrivacidade(
                        "visibilidadeSobre",
                        event.target.value as VisibilidadeAbaPerfil,
                      )
                    }
                    aria-label={t(
                      "Visibilidade da aba Sobre",
                      "About tab visibility",
                      "Visibilidad de la pestaña Acerca de",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="publico">{t("Público", "Public", "Público")}</option>
                    <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
                    <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
                    <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
                  </select>
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("diário", "visibilidade") ? (
              <SettingsRow
                icon="pen"
                title={t("Diário", "Journal", "Diario")}
                right={
                  <select
                    value={privacidade.visibilidadeDiario}
                    onChange={(event) =>
                      atualizarPrivacidade(
                        "visibilidadeDiario",
                        event.target.value as VisibilidadeAbaPerfil,
                      )
                    }
                    aria-label={t(
                      "Visibilidade da aba Diário",
                      "Journal tab visibility",
                      "Visibilidad de la pestaña Diario",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="publico">{t("Público", "Public", "Público")}</option>
                    <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
                    <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
                    <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
                  </select>
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("comunidade", "publicações", "visibilidade") ? (
              <SettingsRow
                icon="comment"
                title={t("Comunidade", "Community", "Comunidad")}
                right={
                  <select
                    value={privacidade.visibilidadeComunidade}
                    onChange={(event) =>
                      atualizarPrivacidade(
                        "visibilidadeComunidade",
                        event.target.value as VisibilidadeAbaPerfil,
                      )
                    }
                    aria-label={t(
                      "Visibilidade da aba Comunidade",
                      "Community tab visibility",
                      "Visibilidad de la pestaña Comunidad",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="publico">{t("Público", "Public", "Público")}</option>
                    <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
                    <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
                    <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
                  </select>
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("biblioteca", "listas", "visibilidade") ? (
              <SettingsRow
                icon="bookmark"
                title={t("Biblioteca", "Library", "Biblioteca")}
                right={
                  <select
                    value={privacidade.visibilidadeBiblioteca}
                    onChange={(event) =>
                      atualizarPrivacidade(
                        "visibilidadeBiblioteca",
                        event.target.value as VisibilidadeAbaPerfil,
                      )
                    }
                    aria-label={t(
                      "Visibilidade da aba Biblioteca",
                      "Library tab visibility",
                      "Visibilidad de la pestaña Biblioteca",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="publico">{t("Público", "Public", "Público")}</option>
                    <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
                    <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
                    <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
                  </select>
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("atividades", "leitura", "visibilidade") ? (
              <SettingsRow
                icon="clock"
                title={t("Atividades", "Activity", "Actividad")}
                right={
                  <select
                    value={privacidade.visibilidadeAtividades}
                    onChange={(event) =>
                      atualizarPrivacidade(
                        "visibilidadeAtividades",
                        event.target.value as VisibilidadeAbaPerfil,
                      )
                    }
                    aria-label={t(
                      "Visibilidade das atividades",
                      "Activity visibility",
                      "Visibilidad de la actividad",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="publico">{t("Público", "Public", "Público")}</option>
                    <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
                    <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
                    <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
                  </select>
                }
                hideChevron
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar(
          "diário",
          "avaliações",
          "avaliar",
          "comentários",
          "seguidores",
          "privacidade",
        ) ? (
          <SettingsSection
            title={t(
              "Privacidade e interações do Diário",
              "Journal privacy and interactions",
              "Privacidad e interacciones del Diario",
            )}
          >
            {deveMostrar(
              "avaliações",
              "mostrar",
              "perfil",
              "diário",
              "visibilidade",
            ) ? (
              <SettingsRow
                icon="star"
                title={t(
                  "Mostrar avaliações do Diário",
                  "Show Journal ratings",
                  "Mostrar valoraciones del Diario",
                )}
                right={
                  <select
                    value={privacidade.visibilidadeAvaliacaoDiario}
                    onChange={(event) => {
                      const visibilidade = event.target
                        .value as VisibilidadeAbaPerfil;

                      aplicarPrivacidadeAtualizada({
                        ...privacidade,
                        visibilidadeAvaliacaoDiario: visibilidade,
                        mostrarAvaliacaoDiario:
                          visibilidade !== "somente_eu",
                      });
                    }}
                    aria-label={t(
                      "Quem pode ver as avaliações do meu Diário",
                      "Who can see my Journal ratings",
                      "Quién puede ver las valoraciones de mi Diario",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="publico">
                      {t("Público", "Public", "Público")}
                    </option>
                    <option value="seguidores">
                      {t("Seguidores", "Followers", "Seguidores")}
                    </option>
                    <option value="seguindo">
                      {t(
                        "Pessoas que sigo",
                        "People I follow",
                        "Personas que sigo",
                      )}
                    </option>
                    <option value="somente_eu">
                      {t("Somente eu", "Only me", "Solo yo")}
                    </option>
                  </select>
                }
                hideChevron
              />
            ) : null}

            {deveMostrar(
              "avaliações",
              "permitir",
              "avaliar",
              "seguidores",
              "pessoas que sigo",
              "diário",
            ) ? (
              <SettingsRow
                icon="user"
                title={t(
                  "Permitir novas avaliações",
                  "Allow new ratings",
                  "Permitir nuevas valoraciones",
                )}
                right={
                  <select
                    value={privacidade.quemPodeAvaliarDiario}
                    onChange={(event) => {
                      const quemPodeAvaliar = event.target
                        .value as QuemPodeAvaliarDiario;

                      aplicarPrivacidadeAtualizada({
                        ...privacidade,
                        permitirAvaliacaoDiario:
                          quemPodeAvaliar !== "ninguem",
                        quemPodeAvaliarDiario: quemPodeAvaliar,
                      });
                    }}
                    aria-label={t(
                      "Quem pode avaliar meu Diário",
                      "Who can rate my Journal",
                      "Quién puede valorar mi Diario",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="todos">
                      {t("Público", "Public", "Público")}
                    </option>
                    <option value="seguidores">
                      {t("Seguidores", "Followers", "Seguidores")}
                    </option>
                    <option value="seguindo">
                      {t(
                        "Pessoas que sigo",
                        "People I follow",
                        "Personas que sigo",
                      )}
                    </option>
                    <option value="ninguem">
                      {t("Ninguém", "No one", "Nadie")}
                    </option>
                  </select>
                }
                hideChevron
              />
            ) : null}

            {deveMostrar(
              "comentários",
              "público",
              "seguidores",
              "pessoas que sigo",
              "ninguém",
              "diário",
            ) ? (
              <SettingsRow
                icon="comment"
                title={t(
                  "Quem pode comentar no meu Diário",
                  "Who can comment on my Journal",
                  "Quién puede comentar en mi Diario",
                )}
                right={
                  <select
                    value={privacidade.quemPodeComentarDiario}
                    onChange={(event) =>
                      atualizarPrivacidade(
                        "quemPodeComentarDiario",
                        event.target.value as QuemPodeComentarDiario,
                      )
                    }
                    aria-label={t(
                      "Quem pode comentar no meu Diário",
                      "Who can comment on my Journal",
                      "Quién puede comentar en mi Diario",
                    )}
                    style={privacySelectStyle}
                  >
                    <option value="todos">
                      {t("Público", "Public", "Público")}
                    </option>
                    <option value="seguidores">
                      {t("Seguidores", "Followers", "Seguidores")}
                    </option>
                    <option value="seguindo">
                      {t(
                        "Pessoas que sigo",
                        "People I follow",
                        "Personas que sigo",
                      )}
                    </option>
                    <option value="ninguem">
                      {t("Ninguém", "No one", "Nadie")}
                    </option>
                  </select>
                }
                hideChevron
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {adminLiberado &&
        deveMostrar("moderação", "admin", "comunidade") ? (
          <SettingsSection
            title={t("Moderação", "Moderation", "Moderación")}
          >
            <SettingsRow
              icon="admin"
              title={t(
                "Área de moderação",
                "Moderation area",
                "Área de moderación",
              )}
              subtitle={t(
                "Revisar denúncias e conteúdos enviados",
                "Review reports and submitted content",
                "Revisar denuncias y contenidos enviados",
              )}
              href="/admin/comunidade"
            />
          </SettingsSection>
        ) : null}

        {deveMostrar(
          "historietas",
          "obras",
          "biblioteca",
          "notificações",
          "comunidade",
          "top 5",
          "diário",
        ) ? (
          <SettingsSection
            title={t(
              "Como você usa o Historietas",
              "How you use Historietas",
              "Cómo usas Historietas",
            )}
          >
            {deveMostrar("obras", "criadas") ? (
              <SettingsRow
                icon="book"
                title={t(
                  "Obras criadas",
                  "Created works",
                  "Obras creadas",
                )}
                subtitle={t(
                  "Total de obras criadas na sua conta",
                  "Total works created on your account",
                  "Total de obras creadas en tu cuenta",
                )}
                right={<ValorLinha>{resumo.obras}</ValorLinha>}
                href="/perfil-autor?aba=obras"
              />
            ) : null}

            {deveMostrar(
              "biblioteca",
              "lista",
              "favoritas",
              "concluidas",
            ) ? (
              <SettingsRow
                icon="bookmark"
                title={t("Biblioteca", "Library", "Biblioteca")}
                subtitle={t(
                  "Favoritas, concluídas e obras seguidas",
                  "Favorites, completed and followed works",
                  "Favoritas, completadas y obras seguidas",
                )}
                right={<ValorLinha>{totalBiblioteca}</ValorLinha>}
                href="/perfil-autor?aba=biblioteca"
              />
            ) : null}

            {deveMostrar("notificações", "avisos") ? (
              <SettingsRow
                icon="bell"
                title={t(
                  "Notificações",
                  "Notifications",
                  "Notificaciones",
                )}
                subtitle={t(
                  "Mensagens, avisos e atividade recente",
                  "Messages, alerts and recent activity",
                  "Mensajes, avisos y actividad reciente",
                )}
                right={<ValorLinha>{notificacoesNaoLidas}</ValorLinha>}
                href="/notificacoes"
              />
            ) : null}

            {deveMostrar("comunidade", "autor") ? (
              <SettingsRow
                icon="comment"
                title={t(
                  "Comunidade do autor",
                  "Author community",
                  "Comunidad del autor",
                )}
                subtitle={t(
                  "Interações e publicações da comunidade",
                  "Community interactions and posts",
                  "Interacciones y publicaciones de la comunidad",
                )}
                href="/perfil-autor?aba=comunidade"
              />
            ) : null}

            {deveMostrar("top 5", "favoritas") ? (
              <SettingsRow
                icon="trophy"
                title="TOP 5"
                subtitle={t(
                  "Escolha suas cinco obras favoritas",
                  "Choose your five favorite works",
                  "Elige tus cinco obras favoritas",
                )}
                href="/perfil-autor/top-5"
              />
            ) : null}

            {deveMostrar("histórico", "leitura", "diário") ? (
              <SettingsRow
                icon="clock"
                title={t(
                  "Histórico de leitura",
                  "Reading history",
                  "Historial de lectura",
                )}
                subtitle={t(
                  "Diário, leituras recentes e avaliações",
                  "Journal, recent reads and ratings",
                  "Diario, lecturas recientes y valoraciones",
                )}
                href="/perfil-autor?aba=diario"
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar(
          "preferências",
          "tema",
          "aparência",
          "avisos",
          "idioma",
          "língua",
        ) ? (
          <SettingsSection
            title={t("Preferências", "Preferences", "Preferencias")}
          >
            {deveMostrar("idioma", "língua") ? (
              <SettingsRow
                icon="layers"
                title={t(
                  "Idioma do site",
                  "Site language",
                  "Idioma del sitio",
                )}
                right={
                  <LanguageSelect
                    showLabel={false}
                    style={{
                      width: "clamp(120px, 34vw, 128px)",
                      maxWidth: "100%",
                      transform: "translateX(22px)",
                    }}
                    selectStyle={{
                      width: "100%",
                      minHeight: 38,
                      padding: "7px 8px",
                      borderRadius: 10,
                      fontSize: 13,
                    }}
                  />
                }
                hideChevron
              />
            ) : null}

            {deveMostrar("receber", "avisos") ? (
              <SettingsRow
                icon="bell"
                title={t(
                  "Receber avisos",
                  "Receive alerts",
                  "Recibir avisos",
                )}
                right={
                  <Toggle
                    checked={preferencias.receberAvisos}
                    onChange={alternarReceberAvisos}
                    ariaLabel={t(
                      "Ativar ou desativar avisos",
                      "Enable or disable alerts",
                      "Activar o desactivar avisos",
                    )}
                  />
                }
                hideChevron
              />
            ) : null}

          </SettingsSection>
        ) : null}

        {deveMostrar(
          "dados",
          "backup",
          "copiar",
          "baixar",
          "download",
        ) ? (
          <SettingsSection
            title={t(
              "Dados e arquivos",
              "Data and files",
              "Datos y archivos",
            )}
          >
            {deveMostrar("copiar", "dados") ? (
              <SettingsRow
                icon="copy"
                title={t("Copiar dados", "Copy data", "Copiar datos")}
                subtitle={t(
                  "Copia um backup em texto para a área de transferência",
                  "Copies a text backup to the clipboard",
                  "Copia una copia de seguridad en texto al portapapeles",
                )}
                onClick={copiarBackup}
              />
            ) : null}

            {deveMostrar("baixar", "backup", "download") ? (
              <SettingsRow
                icon="download"
                title={t(
                  "Baixar backup",
                  "Download backup",
                  "Descargar copia",
                )}
                subtitle={t(
                  "Salva um arquivo JSON com seus dados locais",
                  "Saves a JSON file with your local data",
                  "Guarda un archivo JSON con tus datos locales",
                )}
                onClick={baixarBackup}
              />
            ) : null}

            {deveMostrar("resumo", "dados") ? (
              <SettingsRow
                icon="database"
                title={t(
                  "Resumo da conta",
                  "Account summary",
                  "Resumen de la cuenta",
                )}
                subtitle={t(
                  `${resumo.obras} obras, ${resumo.favoritas} na lista, ${
                    resumo.seguindoObras + resumo.seguindoAutores
                  } seguindo`,
                  `${resumo.obras} works, ${resumo.favoritas} in the list, ${
                    resumo.seguindoObras + resumo.seguindoAutores
                  } following`,
                  `${resumo.obras} obras, ${resumo.favoritas} en la lista, ${
                    resumo.seguindoObras + resumo.seguindoAutores
                  } siguiendo`,
                )}
                hideChevron
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar(
          "suporte",
          "ajuda",
          "termos",
          "políticas",
          "sobre",
        ) ? (
          <SettingsSection
            title={t(
              "Suporte e sobre",
              "Support and about",
              "Soporte y acerca de",
            )}
          >
            {deveMostrar("ajuda", "suporte") ? (
              <SettingsRow
                icon="help"
                title={t(
                  "Central de ajuda",
                  "Help center",
                  "Centro de ayuda",
                )}
                subtitle={t(
                  "Dúvidas, problemas e orientação",
                  "Questions, problems and guidance",
                  "Dudas, problemas y orientación",
                )}
                href="/ajuda"
              />
            ) : null}

            {deveMostrar("termos", "políticas", "privacidade") ? (
              <SettingsRow
                icon="file"
                title={t(
                  "Termos e políticas",
                  "Terms and policies",
                  "Términos y políticas",
                )}
                subtitle={t(
                  "Privacidade, uso da plataforma e regras",
                  "Privacy, platform use and rules",
                  "Privacidad, uso de la plataforma y reglas",
                )}
                href="/termos"
              />
            ) : null}

            {deveMostrar("sobre", "versão") ? (
              <SettingsRow
                icon="settings"
                title={t(
                  "Sobre o Historietas",
                  "About Historietas",
                  "Acerca de Historietas",
                )}
                subtitle={t(
                  "Versão local de desenvolvimento",
                  "Local development version",
                  "Versión local de desarrollo",
                )}
                right={<ValorLinha>Beta</ValorLinha>}
                hideChevron
              />
            ) : null}
          </SettingsSection>
        ) : null}

        {deveMostrar("excluir", "apagar", "conta", "dados", "permanente") ? (
          <section style={sectionStyle}>
            <SectionTitle>
              {t("Zona de risco", "Danger zone", "Zona de riesgo")}
            </SectionTitle>
            <div style={listCardTransparentStyle}>
              <SettingsRow
                icon="trash"
                title={t(
                  "Excluir minha conta",
                  "Delete my account",
                  "Eliminar mi cuenta",
                )}
                subtitle={t(
                  "Apagar permanentemente a conta e os dados associados",
                  "Permanently delete the account and associated data",
                  "Eliminar permanentemente la cuenta y los datos asociados",
                )}
                onClick={abrirExclusaoConta}
                danger
              />
            </div>
          </section>
        ) : null}

        {deveMostrar("sair", "conta", "login") ? (
          <section style={sectionStyle}>
            <div style={listCardTransparentStyle}>
              <SettingsRow
                icon="logout"
                title={t(
                  "Sair da conta",
                  "Sign out",
                  "Cerrar sesión",
                )}
                subtitle={t(
                  "Encerrar sessão neste dispositivo",
                  "End the session on this device",
                  "Cerrar la sesión en este dispositivo",
                )}
                onClick={sairDaConta}
                danger
              />
            </div>
          </section>
        ) : null}
      </section>

      {mostrarSeguranca ? (
        <div
          role="presentation"
          style={securityOverlayStyle}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharSeguranca();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-seguranca-configuracoes"
            style={securityModalStyle}
          >
            <header style={securityModalHeaderStyle}>
              <span style={securityModalIconStyle}>
                <SvgIcon name="lock" size={24} strokeWidth={2.2} />
              </span>

              <div style={securityModalHeadingStyle}>
                <h2
                  id="titulo-seguranca-configuracoes"
                  style={securityModalTitleStyle}
                >
                  {t(
                    "Alterar senha",
                    "Change password",
                    "Cambiar contraseña",
                  )}
                </h2>
                <p style={securityModalSubtitleStyle}>
                  {t(
                    "Confirme sua senha atual e escolha uma nova senha.",
                    "Confirm your current password and choose a new one.",
                    "Confirma tu contraseña actual y elige una nueva.",
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={fecharSeguranca}
                disabled={salvandoSenha}
                aria-label={t("Fechar", "Close", "Cerrar")}
                style={
                  salvandoSenha
                    ? securityCloseButtonDisabledStyle
                    : securityCloseButtonStyle
                }
              >
                ×
              </button>
            </header>

            {senhaAlterada ? (
              <div role="status" aria-live="polite" style={securitySuccessStyle}>
                <SvgIcon name="check" size={25} strokeWidth={2.4} />
                <div style={securityFeedbackTextStyle}>
                  <strong>
                    {t(
                      "Senha alterada com sucesso",
                      "Password changed successfully",
                      "Contraseña cambiada correctamente",
                    )}
                  </strong>
                  <span>
                    {t(
                      "A nova senha já está ativa na sua conta.",
                      "The new password is now active on your account.",
                      "La nueva contraseña ya está activa en tu cuenta.",
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={alterarSenha} style={securityFormStyle}>
                <label style={securityFieldStyle}>
                  <span style={securityFieldLabelStyle}>
                    {t(
                      "Senha atual",
                      "Current password",
                      "Contraseña actual",
                    )}
                  </span>
                  <input
                    className="configuracoes-input"
                    type="password"
                    value={senhaAtual}
                    onChange={(event) => {
                      setSenhaAtual(event.target.value);
                      setErroSenha("");
                    }}
                    autoComplete="current-password"
                    disabled={salvandoSenha}
                    style={securityPasswordInputStyle}
                  />
                </label>

                <label style={securityFieldStyle}>
                  <span style={securityFieldLabelStyle}>
                    {t("Nova senha", "New password", "Nueva contraseña")}
                  </span>
                  <input
                    className="configuracoes-input"
                    type="password"
                    value={novaSenha}
                    onChange={(event) => {
                      setNovaSenha(event.target.value);
                      setErroSenha("");
                    }}
                    autoComplete="new-password"
                    minLength={8}
                    disabled={salvandoSenha}
                    style={securityPasswordInputStyle}
                  />
                </label>

                <label style={securityFieldStyle}>
                  <span style={securityFieldLabelStyle}>
                    {t(
                      "Confirmar nova senha",
                      "Confirm new password",
                      "Confirmar nueva contraseña",
                    )}
                  </span>
                  <input
                    className="configuracoes-input"
                    type="password"
                    value={confirmarNovaSenha}
                    onChange={(event) => {
                      setConfirmarNovaSenha(event.target.value);
                      setErroSenha("");
                    }}
                    autoComplete="new-password"
                    minLength={8}
                    disabled={salvandoSenha}
                    style={securityPasswordInputStyle}
                  />
                </label>

                <p style={securityHintStyle}>
                  {t(
                    "Use no mínimo 8 caracteres, incluindo uma letra e um número.",
                    "Use at least 8 characters, including a letter and a number.",
                    "Usa al menos 8 caracteres, incluyendo una letra y un número.",
                  )}
                </p>

                {erroSenha ? (
                  <div role="alert" aria-live="assertive" style={securityErrorStyle}>
                    {erroSenha}
                  </div>
                ) : null}

                <div style={securityActionsStyle}>
                  <button
                    type="button"
                    onClick={fecharSeguranca}
                    disabled={salvandoSenha}
                    style={
                      salvandoSenha
                        ? securitySecondaryButtonDisabledStyle
                        : securitySecondaryButtonStyle
                    }
                  >
                    {t("Cancelar", "Cancel", "Cancelar")}
                  </button>

                  <button
                    type="submit"
                    disabled={salvandoSenha}
                    style={
                      salvandoSenha
                        ? securityPrimaryButtonDisabledStyle
                        : securityPrimaryButtonStyle
                    }
                  >
                    {salvandoSenha ? (
                      <>
                        <LoadingSpinner
                          compacto
                          label={t(
                            "Alterando senha",
                            "Changing password",
                            "Cambiando contraseña",
                          )}
                        />
                        <span>
                          {t(
                            "Alterando...",
                            "Changing...",
                            "Cambiando...",
                          )}
                        </span>
                      </>
                    ) : (
                      t(
                        "Alterar senha",
                        "Change password",
                        "Cambiar contraseña",
                      )
                    )}
                  </button>
                </div>
              </form>
            )}

            {senhaAlterada ? (
              <button
                type="button"
                onClick={fecharSeguranca}
                style={securityDoneButtonStyle}
              >
                {t("Concluído", "Done", "Listo")}
              </button>
            ) : null}
          </section>
        </div>
      ) : null}

      {mostrarExclusaoConta ? (
        <div
          role="presentation"
          style={securityOverlayStyle}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharExclusaoConta();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-exclusao-conta"
            style={securityModalStyle}
          >
            <header style={securityModalHeaderStyle}>
              <span style={deleteModalIconStyle}>
                <SvgIcon name="trash" size={24} strokeWidth={2.2} />
              </span>

              <div style={securityModalHeadingStyle}>
                <h2 id="titulo-exclusao-conta" style={securityModalTitleStyle}>
                  {t(
                    "Excluir minha conta",
                    "Delete my account",
                    "Eliminar mi cuenta",
                  )}
                </h2>
                <p style={securityModalSubtitleStyle}>
                  {t(
                    "Esta ação é permanente e não pode ser desfeita.",
                    "This action is permanent and cannot be undone.",
                    "Esta acción es permanente y no se puede deshacer.",
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={fecharExclusaoConta}
                disabled={excluindoConta}
                aria-label={t("Fechar", "Close", "Cerrar")}
                style={
                  excluindoConta
                    ? securityCloseButtonDisabledStyle
                    : securityCloseButtonStyle
                }
              >
                ×
              </button>
            </header>

            <div style={deleteWarningStyle}>
              <strong>
                {t(
                  "Serão excluídos:",
                  "The following will be deleted:",
                  "Se eliminarán:",
                )}
              </strong>
              <ul style={deleteWarningListStyle}>
                <li>{t("conta, perfil e acesso;", "account, profile, and access;", "cuenta, perfil y acceso;")}</li>
                <li>{t("obras, capítulos, capas e arquivos;", "works, chapters, covers, and files;", "obras, capítulos, portadas y archivos;")}</li>
                <li>{t("comentários, curtidas, avaliações, seguidores e progresso.", "comments, likes, ratings, followers, and progress.", "comentarios, me gusta, valoraciones, seguidores y progreso.")}</li>
              </ul>
              <Link href="/excluir-conta" style={deletePublicLinkStyle}>
                {t(
                  "Ver página pública de exclusão",
                  "View public deletion page",
                  "Ver página pública de eliminación",
                )}
              </Link>
            </div>

            <form onSubmit={excluirConta} style={securityFormStyle}>
              <label style={securityFieldStyle}>
                <span style={securityFieldLabelStyle}>
                  {t("Senha atual", "Current password", "Contraseña actual")}
                </span>
                <input
                  className="configuracoes-input"
                  type="password"
                  value={senhaExclusaoConta}
                  onChange={(event) => {
                    setSenhaExclusaoConta(event.target.value);
                    setErroExclusaoConta("");
                  }}
                  autoComplete="current-password"
                  disabled={excluindoConta}
                  style={securityPasswordInputStyle}
                />
              </label>

              <label style={securityFieldStyle}>
                <span style={securityFieldLabelStyle}>
                  {t(
                    "Digite EXCLUIR para confirmar",
                    "Type DELETE to confirm",
                    "Escribe ELIMINAR para confirmar",
                  )}
                </span>
                <input
                  className="configuracoes-input"
                  type="text"
                  value={confirmacaoExclusaoConta}
                  onChange={(event) => {
                    setConfirmacaoExclusaoConta(event.target.value);
                    setErroExclusaoConta("");
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  disabled={excluindoConta}
                  style={securityPasswordInputStyle}
                />
              </label>

              <p style={securityHintStyle}>
                {t(
                  "Antes de continuar, você pode baixar um backup no Resumo da conta.",
                  "Before continuing, you can download a backup from Account summary.",
                  "Antes de continuar, puedes descargar una copia en Resumen de la cuenta.",
                )}
              </p>

              {erroExclusaoConta ? (
                <div role="alert" aria-live="assertive" style={securityErrorStyle}>
                  {erroExclusaoConta}
                </div>
              ) : null}

              <div style={securityActionsStyle}>
                <button
                  type="button"
                  onClick={fecharExclusaoConta}
                  disabled={excluindoConta}
                  style={
                    excluindoConta
                      ? securitySecondaryButtonDisabledStyle
                      : securitySecondaryButtonStyle
                  }
                >
                  {t("Cancelar", "Cancel", "Cancelar")}
                </button>

                <button
                  type="submit"
                  disabled={excluindoConta}
                  style={
                    excluindoConta
                      ? deleteDangerButtonDisabledStyle
                      : deleteDangerButtonStyle
                  }
                >
                  {excluindoConta ? (
                    <>
                      <LoadingSpinner
                        compacto
                        label={t(
                          "Excluindo conta",
                          "Deleting account",
                          "Eliminando cuenta",
                        )}
                      />
                      <span>{t("Excluindo...", "Deleting...", "Eliminando...")}</span>
                    </>
                  ) : (
                    t(
                      "Excluir definitivamente",
                      "Delete permanently",
                      "Eliminar definitivamente",
                    )
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
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
