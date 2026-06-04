"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { obras } from "../data/obras";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";

const SAVED_RELEASES_STORAGE_KEY = "historietas-lancamentos-salvos";

function pegarParametro(parametro?: string | string[] | null) {
  if (Array.isArray(parametro)) {
    return parametro[0]?.trim() || "";
  }

  return parametro?.trim() || "";
}

function normalizarTexto(texto: string) {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function criarSlugBase(titulo: string) {
  const slug = normalizarTexto(titulo)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "obra";
}

function encontrarObraPorTitulo(titulo: string) {
  const tituloNormalizado = normalizarTexto(titulo);

  return (
    obras.find((obra) => normalizarTexto(obra.titulo) === tituloNormalizado) ||
    null
  );
}

function criarLinkObra(titulo: string) {
  const obraEncontrada = encontrarObraPorTitulo(titulo);
  const obraParametro = encodeURIComponent(obraEncontrada?.titulo || titulo);

  if (obraEncontrada && !obraEncontrada.disponivel) {
    return `/em-breve?obra=${obraParametro}`;
  }

  if (obraEncontrada?.link?.trim()) {
    return obraEncontrada.link;
  }

  if (obraEncontrada?.slug?.trim()) {
    return `/obra/${obraEncontrada.slug}`;
  }

  return `/obra/${criarSlugBase(titulo)}`;
}

export default function EmBrevePage() {
  const [nomeObra, setNomeObra] = useState("");
  const [obrasSalvas, setObrasSalvas] = useState<string[]>([]);
  const [desktopLayout, setDesktopLayout] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  useEffect(() => {
    const consultaDesktop = window.matchMedia("(min-width: 900px)");

    function atualizarLayoutDesktop() {
      setDesktopLayout(consultaDesktop.matches);
    }

    atualizarLayoutDesktop();
    consultaDesktop.addEventListener("change", atualizarLayoutDesktop);

    return () => {
      consultaDesktop.removeEventListener("change", atualizarLayoutDesktop);
    };
  }, []);

  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);

    setNomeObra(pegarParametro(parametros.get("obra")));

    try {
      const salvasTexto = localStorage.getItem(SAVED_RELEASES_STORAGE_KEY);
      const salvasJson: unknown = salvasTexto ? JSON.parse(salvasTexto) : [];

      const salvasNormalizadas = Array.isArray(salvasJson)
        ? salvasJson.filter(
            (obra): obra is string =>
              typeof obra === "string" && Boolean(obra.trim())
          )
        : [];

      localStorage.setItem(
        SAVED_RELEASES_STORAGE_KEY,
        JSON.stringify(salvasNormalizadas)
      );

      setObrasSalvas(salvasNormalizadas);
    } catch {
      localStorage.setItem(SAVED_RELEASES_STORAGE_KEY, JSON.stringify([]));
      setObrasSalvas([]);
    }
  }, []);

  const obraCatalogo = nomeObra ? encontrarObraPorTitulo(nomeObra) : null;

  const obrasEmBreve = obras.filter((obra) => !obra.disponivel);

  const outrasObrasEmBreve = obrasEmBreve
    .filter((obra) => {
      if (!obraCatalogo) {
        return true;
      }

      return obra.titulo !== obraCatalogo.titulo;
    })
    .slice(0, 4);

  function salvarLancamento(titulo: string) {
    const tituloNormalizado = normalizarTexto(titulo);

    if (!tituloNormalizado) {
      return;
    }

    const novasObrasSalvas = obrasSalvas.includes(tituloNormalizado)
      ? obrasSalvas.filter((obra) => obra !== tituloNormalizado)
      : Array.from(new Set([...obrasSalvas, tituloNormalizado]));

    localStorage.setItem(
      SAVED_RELEASES_STORAGE_KEY,
      JSON.stringify(novasObrasSalvas)
    );

    setObrasSalvas(novasObrasSalvas);
  }

  return (
    <main style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${emBrevePageCss}`}</style>

      {desktopLayout && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!desktopLayout && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={desktopLayout ? desktopContainerStyle : containerStyle}>
        <header style={desktopLayout ? desktopTitleHeaderStyle : titleHeaderStyle}>
          <Link
            href="/"
            style={desktopLayout ? desktopTitleLinkStyle : titleLinkStyle}
            aria-label="Voltar para a Home"
          >
            <span
              className="historietas-theme-logo-text"
              style={desktopLayout ? desktopTitleTextStyle : titleTextStyle}
            >
              OBRAS EM BREVE
            </span>
          </Link>
        </header>

        {outrasObrasEmBreve.length > 0 && (
          <section
            style={
              desktopLayout ? desktopRelatedSectionStyle : relatedSectionStyle
            }
          >
            <div style={desktopLayout ? desktopRelatedGridStyle : relatedGridStyle}>
              {outrasObrasEmBreve.map((obra) => {
                const obraSalva = obrasSalvas.includes(
                  normalizarTexto(obra.titulo)
                );

                return (
                  <article
                    key={obra.titulo}
                    style={desktopLayout ? desktopRelatedCardStyle : relatedCardStyle}
                  >
                    <Link
                      href={criarLinkObra(obra.titulo)}
                      style={relatedCoverLinkStyle}
                      aria-label={`Abrir página de ${obra.titulo}`}
                    >
                      <div
                        style={
                          desktopLayout ? desktopRelatedCoverStyle : relatedCoverStyle
                        }
                      >
                        <span style={relatedGenreStyle}>{obra.genero}</span>
                      </div>
                    </Link>

                    <div
                      style={
                        desktopLayout ? desktopRelatedContentStyle : relatedContentStyle
                      }
                    >
                      <div
                        style={
                          desktopLayout
                            ? desktopRelatedTopLineStyle
                            : relatedTopLineStyle
                        }
                      >
                        <Link
                          href={criarLinkObra(obra.titulo)}
                          style={relatedTitleLinkStyle}
                        >
                          <strong style={relatedTitleStyle}>
                            {obra.titulo}
                          </strong>
                        </Link>

                        <span style={relatedSideBadgeStyle}>EM BREVE</span>
                      </div>

                      <span style={relatedAuthorStyle}>Por {obra.autor}</span>

                      <div
                        style={
                          desktopLayout
                            ? desktopRelatedReleasePanelStyle
                            : relatedReleasePanelStyle
                        }
                      >
                        <span style={relatedReleaseLabelStyle}>
                          {obraSalva ? "AVISO ATIVADO" : "LANÇAMENTO FUTURO"}
                        </span>

                        <span style={relatedReleaseTextStyle}>
                          {obraSalva
                            ? "Você será avisado quando for liberada."
                            : "Abra a página da obra ou ative o aviso."}
                        </span>
                      </div>

                      <div
                        style={
                          desktopLayout
                            ? desktopRelatedBottomRowStyle
                            : relatedBottomRowStyle
                        }
                      >
                        <div style={relatedStatsStyle}>
                          <span style={safeTextStyle}>👁 {obra.views}</span>
                          <span style={safeTextStyle}>♥ {obra.likes}</span>
                          <span style={safeTextStyle}>
                            💬 {obra.comentarios}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => salvarLancamento(obra.titulo)}
                          style={
                            obraSalva
                              ? relatedSavedButtonStyle
                              : relatedSaveButtonStyle
                          }
                          aria-pressed={obraSalva}
                        >
                          {obraSalva ? "✓ Aviso ativo" : "Avisar"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section style={desktopLayout ? desktopInfoBoxStyle : infoBoxStyle}>
          <h2 style={infoTitleStyle}>Sobre o aviso</h2>

          <p style={infoTextStyle}>
            Quando a história for liberada, ela sai desta tela de Em Breve e
            passa a ter leitura, capítulos e página própria.
          </p>
        </section>
      </section>
    </main>
  );
}

const emBrevePageCss = `
  html[data-historietas-tema-visual] nav a[href="/publicar"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"],
  html[data-historietas-tema-visual] div:has(a[href="/publicar"]):has(a[href="/biblioteca"]) a[href="/publicar"] {
    background: var(--historietas-bottom-nav-main-bg, linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)) !important;
    border-color: var(--historietas-bottom-nav-main-border, color-mix(in srgb, var(--historietas-accent, #F97316) 55%, transparent)) !important;
    color: #FFFFFF !important;
    box-shadow: var(--historietas-bottom-nav-main-shadow, none) !important;
  }
`;

const safeTextStyle: CSSProperties = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const buttonBaseStyle: CSSProperties = {
  boxSizing: "border-box",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
  textAlign: "center",
  fontFamily: "inherit",
  WebkitTapHighlightColor: "transparent",
  ...safeTextStyle,
};

const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(520px, 72vh)",
  pointerEvents: "none",
  zIndex: 0,
  background:
    "linear-gradient(180deg, var(--historietas-bg-start, rgba(10,6,18,0.98)) 0%, var(--historietas-bg-mid, rgba(14,7,25,0.94)) 42%, transparent 100%), radial-gradient(ellipse 72% 82% at 18% 44%, var(--historietas-glow-primary, rgba(124,58,237,0.24)) 0%, transparent 76%), radial-gradient(ellipse 48% 62% at 88% 32%, var(--historietas-glow-secondary, rgba(249,115,22,0.10)) 0%, transparent 78%)",
  WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 76%, transparent 100%)",
  maskImage: "linear-gradient(180deg, #000 0%, #000 76%, transparent 100%)",
};

const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background:
    "linear-gradient(180deg, var(--historietas-bg-start, rgba(10,6,18,0.98)) 0%, var(--historietas-bg-mid, rgba(14,7,25,0.96)) 34%, transparent 100%), radial-gradient(ellipse 62% 86% at 19% 52%, var(--historietas-glow-primary, rgba(124,58,237,0.32)) 0%, transparent 76%), radial-gradient(ellipse 38% 62% at 91% 54%, var(--historietas-glow-secondary, rgba(249,115,22,0.10)) 0%, transparent 76%)",
  WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 78%, transparent 100%)",
  maskImage: "linear-gradient(180deg, #000 0%, #000 78%, transparent 100%)",
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background:
    "radial-gradient(circle at 12% 0%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)), transparent 28%), radial-gradient(circle at 88% 14%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)), transparent 22%), radial-gradient(circle at 50% 100%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)), transparent 30%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 38%, var(--historietas-bg-end, #17101B) 100%)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(860px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "14px 0 calc(24px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "10px",
  marginBottom: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "clamp(19px, 6vw, 24px)",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "calc(100% - 126px)",
  overflow: "hidden",
  boxSizing: "border-box",
};

const logoMarkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #F5F3FF) 0%, var(--historietas-title-mid, #C4B5FD) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "var(--historietas-logo-shadow, 0 0 26px rgba(124,58,237,0.24))",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const titleHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  flexWrap: "nowrap",
  marginTop: "4px",
  marginBottom: "14px",
  padding: 0,
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "center",
  boxSizing: "border-box",
};

const titleLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "23px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  flex: "0 1 auto",
  ...safeTextStyle,
};


const titleTextStyle: CSSProperties = {
  display: "inline-block",
  marginLeft: 0,
  paddingRight: "0.2em",
  paddingBottom: "0.04em",
  whiteSpace: "nowrap",
  overflow: "visible",
  fontSize: "23px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  wordSpacing: "0.11em",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
  textShadow: "none",
};

const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  marginTop: "6px",
  marginBottom: "18px",
};

const desktopTitleLinkStyle: CSSProperties = {
  ...titleLinkStyle,
};


const desktopTitleTextStyle: CSSProperties = {
  ...titleTextStyle,
};

const heroStyle: CSSProperties = {
  position: "relative",
  borderRadius: "22px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 15%, transparent)",
  background:
    "radial-gradient(circle at 16% 18%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent)), transparent 30%), radial-gradient(circle at 82% 12%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 50%, transparent)), transparent 38%), linear-gradient(135deg, var(--historietas-surface, rgba(31,16,52,0.98)) 0%, var(--historietas-surface-strong, rgba(12,7,23,0.99)) 100%)",
  boxShadow: "var(--historietas-hero-shadow, none)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const heroGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)",
  pointerEvents: "none",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "clamp(10px, 2.7vw, 14px)",
  display: "grid",
  justifyItems: "center",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "center",
  boxSizing: "border-box",
};

const badgeRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
  maxWidth: "100%",
};

const badgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 36%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  whiteSpace: "normal",
  boxSizing: "border-box",
  ...safeTextStyle,
};


const classificationBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 36%, transparent)",
  color: "var(--historietas-secondary, #DDD6FE)",
  fontSize: "12px",
  fontWeight: 950,
  whiteSpace: "normal",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const genreBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-text-primary, #E4E4E7)",
  fontSize: "12px",
  fontWeight: 950,
  whiteSpace: "normal",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(26px, 7.1vw, 40px)",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  maxWidth: "100%",
  textAlign: "center",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 48%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: "0 auto",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11.8px",
  lineHeight: 1.38,
  fontWeight: 650,
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

const releaseBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "36px minmax(0, 1fr)",
  alignItems: "center",
  gap: "9px",
  padding: "10px",
  borderRadius: "18px",
  background:
    "radial-gradient(circle at 88% 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 15%, transparent), transparent 38%), linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 13%, transparent) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 11%, transparent) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent)",
  minWidth: 0,
  width: "min(100%, 620px)",
  maxWidth: "100%",
  justifySelf: "center",
  textAlign: "left",
  overflow: "hidden",
  boxSizing: "border-box",
};

const releaseIconStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "12px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  flex: "0 0 auto",
  boxSizing: "border-box",
};

const releaseContentStyle: CSSProperties = {
  display: "grid",
  justifyItems: "start",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "left",
};

const releaseLabelStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const releaseNameStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(18px, 5.4vw, 22px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

const releaseTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10.5px",
  lineHeight: 1.34,
  fontWeight: 750,
  ...safeTextStyle,
};

const releaseMetaStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-start",
  gap: "6px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 850,
  minWidth: 0,
  maxWidth: "100%",
  ...safeTextStyle,
};

const actionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  margin: "2px auto 0",
  minWidth: 0,
  width: "min(100%, 560px)",
  maxWidth: "100%",
  justifySelf: "center",
  boxSizing: "border-box",
};

const actionsThreeColumnsStyle: CSSProperties = {
  ...actionsStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "6px",
};

const primaryButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10.8px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "none",
  padding: "0 8px",
  ...buttonBaseStyle,
  width: "100%",
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10.8px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "none",
  padding: "0 8px",
  ...buttonBaseStyle,
  width: "100%",
};

const notifyButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent)",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, transparent) 100%)",
  color: "#FFFFFF",
  fontSize: "10.8px",
  fontWeight: 950,
  cursor: "pointer",
  padding: "0 8px",
  boxShadow: "none",
  ...buttonBaseStyle,
  width: "100%",
};

const savedButtonStyle: CSSProperties = {
  ...notifyButtonStyle,
  border: "1px solid color-mix(in srgb, #22C55E 30%, var(--historietas-border-soft, transparent))",
  background:
    "color-mix(in srgb, #22C55E 12%, var(--historietas-surface, transparent))",
  color: "color-mix(in srgb, #166534 72%, var(--historietas-text-primary, #FFFFFF))",
};

const savedMessageStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  lineHeight: 1.4,
  fontWeight: 800,
  textAlign: "center",
  maxWidth: "100%",
  ...safeTextStyle,
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "9px",
  marginTop: "12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const summaryCardStyle: CSSProperties = {
  borderRadius: "18px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.045))",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 15%, rgba(255,255,255,0.075))",
  padding: "10px",
  display: "grid",
  justifyItems: "center",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "center",
  overflow: "hidden",
  boxSizing: "border-box",
  boxShadow: "none",
};

const summaryNumberStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "24px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

const summaryLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.055em",
  ...safeTextStyle,
};

const miniTitleStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const relatedSectionStyle: CSSProperties = {
  marginTop: "16px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
  gap: "3px",
  marginBottom: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(24px, 7vw, 32px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.058em",
  maxWidth: "100%",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 54%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...safeTextStyle,
};

const releaseSectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "clamp(24px, 7vw, 32px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.035em",
  textAlign: "center",
  textTransform: "uppercase",
  maxWidth: "100%",
  ...safeTextStyle,
};

const relatedGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "9px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const relatedCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(78px, 96px) minmax(0, 1fr)",
  gap: "9px",
  padding: "10px",
  borderRadius: "22px",
  background:
    "radial-gradient(circle at 96% 18%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 15%, transparent)), transparent 28%), radial-gradient(circle at 12% 88%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 12%, transparent)), transparent 32%), linear-gradient(135deg, var(--historietas-surface, rgba(34,24,51,0.95)) 0%, var(--historietas-surface-strong, rgba(18,12,30,0.99)) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 14%, rgba(255,255,255,0.06))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
  boxShadow: "var(--historietas-card-shadow, none)",
};

const relatedCoverLinkStyle: CSSProperties = {
  display: "block",
  textDecoration: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  minWidth: 0,
  maxWidth: "100%",
  height: "100%",
  boxSizing: "border-box",
};

const relatedCoverStyle: CSSProperties = {
  minHeight: "120px",
  height: "100%",
  borderRadius: "17px",
  position: "relative",
  overflow: "hidden",
  background:
    "radial-gradient(circle at 24% 18%, color-mix(in srgb, var(--historietas-accent, #F97316) 44%, transparent), transparent 34%), radial-gradient(circle at 78% 84%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 66%, transparent), transparent 42%), linear-gradient(135deg, #18181B 0%, #0F0F0F 100%)",
  minWidth: 0,
  maxWidth: "100%",
  boxShadow: "none",
  boxSizing: "border-box",
};

const relatedGenreStyle: CSSProperties = {
  position: "absolute",
  left: "8px",
  right: "8px",
  bottom: "8px",
  padding: "6px 7px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 92%, transparent)",
  color: "#FFFFFF",
  fontSize: "9px",
  fontWeight: 950,
  textAlign: "center",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const relatedContentStyle: CSSProperties = {
  display: "grid",
  alignContent: "stretch",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const relatedTitleLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "100%",
};

const relatedTopLineStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "start",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

const relatedSideBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "88px",
  padding: "6px 8px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 34%, transparent)",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "8px",
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "0.06em",
  whiteSpace: "normal",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const relatedTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(18px, 5.8vw, 21px)",
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const relatedAuthorStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11px",
  fontWeight: 900,
  maxWidth: "100%",
  ...safeTextStyle,
};

const relatedReleasePanelStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  padding: "8px 9px",
  borderRadius: "14px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 8%, transparent) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.07))",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const relatedReleaseLabelStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "8px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const relatedReleaseTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  lineHeight: 1.35,
  fontWeight: 750,
  ...safeTextStyle,
};

const relatedBottomRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(74px, 84px)",
  alignItems: "center",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

const relatedStatsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 850,
  minWidth: 0,
  maxWidth: "100%",
};

const relatedSaveButtonStyle: CSSProperties = {
  minHeight: "34px",
  width: "100%",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 42%, transparent)",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 14%, var(--historietas-surface, transparent))",
  color: "var(--historietas-accent, #F97316)",
  fontSize: "10.5px",
  fontWeight: 950,
  cursor: "pointer",
  padding: "0 9px",
  ...buttonBaseStyle,
};

const relatedSavedButtonStyle: CSSProperties = {
  ...relatedSaveButtonStyle,
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 52%, transparent)",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
};

const infoBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: "13px",
  borderRadius: "20px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.045))",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 18%, rgba(255,255,255,0.07))",
  display: "grid",
  justifyItems: "center",
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "center",
  overflow: "hidden",
  boxSizing: "border-box",
};

const infoTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "20px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

const infoTextStyle: CSSProperties = {
  margin: "7px auto 0",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12.5px",
  lineHeight: 1.55,
  fontWeight: 700,
  maxWidth: "720px",
  textAlign: "center",
  ...safeTextStyle,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "20px 0 40px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "18px",
};

const desktopLogoStyle: CSSProperties = {
  ...logoStyle,
  maxWidth: "420px",
};


const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "34px",
  boxShadow: "var(--historietas-hero-shadow, none)",
};

const desktopHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  padding: "28px 30px",
  gap: "10px",
  justifyItems: "center",
  textAlign: "center",
};

const desktopHeroContentWithReleaseStyle: CSSProperties = {
  ...desktopHeroContentStyle,
  gridTemplateColumns: "minmax(0, 1fr)",
  alignItems: "center",
  justifyItems: "center",
  columnGap: 0,
};

const desktopBadgeRowStyle: CSSProperties = {
  ...badgeRowStyle,
  gridColumn: "1",
  justifyContent: "center",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  gridColumn: "1",
  fontSize: "clamp(46px, 4.5vw, 64px)",
  lineHeight: 1.03,
  maxWidth: "760px",
  margin: "0 auto",
  textAlign: "center",
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  gridColumn: "1",
  maxWidth: "660px",
  margin: "0 auto",
  fontSize: "14px",
  lineHeight: 1.56,
  textAlign: "center",
};

const desktopReleaseBoxStyle: CSSProperties = {
  ...releaseBoxStyle,
  gridColumn: "1",
  gridRow: "auto",
  alignSelf: "auto",
  justifySelf: "center",
  width: "min(720px, 100%)",
  gridTemplateColumns: "64px minmax(0, 1fr)",
  gap: "14px",
  padding: "17px",
  borderRadius: "24px",
  background:
    "radial-gradient(circle at 90% 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent), transparent 38%), linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, transparent) 100%)",
};

const desktopActionsStyle: CSSProperties = {
  ...actionsStyle,
  gridColumn: "1",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  width: "min(100%, 520px)",
  maxWidth: "520px",
  margin: "4px auto 0",
  justifySelf: "center",
  gap: "9px",
};

const desktopActionsThreeColumnsStyle: CSSProperties = {
  ...desktopActionsStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  width: "min(100%, 720px)",
  maxWidth: "720px",
};

const desktopSavedMessageStyle: CSSProperties = {
  ...savedMessageStyle,
  gridColumn: "1",
  textAlign: "center",
  margin: "0 auto",
};

const desktopSummaryGridStyle: CSSProperties = {
  ...summaryGridStyle,
  width: "min(720px, 100%)",
  margin: "14px auto 0",
  gap: "12px",
};

const desktopSummaryCardStyle: CSSProperties = {
  ...summaryCardStyle,
  padding: "17px",
  borderRadius: "22px",
};

const desktopRelatedSectionStyle: CSSProperties = {
  ...relatedSectionStyle,
  marginTop: "18px",
};

const desktopRelatedGridStyle: CSSProperties = {
  ...relatedGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};

const desktopRelatedCardStyle: CSSProperties = {
  ...relatedCardStyle,
  gridTemplateColumns: "minmax(120px, 148px) minmax(0, 1fr)",
  gap: "15px",
  padding: "15px",
  borderRadius: "27px",
};

const desktopRelatedCoverStyle: CSSProperties = {
  ...relatedCoverStyle,
  minHeight: "158px",
  borderRadius: "20px",
};

const desktopRelatedContentStyle: CSSProperties = {
  ...relatedContentStyle,
  gap: "9px",
};

const desktopRelatedTopLineStyle: CSSProperties = {
  ...relatedTopLineStyle,
  gap: "10px",
};

const desktopRelatedReleasePanelStyle: CSSProperties = {
  ...relatedReleasePanelStyle,
  padding: "10px",
  borderRadius: "16px",
};

const desktopRelatedBottomRowStyle: CSSProperties = {
  ...relatedBottomRowStyle,
  gridTemplateColumns: "minmax(0, 1fr) 104px",
  gap: "10px",
};

const desktopInfoBoxStyle: CSSProperties = {
  ...infoBoxStyle,
  width: "min(860px, 100%)",
  margin: "14px auto 0",
  padding: "18px",
  borderRadius: "24px",
};