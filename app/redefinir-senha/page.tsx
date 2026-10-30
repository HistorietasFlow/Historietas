"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import LanguageSelect from "../../components/LanguageSelect";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { supabase } from "../../lib/supabase/client";
import {
  TRANSLATIONS,
  type TranslationKey,
} from "./lib/redefinir-senha-translations";
import {
  cardStyle,
  containerStyle,
  contentStyle,
  descriptionStyle,
  errorStyle,
  fieldStyle,
  formStyle,
  headerStyle,
  inputStyle,
  labelStyle,
  languageSelectStyle,
  languageWrapperStyle,
  logoMarkStyle,
  logoStyle,
  logoTextStyle,
  pageStyle,
  primaryButtonStyle,
  primaryLinkStyle,
  redefinirSenhaPageCss,
  statusStyle,
  titleStyle,
} from "./styles/redefinir-senha-styles";

type EstadoLink = "verificando" | "valido" | "invalido";

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
        {`${historietasThemeCss}${redefinirSenhaPageCss}`}
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
