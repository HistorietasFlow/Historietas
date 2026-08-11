"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import LanguageSelect from "../../components/LanguageSelect";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import type { HistorietasLanguage } from "../../lib/i18n";
import { supabase } from "../../lib/supabase/client";

type EstadoLink = "verificando" | "valido" | "invalido";

type TranslationKey =
  | "backHome"
  | "title"
  | "description"
  | "checking"
  | "invalidTitle"
  | "invalidDescription"
  | "requestNewLink"
  | "newPassword"
  | "confirmPassword"
  | "passwordPlaceholder"
  | "confirmPlaceholder"
  | "saving"
  | "savePassword"
  | "passwordMin"
  | "passwordComposition"
  | "passwordMismatch"
  | "sessionInvalid"
  | "genericError";

const TRANSLATIONS: Record<
  HistorietasLanguage,
  Record<TranslationKey, string>
> = {
  "pt-BR": {
    backHome: "Voltar para a página inicial",
    title: "CRIAR NOVA SENHA",
    description:
      "Escolha uma senha forte. Ela precisa ter pelo menos 8 caracteres, incluindo uma letra e um número.",
    checking: "Validando seu link de recuperação...",
    invalidTitle: "LINK INVÁLIDO OU EXPIRADO",
    invalidDescription:
      "Este link não pode mais ser usado. Solicite um novo link de recuperação na página de login.",
    requestNewLink: "SOLICITAR NOVO LINK",
    newPassword: "Nova senha",
    confirmPassword: "Confirmar nova senha",
    passwordPlaceholder: "Mínimo de 8 caracteres",
    confirmPlaceholder: "Digite novamente a nova senha",
    saving: "Salvando...",
    savePassword: "SALVAR NOVA SENHA",
    passwordMin: "A nova senha precisa ter pelo menos 8 caracteres.",
    passwordComposition: "Use pelo menos uma letra e um número.",
    passwordMismatch: "A confirmação não corresponde à nova senha.",
    sessionInvalid:
      "Não foi possível validar a recuperação. O link pode ter expirado ou já ter sido usado.",
    genericError: "Não foi possível redefinir a senha agora.",
  },

  en: {
    backHome: "Back to the home page",
    title: "CREATE A NEW PASSWORD",
    description:
      "Choose a strong password. It must be at least 8 characters long and include a letter and a number.",
    checking: "Validating your recovery link...",
    invalidTitle: "INVALID OR EXPIRED LINK",
    invalidDescription:
      "This link can no longer be used. Request a new recovery link from the sign-in page.",
    requestNewLink: "REQUEST A NEW LINK",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    passwordPlaceholder: "At least 8 characters",
    confirmPlaceholder: "Enter the new password again",
    saving: "Saving...",
    savePassword: "SAVE NEW PASSWORD",
    passwordMin: "The new password must be at least 8 characters long.",
    passwordComposition: "Use at least one letter and one number.",
    passwordMismatch: "The confirmation does not match the new password.",
    sessionInvalid:
      "The recovery session could not be validated. The link may have expired or already been used.",
    genericError: "The password could not be reset right now.",
  },

  es: {
    backHome: "Volver a la página de inicio",
    title: "CREAR NUEVA CONTRASEÑA",
    description:
      "Elige una contraseña segura. Debe tener al menos 8 caracteres e incluir una letra y un número.",
    checking: "Validando el enlace de recuperación...",
    invalidTitle: "ENLACE INVÁLIDO O VENCIDO",
    invalidDescription:
      "Este enlace ya no puede usarse. Solicita un nuevo enlace de recuperación en la página de inicio de sesión.",
    requestNewLink: "SOLICITAR NUEVO ENLACE",
    newPassword: "Nueva contraseña",
    confirmPassword: "Confirmar nueva contraseña",
    passwordPlaceholder: "Mínimo 8 caracteres",
    confirmPlaceholder: "Escribe nuevamente la nueva contraseña",
    saving: "Guardando...",
    savePassword: "GUARDAR NUEVA CONTRASEÑA",
    passwordMin: "La nueva contraseña debe tener al menos 8 caracteres.",
    passwordComposition: "Usa al menos una letra y un número.",
    passwordMismatch: "La confirmación no coincide con la nueva contraseña.",
    sessionInvalid:
      "No se pudo validar la recuperación. El enlace puede haber vencido o ya haber sido usado.",
    genericError: "No se pudo restablecer la contraseña ahora.",
  },
};

function obterMensagemErro(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const mensagem =
    "message" in error && typeof error.message === "string"
      ? error.message.trim()
      : "";

  return mensagem || fallback;
}

