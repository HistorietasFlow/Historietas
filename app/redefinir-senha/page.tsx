"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import LanguageSelect from "../../components/LanguageSelect";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { useRedefinirSenhaRecoveryValidation } from "./hooks/use-redefinir-senha-recovery-validation";
import { useRedefinirSenhaSaveAction } from "./hooks/use-redefinir-senha-save-action";
import type { EstadoLink } from "./lib/redefinir-senha-recovery-utils";
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

  useRedefinirSenhaRecoveryValidation(setEstadoLink);

  const { salvarNovaSenha } = useRedefinirSenhaSaveAction({
    router,
    salvando,
    estadoLink,
    novaSenha,
    confirmacao,
    t,
    setEstadoLink,
    setErro,
    setSalvando,
  });

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
