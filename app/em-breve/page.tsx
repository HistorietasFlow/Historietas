"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { obras } from "../data/obras";
import { supabase } from "../../lib/supabase/client";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { useNotificacoes } from "../../components/NotificacoesProvider";
import { criarSlugBase, normalizarTexto } from "../../lib/utils";

const SAVED_RELEASES_STORAGE_KEY = "historietas-lancamentos-salvos";

function criarStorageKeyUsuarioEmBreve(chave: string, userId: string) {
  const userIdLimpo = userId.trim();

  return userIdLimpo ? `${chave}:${userIdLimpo}` : chave;
}

function carregarJsonUsuarioEmBreve(chave: string, userId: string) {
  if (typeof window === "undefined" || !userId.trim()) {
    return null;
  }

  try {
    const texto = localStorage.getItem(
      criarStorageKeyUsuarioEmBreve(chave, userId)
    );

    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

function salvarJsonUsuarioEmBreve(
  chave: string,
  userId: string,
  valor: unknown
) {
  if (typeof window === "undefined" || !userId.trim()) {
    return;
  }

  try {
    localStorage.setItem(
      criarStorageKeyUsuarioEmBreve(chave, userId),
      JSON.stringify(valor)
    );
  } catch {
    // localStorage é fallback; a tela continua com estado em memória.
  }
}

function pegarParametro(parametro?: string | string[] | null) {
  if (Array.isArray(parametro)) {
    return parametro[0]?.trim() || "";
  }

  return parametro?.trim() || "";
}

function criarLoginHrefEmBreve() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/em-breve";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/em-breve";
  const params = new URLSearchParams({
    redirectTo: destinoSeguro,
  });

  return `/login?${params.toString()}`;
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
  const router = useRouter();
  const [nomeObra, setNomeObra] = useState("");
  const [obrasSalvas, setObrasSalvas] = useState<string[]>([]);
  const [avisoAcesso, setAvisoAcesso] = useState("");
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [desktopLayout, setDesktopLayout] = useState(false);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { notificacoesNaoLidas } = useNotificacoes();

  useEffect(() => {
    const consultaDesktop = window.matchMedia("(min-width: 900px)");

    function atualizarLayoutDesktop() {
      setDesktopLayout(consultaDesktop.matches);
    }

    const atualizarLayoutDesktopTimer = window.setTimeout(
      atualizarLayoutDesktop,
      0
    );

    consultaDesktop.addEventListener("change", atualizarLayoutDesktop);

    return () => {
      window.clearTimeout(atualizarLayoutDesktopTimer);
      consultaDesktop.removeEventListener("change", atualizarLayoutDesktop);
    };
  }, []);

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarLancamentosSalvos() {
      const parametros = new URLSearchParams(window.location.search);
      const nomeObraParam = pegarParametro(parametros.get("obra"));

      window.setTimeout(() => {
        if (componenteAtivo) {
          setNomeObra(nomeObraParam);
        }
      }, 0);

      try {
        const { data } = await supabase.auth.getUser();

        if (!data.user) {
          window.setTimeout(() => {
            if (componenteAtivo) {
              setUsuarioIdLogado("");
              setObrasSalvas([]);
            }
          }, 0);

          return;
        }

        window.setTimeout(() => {
          if (componenteAtivo) {
            setUsuarioIdLogado(data.user.id);
          }
        }, 0);

        const salvasJson: unknown =
          carregarJsonUsuarioEmBreve(SAVED_RELEASES_STORAGE_KEY, data.user.id) ||
          [];

        const salvasNormalizadas = Array.isArray(salvasJson)
          ? salvasJson.filter(
              (obra): obra is string =>
                typeof obra === "string" && Boolean(obra.trim())
            )
          : [];

        salvarJsonUsuarioEmBreve(
          SAVED_RELEASES_STORAGE_KEY,
          data.user.id,
          salvasNormalizadas
        );

        window.setTimeout(() => {
          if (componenteAtivo) {
            setObrasSalvas(salvasNormalizadas);
          }
        }, 0);
      } catch {
        window.setTimeout(() => {
          if (componenteAtivo) {
            setUsuarioIdLogado("");
            setObrasSalvas([]);
          }
        }, 0);
      }
    }

    void carregarLancamentosSalvos();

    return () => {
      componenteAtivo = false;
    };
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

  async function salvarLancamento(titulo: string) {
    const tituloNormalizado = normalizarTexto(titulo);

    if (!tituloNormalizado) {
      return;
    }

    setAvisoAcesso("");

    try {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        setAvisoAcesso("Entre na sua conta para ativar aviso de lançamento.");
        router.push(criarLoginHrefEmBreve());
        return;
      }

      setUsuarioIdLogado(data.user.id);

      const novasObrasSalvas = obrasSalvas.includes(tituloNormalizado)
        ? obrasSalvas.filter((obra) => obra !== tituloNormalizado)
        : Array.from(new Set([...obrasSalvas, tituloNormalizado]));

      salvarJsonUsuarioEmBreve(
        SAVED_RELEASES_STORAGE_KEY,
        data.user.id,
        novasObrasSalvas
      );

      setObrasSalvas(novasObrasSalvas);
      return;
    } catch {
      setAvisoAcesso("Não consegui confirmar sua conta agora. Tente novamente.");
      router.push(criarLoginHrefEmBreve());
      return;
    }


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
              className="historietas-theme-title"
              style={desktopLayout ? desktopTitleTextStyle : titleTextStyle}
            >
              EM BREVE
            </span>
          </Link>

          {desktopLayout ? (
            <Link
              href="/notificacoes"
              style={desktopNotificationButtonStyle}
              aria-label={
                notificacoesNaoLidas > 0
                  ? `Notificações: ${notificacoesNaoLidas} não lidas`
                  : "Notificações"
              }
            >
              N

              {notificacoesNaoLidas > 0 ? (
                <span style={desktopNotificationBadgeStyle}>
                  {notificacoesNaoLidas > 99
                    ? "99+"
                    : notificacoesNaoLidas}
                </span>
              ) : null}
            </Link>
          ) : null}
        </header>

        {outrasObrasEmBreve.length > 0 && (
          <section
            style={
              desktopLayout ? desktopRelatedSectionStyle : relatedSectionStyle
            }
          >
            {avisoAcesso && <p style={accessMessageStyle}>{avisoAcesso}</p>}

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
            Quando a história for liberada, ela sai desta tela de Lançamentos e
            passa a ter leitura, capítulos e página própria.
          </p>
        </section>
      </section>
    </main>
  );
}

const emBrevePageCss = `
  html[data-historietas-tema-visual] body,
  html[data-historietas-tema-visual] main,
  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #070212 !important;
  }

  html[data-historietas-tema-visual] main > div[aria-hidden="true"],
  html[data-historietas-tema-visual="original"] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  html[data-historietas-tema-visual] nav,
  html[data-historietas-tema-visual] [data-bottom-nav],
  html[data-historietas-tema-visual] [data-mobile-nav] {
    background: var(--historietas-bottom-nav-bg, #04000A) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) {
    background: transparent !important;
    border-color: transparent !important;
    color: var(--historietas-bottom-nav-text, #9980D8) !important;
    box-shadow: none !important;
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
  background: "transparent",
  opacity: 0,
};

const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  opacity: 0,
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "#070212",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(900px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "18px 0 calc(24px + env(safe-area-inset-bottom))",
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
  marginBottom: "18px",
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
  width: "fit-content",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  textAlign: "center",
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
  textAlign: "center",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
  textShadow: "none",
  ...safeTextStyle,
};

const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  position: "relative",
  marginTop: "6px",
  marginBottom: "18px",
};

const desktopNotificationButtonStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  right: 0,
  transform: "translateY(-50%)",
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-surface-strong, #04000A)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 950,
  boxShadow: "none",
  zIndex: 2,
};

const desktopNotificationBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "-7px",
  right: "-9px",
  minWidth: "18px",
  height: "18px",
  padding: "0 4px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid var(--historietas-bg-start, #070212)",
  background: "#EF4444",
  color: "#FFFFFF",
  fontSize: "9px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.38)",
  pointerEvents: "none",
};

const desktopTitleLinkStyle: CSSProperties = {
  ...titleLinkStyle,
};


const desktopTitleTextStyle: CSSProperties = {
  ...titleTextStyle,
};

const heroStyle: CSSProperties = {
  position: "relative",
  borderRadius: "30px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "linear-gradient(135deg, #070212 0%, #04000A 58%, #020006 100%)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const heroGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "transparent",
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
  background: "rgba(249,115,22,0.12)",
  border: "1px solid rgba(249,115,22,0.24)",
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
  background: "rgba(124,58,237,0.12)",
  border: "1px solid rgba(124,58,237,0.24)",
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
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.06)",
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
  WebkitTextFillColor: "transparent",
  textShadow: "none",
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
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  minWidth: 0,
  width: "min(100%, 620px)",
  maxWidth: "100%",
  justifySelf: "center",
  textAlign: "left",
  overflow: "hidden",
  boxSizing: "border-box",
  boxShadow: "none",
};

const releaseIconStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "12px",
  background: "rgba(249,115,22,0.12)",
  border: "1px solid rgba(249,115,22,0.24)",
  color: "var(--historietas-accent, #FDBA74)",
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
  minHeight: "40px",
  padding: "0 14px",
  borderRadius: "999px",
  border: "1px solid rgba(249,115,22,0.34)",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "none",
  ...buttonBaseStyle,
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: "40px",
  padding: "0 14px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  color: "#DDD6FE",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "none",
  ...buttonBaseStyle,
};

const notifyButtonStyle: CSSProperties = {
  minHeight: "40px",
  padding: "0 14px",
  borderRadius: "999px",
  border: "1px solid rgba(124,58,237,0.34)",
  background: "rgba(124,58,237,0.18)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "none",
  ...buttonBaseStyle,
};

const savedButtonStyle: CSSProperties = {
  ...notifyButtonStyle,
  background: "rgba(34,197,94,0.13)",
  border: "1px solid rgba(34,197,94,0.28)",
  color: "#86EFAC",
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

const accessMessageStyle: CSSProperties = {
  margin: "0 auto 10px",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "12px",
  lineHeight: 1.4,
  fontWeight: 850,
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
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  padding: "13px",
  borderRadius: "18px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  minWidth: 0,
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
  marginTop: "10px",
  display: "grid",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
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
  gridTemplateColumns: "minmax(88px, 98px) minmax(0, 1fr)",
  gap: "14px",
  alignItems: "stretch",
  padding: "11px",
  borderRadius: "22px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
  boxShadow: "none",
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
  minHeight: "122px",
  height: "100%",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  backgroundImage: "linear-gradient(135deg, #08030F 0%, #04000A 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  border: "1px solid rgba(255,255,255,0.06)",
  minWidth: 0,
  maxWidth: "100%",
  boxShadow: "none",
  boxSizing: "border-box",
};

const relatedGenreStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  bottom: "8px",
  transform: "translateX(-50%)",
  width: "fit-content",
  maxWidth: "calc(100% - 16px)",
  padding: "6px 8px",
  borderRadius: "999px",
  background: "rgba(4,0,10,0.76)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "9.5px",
  fontWeight: 950,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  boxSizing: "border-box",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  whiteSpace: "nowrap",
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
  gridTemplateColumns: "minmax(0, 1fr)",
  alignItems: "start",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
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
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 900,
  maxWidth: "100%",
  ...safeTextStyle,
};

const relatedReleasePanelStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
  maxWidth: "100%",
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
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "#FFFFFF",
  borderRadius: "999px",
  minHeight: "34px",
  padding: "0 12px",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "none",
  ...buttonBaseStyle,
};

const relatedSavedButtonStyle: CSSProperties = {
  ...relatedSaveButtonStyle,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "#FFFFFF",
};

const infoBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: "13px",
  borderRadius: "20px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "grid",
  justifyItems: "center",
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "center",
  overflow: "hidden",
  boxSizing: "border-box",
  boxShadow: "none",
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
  padding: "20px 0 34px",
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
  boxShadow: "none",
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
  background: "rgba(4, 0, 10, 0.72)",
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
  gridTemplateColumns: "126px minmax(0, 1fr)",
  gap: "17px",
  padding: "14px",
  borderRadius: "24px",
  alignItems: "stretch",
  minHeight: "178px",
  background: "rgba(4, 0, 10, 0.72)",
  boxShadow: "none",
};

const desktopRelatedCoverStyle: CSSProperties = {
  ...relatedCoverStyle,
  minHeight: "158px",
  borderRadius: "18px",
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
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
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