async function sessaoEhRecuperacao() {
  try {
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims || typeof data.claims !== "object") {
      return false;
    }

    const amr = (data.claims as { amr?: unknown }).amr;

    if (!Array.isArray(amr)) {
      return false;
    }

    return amr.some((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const metodo = (item as { method?: unknown }).method;

      return (
        typeof metodo === "string" &&
        metodo.trim().toLowerCase() === "recovery"
      );
    });
  } catch {
    return false;
  }
}

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const { language } = useHistorietasLanguage();

  const t = useCallback(
    (key: TranslationKey) => TRANSLATIONS[language][key],
    [language],
  );

  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  const [estadoLink, setEstadoLink] =
    useState<EstadoLink>("verificando");

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function validarRecuperacao() {
      const params = new URLSearchParams(window.location.search);

      const retornoConfirmado =
        params.get("recuperacao") === "1";

      const erroNoLink =
        params.get("erro") === "link-invalido";

      if (!retornoConfirmado || erroNoLink) {
        if (ativo) {
          setEstadoLink("invalido");
        }

        return;
      }

      try {
        const { data, error } =
          await supabase.auth.getUser();

        const recuperacaoValida =
          !error && data.user
            ? await sessaoEhRecuperacao()
            : false;

        if (!ativo) {
          return;
        }

        setEstadoLink(
          recuperacaoValida ? "valido" : "invalido",
        );
      } catch {
        if (ativo) {
          setEstadoLink("invalido");
        }
      }
    }

    void validarRecuperacao();

    return () => {
      ativo = false;
    };
  }, []);

  async function salvarNovaSenha(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (salvando || estadoLink !== "valido") {
      return;
    }

    setErro("");

    if (novaSenha.length < 8) {
      setErro(t("passwordMin"));
      return;
    }

    if (
      !/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(novaSenha) ||
      !/\d/.test(novaSenha)
    ) {
      setErro(t("passwordComposition"));
      return;
    }

    if (novaSenha !== confirmacao) {
      setErro(t("passwordMismatch"));
      return;
    }

    setSalvando(true);

    try {
      const {
        data: usuarioAtual,
        error: erroUsuario,
      } = await supabase.auth.getUser();

      if (erroUsuario || !usuarioAtual.user) {
        setEstadoLink("invalido");
        setErro(t("sessionInvalid"));
        return;
      }

      const recuperacaoValida =
        await sessaoEhRecuperacao();

      if (!recuperacaoValida) {
        setEstadoLink("invalido");
        setErro(t("sessionInvalid"));
        return;
      }

      const { error } =
        await supabase.auth.updateUser({
          password: novaSenha,
        });

      if (error) {
        setErro(
          obterMensagemErro(error, t("genericError")),
        );

        return;
      }

      const { error: erroLogout } = await supabase.auth.signOut();

      if (erroLogout) {
        setErro(t("genericError"));
        return;
      }

      router.replace("/login?senhaRedefinida=1");
      router.refresh();
    } catch (error) {
      setErro(
        obterMensagemErro(error, t("genericError")),
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main style={pageThemeStyle}>
      <style>
        {`${historietasThemeCss}${pageCss}`}
      </style>

      <section style={containerStyle}>
        <header style={headerStyle}>
          <Link
            href="/"
            style={logoStyle}
            aria-label={t("backHome")}
          >
            <span style={logoMarkStyle}>H</span>

            <span
              className="historietas-theme-logo-text"
              style={logoTextStyle}
            >
              istorietas
            </span>
          </Link>

          <LanguageSelect
            showLabel={false}
            style={languageWrapperStyle}
            selectStyle={languageSelectStyle}
          />
        </header>

        <section style={cardStyle}>
          {estadoLink === "verificando" ? (
            <p
              role="status"
              aria-live="polite"
              style={statusStyle}
            >
              {t("checking")}
            </p>
          ) : estadoLink === "invalido" ? (
            <div style={contentStyle}>
              <h1
                className="historietas-theme-title"
                style={titleStyle}
              >
                {t("invalidTitle")}
              </h1>

              <p style={descriptionStyle}>
                {t("invalidDescription")}
              </p>

              <Link
                href="/login"
                style={primaryLinkStyle}
              >
                {t("requestNewLink")}
              </Link>
            </div>
          ) : (
            <div style={contentStyle}>
              <h1
                className="historietas-theme-title"
                style={titleStyle}
              >
                {t("title")}
              </h1>

              <p style={descriptionStyle}>
                {t("description")}
              </p>

              <form
                onSubmit={salvarNovaSenha}
                style={formStyle}
              >
                <label style={fieldStyle}>
                  <span style={labelStyle}>
                    {t("newPassword")}
                  </span>

                  <input
                    value={novaSenha}
                    onChange={(event) => {
                      setNovaSenha(event.target.value);
                      setErro("");
                    }}
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    placeholder={t(
                      "passwordPlaceholder",
                    )}
                    style={inputStyle}
                  />
                </label>

                <label style={fieldStyle}>
                  <span style={labelStyle}>
                    {t("confirmPassword")}
                  </span>

                  <input
                    value={confirmacao}
                    onChange={(event) => {
                      setConfirmacao(
                        event.target.value,
                      );
                      setErro("");
                    }}
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    placeholder={t(
                      "confirmPlaceholder",
                    )}
                    style={inputStyle}
                  />
                </label>

                {erro && (
                  <span
                    role="alert"
                    aria-live="assertive"
                    style={errorStyle}
                  >
                    {erro}
                  </span>
                )}

                <button
                  type="submit"
                  disabled={salvando}
                  style={{
                    ...primaryButtonStyle,
                    opacity: salvando ? 0.7 : 1,
                    cursor: salvando
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {salvando
                    ? t("saving")
                    : t("savePassword")}
                </button>
              </form>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

const pageCss = `
  html,
  body {
    overflow-x: hidden !important;
    background: var(
      --historietas-page-background,
      #070212
    ) !important;
  }

  html[data-historietas-tema-visual="foco"]
    .historietas-theme-logo-text,
  html[data-historietas-tema-visual="foco"]
    .historietas-theme-title {
    background: none !important;
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
  }
`;

const pageStyle: CSSProperties = {
  minHeight: "100dvh",
  background:
    "var(--historietas-page-background, #070212)",
  color: "#FFFFFF",
  fontFamily:
    "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
  padding: "0 14px 40px",
};

const containerStyle: CSSProperties = {
  width: "min(720px, 100%)",
  margin: "0 auto",
};

const headerStyle: CSSProperties = {
  minHeight: "74px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
};

const logoStyle: CSSProperties = {
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "25px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

const logoMarkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#04000A",
  border: "1px solid rgba(124,58,237,0.45)",
  fontSize: "19px",
  fontWeight: 950,
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #DDD6FE 44%, #A78BFA 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

const languageWrapperStyle: CSSProperties = {
  width: "108px",
};

const languageSelectStyle: CSSProperties = {
  minHeight: "36px",
  height: "36px",
  padding: "0 8px",
  borderRadius: "12px",
  border: "1px solid rgba(124,58,237,0.45)",
  background: "#04000A",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 850,
  colorScheme: "dark",
};

const cardStyle: CSSProperties = {
  marginTop: "clamp(28px, 8vh, 86px)",
  width: "min(460px, 100%)",
  marginLeft: "auto",
  marginRight: "auto",
  padding: "clamp(22px, 5vw, 34px)",
  borderRadius: "24px",
  border:
    "1px solid var(--historietas-border-soft, rgba(124,58,237,0.28))",
  background:
    "var(--historietas-surface, #08030F)",
  boxSizing: "border-box",
};

const contentStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  textAlign: "center",
  fontSize: "clamp(25px, 7vw, 38px)",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.04em",
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color:
    "var(--historietas-text-secondary, #D4D4D8)",
  textAlign: "center",
  fontSize: "13px",
  lineHeight: 1.55,
  fontWeight: 650,
};

const statusStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  textAlign: "center",
  fontSize: "14px",
  fontWeight: 850,
};

const formStyle: CSSProperties = {
  display: "grid",
  gap: "13px",
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
};

const labelStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 900,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "46px",
  padding: "0 14px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-border-soft, rgba(124,58,237,0.45))",
  background:
    "var(--historietas-input-bg, #04000A)",
  color: "#FFFFFF",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "13px",
  fontWeight: 750,
  boxSizing: "border-box",
};

const primaryButtonStyle: CSSProperties = {
  minHeight: "46px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background:
    "var(--historietas-active-surface, rgba(124,58,237,0.22))",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "13px",
  fontWeight: 950,
};

const primaryLinkStyle: CSSProperties = {
  minHeight: "46px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background:
    "var(--historietas-active-surface, rgba(124,58,237,0.22))",
  color: "#FFFFFF",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "13px",
  fontWeight: 950,
};

const errorStyle: CSSProperties = {
  color: "#FCA5A5",
  fontSize: "12px",
  lineHeight: 1.45,
  fontWeight: 850,
  textAlign: "center",
};