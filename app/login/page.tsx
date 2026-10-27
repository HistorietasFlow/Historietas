"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import LanguageSelect from "../../components/LanguageSelect";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import {
  criarMetadataAceiteTermos,
  registrarAceiteTermosPublicacao,
} from "../../lib/aceiteTermos";
import { obterRedirectToAtual } from "./lib/login-redirect-utils";
import { sincronizarStorageUsuarioLogin } from "./lib/login-storage-sync";
import { useLoginDesktopMode } from "./hooks/useLoginDesktopMode";
import { useLoginPasswordChangedNotice } from "./hooks/useLoginPasswordChangedNotice";
import {
  type LoginTranslationKey,
  traduzirLogin,
} from "./lib/login-translations";
import { formatarErroAuth } from "./lib/login-auth-error-formatter";
import { prepararFormularioLogin } from "./lib/login-form-preparation";
import { validarFormularioLogin } from "./lib/login-form-validation";
import { loginPageCss } from "./lib/login-page-css";
import {
  containerStyle,
  consentGroupStyle,
  consentLabelStyle,
  checkboxStyle,
  descriptionStyle,
  desktopTopWaterFadeStyle,
  errorStyle,
  fieldStyle,
  formPanelStyle,
  formStyle,
  helperTextStyle,
  heroContentStyle,
  heroGlowStyle,
  heroStyle,
  inputStyle,
  introStyle,
  labelStyle,
  languageSelectShellStyle,
  languageSelectStyle,
  languageSelectWrapperStyle,
  legalLinkStyle,
  logoMarkStyle,
  logoStyle,
  logoTextStyle,
  mobileTopWaterFadeStyle,
  pageStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  successStyle,
  tabActiveStyle,
  tabStyle,
  tabsStyle,
  textButtonStyle,
  titleStyle,
  topStyle,
} from "./lib/login-styles";
import { prepararDadosProfileLogin } from "./lib/login-profile-preparation";
import {
  criarPayloadProfileLogin,
  type PerfilExistenteLogin,
} from "./lib/login-profile-payload";
import {
  PROFILE_SYNC_FAILURE_STORAGE_KEY,
  registrarFalhaSincronizacaoPerfil,
} from "./lib/login-profile-sync-diagnostics";

type ModoAuth = "entrar" | "criar" | "recuperar";

type ResultadoSincronizacaoPerfil =
  | { ok: true }
  | { ok: false; error: unknown };

function aguardarLogin(milisegundos: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milisegundos);
  });
}

