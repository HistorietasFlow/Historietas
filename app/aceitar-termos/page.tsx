"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import {
  obterRedirectToAceiteTermos,
  registrarAceiteTermosPublicacao,
  verificarAceiteTermosPublicacao,
} from "../../lib/aceiteTermos";
import { supabase } from "../../lib/supabase/client";
import {
  TEXTOS,
  type ChaveTexto,
} from "./lib/aceitar-termos-translations";
import {
  aceitarTermosPageCss,
  backLinkStyle,
  cardStyle,
  checkLabelStyle,
  checkboxStyle,
  checksStyle,
  containerStyle,
  descriptionStyle,
  errorStyle,
  legalLinkStyle,
  linksStyle,
  markStyle,
  pageStyle,
  primaryButtonStyle,
  statusStyle,
  successStyle,
  titleStyle,
} from "./styles/aceitar-termos-styles";

export default function AceitarTermosPage() {
  const router = useRouter();
  const { language } = useHistorietasLanguage();
  const t = useCallback((chave: ChaveTexto) => TEXTOS[language][chave], [language]);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const [confirmouTermos, setConfirmouTermos] = useState(false);
  const [confirmouPrivacidade, setConfirmouPrivacidade] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [jaAceito, setJaAceito] = useState(false);
  const [erro, setErro] = useState("");
  const [redirectTo, setRedirectTo] = useState("/");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      const params = new URLSearchParams(window.location.search);
      const destino = obterRedirectToAceiteTermos(params.get("redirectTo"), "/");

      if (ativo) {
        setRedirectTo(destino);
      }

      const { data, error } = await supabase.auth.getUser();

      if (!ativo) {
        return;
      }

      if (error || !data.user) {
        const paramsLogin = new URLSearchParams({
          redirectTo: `/aceitar-termos?${new URLSearchParams({ redirectTo: destino }).toString()}`,
        });
        router.replace(`/login?${paramsLogin.toString()}`);
        return;
      }

      const status = await verificarAceiteTermosPublicacao();

      if (!ativo) {
        return;
      }

      setJaAceito(status.aceito);
      setErro(status.erro && !status.aceito ? status.erro : "");
      setCarregando(false);
    }

    void carregar();

    return () => {
      ativo = false;
    };
  }, [router]);

  async function aceitar() {
    if (salvando) {
      return;
    }

    if (!confirmouTermos || !confirmouPrivacidade) {
      setErro(t("erroMarcar"));
      return;
    }

    setSalvando(true);
    setErro("");

    const resultado = await registrarAceiteTermosPublicacao();

    if (!resultado.aceito) {
      setErro(resultado.erro || t("erroLogin"));
      setSalvando(false);
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${aceitarTermosPageCss}`}</style>

      <section style={containerStyle}>
        <Link href={redirectTo} style={backLinkStyle}>
          ← {t("voltar")}
        </Link>

        <section style={cardStyle}>
          <div style={markStyle}>H</div>
          <h1 className="historietas-theme-title" style={titleStyle}>
            {t("titulo")}
          </h1>
          <p style={descriptionStyle}>{t("descricao")}</p>

          <nav style={linksStyle} aria-label="Documentos legais">
            <Link href="/termos-de-uso" target="_blank" style={legalLinkStyle}>
              {t("termos")}
            </Link>
            <Link
              href="/diretrizes-da-comunidade"
              target="_blank"
              style={legalLinkStyle}
            >
              {t("diretrizes")}
            </Link>
            <Link
              href="/politica-de-privacidade"
              target="_blank"
              style={legalLinkStyle}
            >
              {t("privacidade")}
            </Link>
          </nav>

          {carregando ? (
            <p style={statusStyle}>{t("aguarde")}</p>
          ) : jaAceito ? (
            <>
              <p role="status" style={successStyle}>
                {t("jaAceito")}
              </p>
              <button
                type="button"
                onClick={() => router.replace(redirectTo)}
                style={primaryButtonStyle}
              >
                {t("continuar")}
              </button>
            </>
          ) : (
            <>
              <div style={checksStyle}>
                <label style={checkLabelStyle}>
                  <input
                    type="checkbox"
                    checked={confirmouTermos}
                    onChange={(event) => {
                      setConfirmouTermos(event.target.checked);
                      setErro("");
                    }}
                    style={checkboxStyle}
                  />
                  <span>{t("confirmacaoTermos")}</span>
                </label>

                <label style={checkLabelStyle}>
                  <input
                    type="checkbox"
                    checked={confirmouPrivacidade}
                    onChange={(event) => {
                      setConfirmouPrivacidade(event.target.checked);
                      setErro("");
                    }}
                    style={checkboxStyle}
                  />
                  <span>{t("confirmacaoPrivacidade")}</span>
                </label>
              </div>

              {erro && (
                <p role="alert" style={errorStyle}>
                  {erro}
                </p>
              )}

              <button
                type="button"
                onClick={() => void aceitar()}
                disabled={salvando}
                style={{
                  ...primaryButtonStyle,
                  opacity: salvando ? 0.7 : 1,
                  cursor: salvando ? "not-allowed" : "pointer",
                }}
              >
                {salvando ? t("aguarde") : t("aceitarContinuar")}
              </button>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
