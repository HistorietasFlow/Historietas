"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import type { HistorietasLanguage } from "../../lib/i18n";
import {
  obterRedirectToAceiteTermos,
  registrarAceiteTermosPublicacao,
  verificarAceiteTermosPublicacao,
} from "../../lib/aceiteTermos";
import { supabase } from "../../lib/supabase/client";

type ChaveTexto =
  | "titulo"
  | "descricao"
  | "termos"
  | "diretrizes"
  | "privacidade"
  | "confirmacaoTermos"
  | "confirmacaoPrivacidade"
  | "aceitarContinuar"
  | "aguarde"
  | "jaAceito"
  | "continuar"
  | "erroLogin"
  | "erroMarcar"
  | "voltar";

const TEXTOS: Record<HistorietasLanguage, Record<ChaveTexto, string>> = {
  "pt-BR": {
    titulo: "ACEITE PARA PUBLICAR",
    descricao:
      "Antes de publicar obras, capítulos ou posts, confirme que leu e concorda com as regras atuais do Historietas.",
    termos: "Termos de Uso",
    diretrizes: "Diretrizes da Comunidade",
    privacidade: "Política de Privacidade",
    confirmacaoTermos:
      "Li e aceito os Termos de Uso e as Diretrizes da Comunidade.",
    confirmacaoPrivacidade:
      "Li e estou ciente da Política de Privacidade.",
    aceitarContinuar: "ACEITAR E CONTINUAR",
    aguarde: "AGUARDE...",
    jaAceito: "Seu aceite já está atualizado.",
    continuar: "CONTINUAR",
    erroLogin: "Entre na sua conta para registrar o aceite.",
    erroMarcar: "Marque as duas confirmações para continuar.",
    voltar: "Voltar",
  },
  en: {
    titulo: "ACCEPTANCE REQUIRED TO PUBLISH",
    descricao:
      "Before publishing works, chapters, or posts, confirm that you have read and agree to the current Historietas rules.",
    termos: "Terms of Use",
    diretrizes: "Community Guidelines",
    privacidade: "Privacy Policy",
    confirmacaoTermos:
      "I have read and accept the Terms of Use and Community Guidelines.",
    confirmacaoPrivacidade: "I have read and acknowledge the Privacy Policy.",
    aceitarContinuar: "ACCEPT AND CONTINUE",
    aguarde: "PLEASE WAIT...",
    jaAceito: "Your acceptance is already up to date.",
    continuar: "CONTINUE",
    erroLogin: "Sign in to record your acceptance.",
    erroMarcar: "Select both confirmations to continue.",
    voltar: "Back",
  },
  es: {
    titulo: "ACEPTACIÓN PARA PUBLICAR",
    descricao:
      "Antes de publicar obras, capítulos o posts, confirma que leíste y aceptas las reglas actuales de Historietas.",
    termos: "Términos de Uso",
    diretrizes: "Normas de la Comunidad",
    privacidade: "Política de Privacidad",
    confirmacaoTermos:
      "He leído y acepto los Términos de Uso y las Normas de la Comunidad.",
    confirmacaoPrivacidade:
      "He leído y conozco la Política de Privacidad.",
    aceitarContinuar: "ACEPTAR Y CONTINUAR",
    aguarde: "ESPERA...",
    jaAceito: "Tu aceptación ya está actualizada.",
    continuar: "CONTINUAR",
    erroLogin: "Inicia sesión para registrar la aceptación.",
    erroMarcar: "Marca las dos confirmaciones para continuar.",
    voltar: "Volver",
  },
};

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
      <style>{`${historietasThemeCss}${pageCss}`}</style>

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

const pageCss = `
  html, body { background: #000 !important; }
  html[data-historietas-tema-visual="foco"] body,
  html[data-historietas-tema-visual="foco"] main { background: #000 !important; color: #fff !important; }
`;

const pageStyle: CSSProperties = {
  minHeight: "100dvh",
  background: "#000000",
  color: "#FFFFFF",
  padding: "24px 14px 48px",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  width: "min(680px, 100%)",
  margin: "0 auto",
};

const backLinkStyle: CSSProperties = {
  display: "inline-flex",
  marginBottom: "18px",
  color: "#D4D4D8",
  textDecoration: "none",
  fontWeight: 800,
  fontSize: "14px",
};

const cardStyle: CSSProperties = {
  display: "grid",
  gap: "18px",
  padding: "clamp(22px, 5vw, 38px)",
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: "28px",
  background: "#050505",
  boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
};

const markStyle: CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "15px",
  display: "grid",
  placeItems: "center",
  border: "1px solid rgba(255,255,255,0.25)",
  fontWeight: 950,
  fontSize: "24px",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "clamp(28px, 7vw, 46px)",
  lineHeight: 1.05,
  letterSpacing: "-0.045em",
  fontWeight: 950,
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  lineHeight: 1.65,
  fontSize: "15px",
};

const linksStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
};

const legalLinkStyle: CSSProperties = {
  color: "#FFFFFF",
  textDecoration: "underline",
  textUnderlineOffset: "4px",
  fontSize: "13px",
  fontWeight: 850,
};

const checksStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
};

const checkLabelStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "24px minmax(0, 1fr)",
  gap: "12px",
  alignItems: "start",
  padding: "15px",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: "18px",
  background: "#000000",
  color: "#F4F4F5",
  lineHeight: 1.5,
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
};

const checkboxStyle: CSSProperties = {
  width: "20px",
  height: "20px",
  margin: "1px 0 0",
  accentColor: "#FFFFFF",
};

const primaryButtonStyle: CSSProperties = {
  minHeight: "52px",
  border: "none",
  borderRadius: "999px",
  background: "#FFFFFF",
  color: "#000000",
  fontSize: "13px",
  fontWeight: 950,
  letterSpacing: "0.04em",
};

const statusStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  fontWeight: 850,
};

const successStyle: CSSProperties = {
  margin: 0,
  padding: "14px 16px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "#FFFFFF",
  background: "rgba(255,255,255,0.06)",
  fontWeight: 800,
};

const errorStyle: CSSProperties = {
  margin: 0,
  padding: "14px 16px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.22)",
  color: "#FFFFFF",
  background: "rgba(255,255,255,0.07)",
  lineHeight: 1.5,
  fontWeight: 750,
};