export default function LoginPage() {
  const router = useRouter();
  const { language } = useHistorietasLanguage();
  const t = useCallback(
    (key: LoginTranslationKey) => traduzirLogin(language, key),
    [language],
  );

  const [modo, setModo] = useState<ModoAuth>("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [cientePrivacidade, setCientePrivacidade] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const criandoConta = modo === "criar";
  const recuperandoSenha = modo === "recuperar";
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  const salvarProfile = useCallback(async (
    userId: string,
    nomeInformado: string,
    emailInformado: string,
    userMetadata?: Record<string, unknown> | null,
  ): Promise<ResultadoSincronizacaoPerfil> => {
    const {
      userIdLimpo,
      nomeFinal,
    } = prepararDadosProfileLogin(
      userId,
      nomeInformado,
      emailInformado,
      userMetadata,
    );

    if (!userIdLimpo) {
      const error = new Error(
        "Não foi possível sincronizar o perfil sem o identificador do usuário.",
      );

      registrarFalhaSincronizacaoPerfil(error, userIdLimpo);
      return { ok: false, error };
    }

    async function sincronizarUmaVez() {
      let perfilAtual: PerfilExistenteLogin | null = null;

      const { data: perfilPorUserId, error: erroPorUserId } = await supabase
        .from("profiles_publicos")
        .select("id,user_id,nome,bio,sobre_bio,avatar_url")
        .eq("user_id", userIdLimpo)
        .limit(1)
        .maybeSingle();

      if (!erroPorUserId && perfilPorUserId) {
        perfilAtual = perfilPorUserId as PerfilExistenteLogin;
      }

      let erroPorId: unknown = null;

      if (!perfilAtual) {
        const respostaPorId = await supabase
          .from("profiles_publicos")
          .select("id,user_id,nome,bio,sobre_bio,avatar_url")
          .eq("id", userIdLimpo)
          .limit(1)
          .maybeSingle();

        erroPorId = respostaPorId.error;

        if (!respostaPorId.error && respostaPorId.data) {
          perfilAtual = respostaPorId.data as PerfilExistenteLogin;
        }
      }

      if (!perfilAtual && (erroPorUserId || erroPorId)) {
        throw erroPorUserId || erroPorId;
      }

      const agora = new Date().toISOString();

      const perfilPayload = criarPayloadProfileLogin(
        perfilAtual,
        userIdLimpo,
        nomeFinal,
        agora,
      );

      if (perfilAtual?.id) {
        const { data: perfilAtualizado, error: erroAtualizacao } =
          await supabase
            .from("profiles")
            .update(perfilPayload)
            .eq("id", perfilAtual.id)
            .select("id")
            .maybeSingle();

        if (erroAtualizacao) {
          throw erroAtualizacao;
        }

        if (!perfilAtualizado) {
          throw new Error(
            "O perfil existente não pôde ser atualizado ou não ficou visível após a atualização.",
          );
        }

        return;
      }

      const { data: perfilCriado, error: erroCriacao } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userIdLimpo,
            tipo: "leitor",
            ...perfilPayload,
          },
          {
            onConflict: "id",
            ignoreDuplicates: false,
          },
        )
        .select("id")
        .maybeSingle();

      if (erroCriacao) {
        throw erroCriacao;
      }

      if (!perfilCriado) {
        throw new Error(
          "O perfil não pôde ser criado ou não ficou visível após a criação.",
        );
      }
    }

    let ultimoErro: unknown = new Error(
      "A sincronização do perfil não foi concluída.",
    );

    for (let tentativa = 1; tentativa <= 2; tentativa += 1) {
      try {
        await sincronizarUmaVez();

        if (typeof window !== "undefined") {
          try {
            sessionStorage.removeItem(PROFILE_SYNC_FAILURE_STORAGE_KEY);
          } catch {
            // A limpeza do diagnóstico local não pode bloquear o login.
          }
        }

        return { ok: true };
      } catch (error) {
        ultimoErro = error;

        if (tentativa < 2) {
          await aguardarLogin(350);
        }
      }
    }

    registrarFalhaSincronizacaoPerfil(ultimoErro, userIdLimpo);

    return {
      ok: false,
      error: ultimoErro,
    };
  }, []);

  useEffect(() => {
    let componenteAtivo = true;

    async function redirecionarUsuarioJaLogado() {
      try {
        const { data } = await supabase.auth.getUser();

        if (componenteAtivo && data.user) {
          const resultadoPerfil = await salvarProfile(
            data.user.id,
            "",
            data.user.email || "",
            data.user.user_metadata,
          );

          if (!resultadoPerfil.ok && componenteAtivo) {
            setErro(t("profileSyncWarning"));
            await aguardarLogin(1600);
          }

          sincronizarStorageUsuarioLogin(data.user.id);

          router.replace(obterRedirectToAtual("/perfil-autor"));
          router.refresh();
        }
      } catch {
        // A página de login deve continuar acessível se a verificação falhar.
      }
    }

    void redirecionarUsuarioJaLogado();

    return () => {
      componenteAtivo = false;
    };
  }, [router, salvarProfile, t]);

  useLoginPasswordChangedNotice({
    t,
    setModo,
    setErro,
    setAviso,
  });
  const isDesktop = useLoginDesktopMode();

  async function enviarFormulario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (carregando) {
      return;
    }

    setErro("");
    setAviso("");

    const { emailFinal, nomeFinal } = prepararFormularioLogin(email, nome);
    const chaveErro = validarFormularioLogin({
      emailFinal,
      nomeFinal,
      senha,
      criandoConta,
      recuperandoSenha,
      aceitouTermos,
      cientePrivacidade,
    });

    if (chaveErro) {
      setErro(t(chaveErro));
      return;
    }

    setCarregando(true);

    try {
      if (recuperandoSenha) {
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          "/redefinir-senha",
        )}`;

        const { error } = await supabase.auth.resetPasswordForEmail(
          emailFinal,
          { redirectTo },
        );

        if (error) {
          setErro(t("genericFailure"));
          return;
        }

        setAviso(t("recoveryEmailSent"));
        return;
      }

      if (criandoConta) {
        const aceiteEm = new Date().toISOString();
        const metadataAceite = criarMetadataAceiteTermos(aceiteEm);
        const { data, error } = await supabase.auth.signUp({
          email: emailFinal,
          password: senha,
          options: {
            data: {
              nome: nomeFinal,
              name: nomeFinal,
              full_name: nomeFinal,
              tipo: "leitor",
              ...metadataAceite,
            },
          },
        });

        if (error) {
          setErro(formatarErroAuth(error, language));
          return;
        }

        if (!data.user) {
          setErro(t("accountCreationNotConfirmed"));
          return;
        }

        if (data.session) {
          const resultadoPerfil = await salvarProfile(
            data.user.id,
            nomeFinal,
            data.user.email || emailFinal,
            data.user.user_metadata,
          );

          if (!resultadoPerfil.ok) {
            setErro(t("profileSyncWarning"));
            await aguardarLogin(1600);
          } else {
            const resultadoAceite =
              await registrarAceiteTermosPublicacao();

            if (!resultadoAceite.aceito) {
              setErro(
                resultadoAceite.erro ||
                  "Nao foi possivel registrar o aceite dos termos.",
              );
              return;
            }
          }

          sincronizarStorageUsuarioLogin(data.user.id);
          router.replace(obterRedirectToAtual("/perfil-autor"));
          router.refresh();
          return;
        }

        setModo("entrar");
        setSenha("");
        setAceitouTermos(false);
        setCientePrivacidade(false);
        setAviso(t("accountCreatedNotice"));
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailFinal,
        password: senha,
      });

      if (error) {
        setErro(formatarErroAuth(error, language));
        return;
      }

      if (!data.user) {
        setErro(t("sessionNotConfirmed"));
        return;
      }

      const resultadoPerfil = await salvarProfile(
        data.user.id,
        "",
        data.user.email || emailFinal,
        data.user.user_metadata,
      );

      if (!resultadoPerfil.ok) {
        setErro(t("profileSyncWarning"));
        await aguardarLogin(1600);
      }

      sincronizarStorageUsuarioLogin(data.user.id);
      router.replace(obterRedirectToAtual("/perfil-autor"));
      router.refresh();
    } catch (error) {
      setErro(formatarErroAuth(error, language));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${loginPageCss}`}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={containerStyle}>
        <header style={topStyle}>
          <Link href="/" style={logoStyle} aria-label={t("backHome")}>
            <span style={logoMarkStyle}>H</span>
            <span className="historietas-theme-logo-text" style={logoTextStyle}>
              istorietas
            </span>
          </Link>

          <div style={languageSelectShellStyle}>
            <LanguageSelect
              showLabel={false}
              style={languageSelectWrapperStyle}
              selectStyle={languageSelectStyle}
            />
          </div>
        </header>

        <section style={heroStyle}>
          <div style={heroGlowStyle} />

          <div style={heroContentStyle}>
            <div style={introStyle}>
              <h1 className="historietas-theme-title" style={titleStyle}>
                {recuperandoSenha
                  ? t("recoveryTitle")
                  : criandoConta
                    ? t("createAccountTitle")
                    : t("signInTitle")}
              </h1>

              <p style={descriptionStyle}>
                {recuperandoSenha
                  ? t("recoveryDescription")
                  : t("description")}
              </p>
            </div>

            <div style={formPanelStyle}>
              {!recuperandoSenha && (
                <div style={tabsStyle}>
                  <button
                    type="button"
                    onClick={() => {
                      setModo("entrar");
                      setErro("");
                      setAviso("");
                    }}
                    style={modo === "entrar" ? tabActiveStyle : tabStyle}
                    aria-pressed={modo === "entrar"}
                  >
                    {t("signInTab")}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModo("criar");
                      setErro("");
                      setAviso("");
                    }}
                    style={modo === "criar" ? tabActiveStyle : tabStyle}
                    aria-pressed={modo === "criar"}
                  >
                    {t("createAccountTab")}
                  </button>
                </div>
              )}

              <form onSubmit={enviarFormulario} style={formStyle}>
                {criandoConta && (
                  <label style={fieldStyle}>
                    <span style={labelStyle}>{t("displayName")}</span>

                    <input
                      value={nome}
                      onChange={(event) => {
                        setNome(event.target.value.slice(0, 80));
                        setErro("");
                        setAviso("");
                      }}
                      placeholder={t("displayNamePlaceholder")}
                      style={inputStyle}
                      type="text"
                      autoComplete="name"
                      maxLength={80}
                      required
                    />
                  </label>
                )}

                <label style={fieldStyle}>
                  <span style={labelStyle}>{t("email")}</span>

                  <input
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value.slice(0, 254));
                      setErro("");
                      setAviso("");
                    }}
                    placeholder="seuemail@email.com"
                    style={inputStyle}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    maxLength={254}
                    required
                  />
                </label>

                {!recuperandoSenha && (
                  <label style={fieldStyle}>
                    <span style={labelStyle}>{t("password")}</span>

                    <input
                      value={senha}
                      onChange={(event) => {
                        setSenha(event.target.value);
                        setErro("");
                        setAviso("");
                      }}
                      placeholder={
                        criandoConta
                          ? t("signupPasswordPlaceholder")
                          : t("passwordPlaceholder")
                      }
                      style={inputStyle}
                      type="password"
                      autoComplete={
                        criandoConta ? "new-password" : "current-password"
                      }
                      minLength={criandoConta ? 8 : 6}
                      required
                    />
                  </label>
                )}

                {criandoConta && (
                  <div style={consentGroupStyle}>
                    <label style={consentLabelStyle}>
                      <input
                        type="checkbox"
                        checked={aceitouTermos}
                        onChange={(event) => {
                          setAceitouTermos(event.target.checked);
                          setErro("");
                          setAviso("");
                        }}
                        style={checkboxStyle}
                        required
                      />
                      <span>
                        {t("acceptTermsPrefix")} {" "}
                        <Link href="/termos-de-uso" target="_blank" style={legalLinkStyle}>
                          {t("termsLink")}
                        </Link>{" "}
                        {t("and")} {" "}
                        <Link
                          href="/diretrizes-da-comunidade"
                          target="_blank"
                          style={legalLinkStyle}
                        >
                          {t("guidelinesLink")}
                        </Link>.
                      </span>
                    </label>

                    <label style={consentLabelStyle}>
                      <input
                        type="checkbox"
                        checked={cientePrivacidade}
                        onChange={(event) => {
                          setCientePrivacidade(event.target.checked);
                          setErro("");
                          setAviso("");
                        }}
                        style={checkboxStyle}
                        required
                      />
                      <span>
                        {t("privacyPrefix")} {" "}
                        <Link
                          href="/politica-de-privacidade"
                          target="_blank"
                          style={legalLinkStyle}
                        >
                          {t("privacyLink")}
                        </Link>.
                      </span>
                    </label>
                  </div>
                )}

                {!criandoConta && !recuperandoSenha && (
                  <button
                    type="button"
                    onClick={() => {
                      setModo("recuperar");
                      setSenha("");
                      setErro("");
                      setAviso("");
                    }}
                    style={textButtonStyle}
                  >
                    {t("forgotPassword")}
                  </button>
                )}

                {aviso && (
                  <span role="status" aria-live="polite" style={successStyle}>
                    {aviso}
                  </span>
                )}

                {erro && (
                  <span role="alert" aria-live="assertive" style={errorStyle}>
                    {erro}
                  </span>
                )}

                <button
                  type="submit"
                  disabled={carregando}
                  style={{
                    ...primaryButtonStyle,
                    opacity: carregando ? 0.72 : 1,
                    cursor: carregando ? "not-allowed" : "pointer",
                  }}
                >
                  {carregando
                    ? t("wait")
                    : recuperandoSenha
                      ? t("sendRecoveryLink")
                      : criandoConta
                        ? t("create")
                        : t("signIn")}
                </button>

                {recuperandoSenha && (
                  <button
                    type="button"
                    onClick={() => {
                      setModo("entrar");
                      setErro("");
                      setAviso("");
                    }}
                    style={secondaryButtonStyle}
                  >
                    {t("backToSignIn")}
                  </button>
                )}
              </form>

              <p style={helperTextStyle}>
                {recuperandoSenha
                  ? t("recoveryHelperText")
                  : t("helperText")}
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
