"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { obras } from "../data/obras";

const SAVED_RELEASES_STORAGE_KEY = "historietas-lancamentos-salvos";

// Página: app/em-breve/page.tsx

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
  const [nomeCapitulo, setNomeCapitulo] = useState("");
  const [obrasSalvas, setObrasSalvas] = useState<string[]>([]);
  const [mensagemSalva, setMensagemSalva] = useState("");
  const [desktopLayout, setDesktopLayout] = useState(false);

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
    setNomeCapitulo(pegarParametro(parametros.get("capitulo")));

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

  const classificacaoIndicativa =
    obraCatalogo?.classificacaoIndicativa || "Não informada";

  const mostrarClassificacao = classificacaoIndicativa !== "Não informada";

  const obrasEmBreve = obras.filter((obra) => !obra.disponivel);

  const outrasObrasEmBreve = obrasEmBreve
    .filter((obra) => {
      if (!obraCatalogo) {
        return true;
      }

      return obra.titulo !== obraCatalogo.titulo;
    })
    .slice(0, 4);

  const tituloPagina = nomeObra
    ? `${nomeObra} chega em breve`
    : "Obra em breve";

  const descricaoPagina =
    "Essa história está em preparação e ainda não foi liberada para leitura.";

  const tituloParaSalvar = obraCatalogo?.titulo || nomeObra;

  const obraAtualSalva = tituloParaSalvar
    ? obrasSalvas.includes(normalizarTexto(tituloParaSalvar))
    : false;

  const usarHeroDesktopComDestaque =
    desktopLayout && Boolean(nomeObra || nomeCapitulo);

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

    setMensagemSalva(
      novasObrasSalvas.includes(tituloNormalizado)
        ? "Lançamento salvo. Você poderá receber aviso quando sair."
        : "Lançamento removido dos salvos."
    );
  }

  return (
    <main style={pageStyle}>
      <section style={desktopLayout ? desktopContainerStyle : containerStyle}>
        <header style={desktopLayout ? desktopTopStyle : topStyle}>
          <Link
            href="/"
            style={desktopLayout ? desktopLogoStyle : logoStyle}
            aria-label="Voltar para a Home"
          >
            <span style={logoMarkStyle}>H</span>
            <span style={logoTextStyle}>istorietas</span>
          </Link>

          <span style={desktopLayout ? desktopTopBadgeStyle : topBadgeStyle}>
            EM BREVE
          </span>
        </header>

        <section style={desktopLayout ? desktopHeroStyle : heroStyle}>
          <div style={heroGlowStyle} />

          <div
            style={
              usarHeroDesktopComDestaque
                ? desktopHeroContentWithReleaseStyle
                : desktopHeroContentStyle
            }
          >
            {(obraCatalogo || mostrarClassificacao) && (
              <div style={desktopLayout ? desktopBadgeRowStyle : badgeRowStyle}>
                {obraCatalogo && (
                  <span style={genreBadgeStyle}>{obraCatalogo.genero}</span>
                )}

                {mostrarClassificacao && (
                  <span style={classificationBadgeStyle}>
                    {classificacaoIndicativa}
                  </span>
                )}
              </div>
            )}

            <h1 style={desktopLayout ? desktopTitleStyle : titleStyle}>{tituloPagina}</h1>

            <p style={desktopLayout ? desktopDescriptionStyle : descriptionStyle}>{descricaoPagina}</p>

            {(nomeObra || nomeCapitulo) && (
              <div
                style={
                  usarHeroDesktopComDestaque
                    ? desktopReleaseBoxStyle
                    : releaseBoxStyle
                }
              >
                <div style={releaseIconStyle}>⏳</div>

                <div style={releaseContentStyle}>
                  <span style={releaseLabelStyle}>
                    {nomeCapitulo
                      ? "CAPÍTULO EM PREPARAÇÃO"
                      : "LANÇAMENTO FUTURO"}
                  </span>

                  <strong style={releaseNameStyle}>{nomeObra || "Obra"}</strong>

                  <p style={releaseTextStyle}>
                    {nomeCapitulo
                      ? `O capítulo ${nomeCapitulo} ainda não foi liberado para leitura.`
                      : "Essa obra ainda não tem capítulos liberados para leitura."}
                  </p>

                  {obraCatalogo && (
                    <div style={releaseMetaStyle}>
                      <span>{obraCatalogo.autor}</span>
                      <span>{obraCatalogo.genero}</span>

                      {mostrarClassificacao && (
                        <span>{classificacaoIndicativa}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={desktopLayout ? desktopActionsStyle : actionsStyle}>
              <Link href="/explorar" style={primaryButtonStyle}>
                Voltar para Explorar
              </Link>

              <Link href="/explorar" style={secondaryButtonStyle}>
                Procurar outras histórias
              </Link>

              {tituloParaSalvar && (
                <button
                  type="button"
                  onClick={() => salvarLancamento(tituloParaSalvar)}
                  style={obraAtualSalva ? savedButtonStyle : notifyButtonStyle}
                  aria-pressed={obraAtualSalva}
                >
                  {obraAtualSalva ? "✓ Aviso ativado" : "Avise-me quando lançar"}
                </button>
              )}
            </div>

            {mensagemSalva && (
              <span
                style={
                  desktopLayout ? desktopSavedMessageStyle : savedMessageStyle
                }
              >
                {mensagemSalva}
              </span>
            )}
          </div>
        </section>

        <section
          style={desktopLayout ? desktopSummaryGridStyle : summaryGridStyle}
          aria-label="Resumo de lançamentos"
        >
          <div style={desktopLayout ? desktopSummaryCardStyle : summaryCardStyle}>
            <strong style={summaryNumberStyle}>{obrasEmBreve.length}</strong>
            <span style={summaryLabelStyle}>lançamentos futuros</span>
          </div>

          <div style={desktopLayout ? desktopSummaryCardStyle : summaryCardStyle}>
            <strong style={summaryNumberStyle}>
              {outrasObrasEmBreve.length}
            </strong>
            <span style={summaryLabelStyle}>sugestões abaixo</span>
          </div>
        </section>

        {outrasObrasEmBreve.length > 0 && (
          <section
            style={
              desktopLayout ? desktopRelatedSectionStyle : relatedSectionStyle
            }
          >
            <div style={sectionHeaderStyle}>
              <span style={miniTitleStyle}>LANÇAMENTOS</span>

              <h2 style={sectionTitleStyle}>Fila de estreia</h2>
            </div>

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

                      <span style={relatedAuthorStyle}>por {obra.autor}</span>

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
                            ? "Você será avisado quando sair."
                            : "Abra a página da obra ou salve o lançamento."}
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
                          {obraSalva ? "✓ Salvo" : "Salvar"}
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
          <h2 style={infoTitleStyle}>Como funciona?</h2>

          <p style={infoTextStyle}>
            Quando a história for liberada, ela sai desta tela de Em Breve e
            passa a ter leitura, capítulos e página própria.
          </p>
        </section>
      </section>
    </main>
  );
}

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

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background:
    "radial-gradient(circle at 12% 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent), transparent 31%), radial-gradient(circle at 88% 14%, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent), transparent 24%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 42%, var(--historietas-bg-end, #17101B) 100%)",
  color: "#FFFFFF",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
  boxSizing: "border-box",
};

const containerStyle: CSSProperties = {
  width: "min(860px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "14px 0 74px",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  marginBottom: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const logoStyle: CSSProperties = {
  color: "#FFFFFF",
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
    "linear-gradient(135deg, #F5F3FF 0%, var(--historietas-secondary, #C4B5FD) 42%, var(--historietas-accent, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "0 0 26px color-mix(in srgb, var(--historietas-secondary, #7C3AED) 24%, transparent)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const topActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  minWidth: 0,
  flex: "0 0 auto",
  boxSizing: "border-box",
};

const backButtonStyle: CSSProperties = {
  minHeight: "40px",
  padding: "0 13px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  ...buttonBaseStyle,
};

const topButtonStyle: CSSProperties = {
  minHeight: "40px",
  padding: "0 13px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 16%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)",
  color: "var(--historietas-secondary, #DDD6FE)",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  ...buttonBaseStyle,
};

const heroStyle: CSSProperties = {
  position: "relative",
  borderRadius: "24px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 15%, transparent)",
  background:
    "radial-gradient(circle at 16% 18%, color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent), transparent 30%), radial-gradient(circle at 82% 12%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 50%, transparent), transparent 38%), linear-gradient(135deg, rgba(31,16,52,0.98) 0%, rgba(12,7,23,0.99) 100%)",
  boxShadow:
    "0 14px 34px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.05)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const heroGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.2) 100%)",
  pointerEvents: "none",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "clamp(14px, 4vw, 20px)",
  display: "grid",
  gap: "9px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const badgeRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
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

const topBadgeStyle: CSSProperties = {
  ...badgeStyle,
  flex: "0 0 auto",
  padding: "8px 13px",
  fontSize: "11px",
  letterSpacing: "0.12em",
  whiteSpace: "nowrap",
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
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#E4E4E7",
  fontSize: "12px",
  fontWeight: 950,
  whiteSpace: "normal",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(30px, 8.8vw, 48px)",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.08em",
  maxWidth: "100%",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 48%, var(--historietas-accent, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...safeTextStyle,
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  fontSize: "12.5px",
  lineHeight: 1.48,
  fontWeight: 600,
  maxWidth: "100%",
  ...safeTextStyle,
};

const releaseBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr)",
  gap: "10px",
  padding: "11px",
  borderRadius: "19px",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 13%, transparent) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 10%, transparent) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 22%, transparent)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const releaseIconStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "14px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  flex: "0 0 auto",
  boxSizing: "border-box",
};

const releaseContentStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
};

const releaseLabelStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

const releaseNameStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "clamp(18px, 5.4vw, 22px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

const releaseTextStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  fontSize: "11px",
  lineHeight: 1.4,
  fontWeight: 750,
  ...safeTextStyle,
};

const releaseMetaStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  color: "#A1A1AA",
  fontSize: "10px",
  fontWeight: 850,
  minWidth: 0,
  maxWidth: "100%",
  ...safeTextStyle,
};

const actionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 142px), 1fr))",
  gap: "7px",
  marginTop: "2px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const primaryButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "none",
  padding: "0 12px",
  ...buttonBaseStyle,
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  background: "var(--historietas-secondary, #7C3AED)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "none",
  padding: "0 12px",
  ...buttonBaseStyle,
};

const notifyButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 24%, transparent)",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, transparent) 100%)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
  padding: "0 12px",
  boxShadow: "none",
  ...buttonBaseStyle,
};

const savedButtonStyle: CSSProperties = {
  ...notifyButtonStyle,
  border: "1px solid rgba(34, 197, 94, 0.34)",
  background:
    "linear-gradient(135deg, rgba(34,197,94,0.22) 0%, rgba(22,163,74,0.16) 100%)",
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

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "10px",
  marginTop: "14px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const summaryCardStyle: CSSProperties = {
  borderRadius: "18px",
  background: "rgba(255,255,255,0.052)",
  border: "1px solid rgba(255,255,255,0.075)",
  padding: "11px",
  display: "grid",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
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
  color: "#A1A1AA",
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
  marginTop: "20px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  marginBottom: "10px",
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
    "linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 54%, var(--historietas-accent, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...safeTextStyle,
};

const relatedGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "10px",
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
    "radial-gradient(circle at 96% 18%, color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent), transparent 26%), linear-gradient(135deg, rgba(33,24,50,0.92) 0%, rgba(18,12,30,0.98) 100%)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)",
  color: "#FFFFFF",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
  boxShadow:
    "0 10px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.035)",
};

const relatedCoverLinkStyle: CSSProperties = {
  display: "block",
  textDecoration: "none",
  color: "#FFFFFF",
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
  boxShadow: "inset 0 -34px 52px rgba(0,0,0,0.48)",
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
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const relatedTitleLinkStyle: CSSProperties = {
  color: "#FFFFFF",
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
  color: "#FFFFFF",
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
  border: "1px solid rgba(255,255,255,0.07)",
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
  color: "#D4D4D8",
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
  color: "#A1A1AA",
  fontSize: "10px",
  fontWeight: 850,
  minWidth: 0,
  maxWidth: "100%",
};

const relatedSaveButtonStyle: CSSProperties = {
  minHeight: "31px",
  width: "100%",
  borderRadius: "999px",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent)",
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 12%, transparent) 100%)",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 950,
  cursor: "pointer",
  padding: "0 8px",
  ...buttonBaseStyle,
};

const relatedSavedButtonStyle: CSSProperties = {
  ...relatedSaveButtonStyle,
  border: "1px solid rgba(34, 197, 94, 0.28)",
  background: "rgba(34, 197, 94, 0.14)",
  color: "#86EFAC",
};

const infoBoxStyle: CSSProperties = {
  marginTop: "14px",
  padding: "13px",
  borderRadius: "19px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 7%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 16%, transparent)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const infoTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "19px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const infoTextStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#D4D4D8",
  fontSize: "12px",
  lineHeight: 1.55,
  fontWeight: 650,
  maxWidth: "100%",
  ...safeTextStyle,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "20px 0 76px",
};

const desktopTopStyle: CSSProperties = {
  ...topStyle,
  marginBottom: "18px",
};

const desktopLogoStyle: CSSProperties = {
  ...logoStyle,
  maxWidth: "420px",
};

const desktopTopActionsStyle: CSSProperties = {
  ...topActionsStyle,
  gap: "10px",
};

const desktopTopBadgeStyle: CSSProperties = {
  ...topBadgeStyle,
  padding: "8px 15px",
};

const desktopHeroStyle: CSSProperties = {
  ...heroStyle,
  borderRadius: "34px",
  boxShadow:
    "0 18px 52px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.055)",
};

const desktopHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  padding: "28px",
  gap: "12px",
};

const desktopHeroContentWithReleaseStyle: CSSProperties = {
  ...desktopHeroContentStyle,
  gridTemplateColumns: "minmax(0, 1.12fr) minmax(330px, 0.88fr)",
  alignItems: "center",
  columnGap: "22px",
};

const desktopBadgeRowStyle: CSSProperties = {
  ...badgeRowStyle,
  gridColumn: "1",
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  gridColumn: "1",
  fontSize: "clamp(48px, 4.8vw, 68px)",
  lineHeight: 1.03,
  maxWidth: "680px",
};

const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  gridColumn: "1",
  maxWidth: "620px",
  fontSize: "14px",
  lineHeight: 1.56,
};

const desktopReleaseBoxStyle: CSSProperties = {
  ...releaseBoxStyle,
  gridColumn: "2",
  gridRow: "1 / span 5",
  alignSelf: "stretch",
  gridTemplateColumns: "64px minmax(0, 1fr)",
  gap: "14px",
  padding: "16px",
  borderRadius: "24px",
  background:
    "radial-gradient(circle at 90% 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 18%, transparent), transparent 38%), linear-gradient(135deg, color-mix(in srgb, var(--historietas-accent, #F97316) 12%, transparent) 0%, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 14%, transparent) 100%)",
};

const desktopActionsStyle: CSSProperties = {
  ...actionsStyle,
  gridColumn: "1",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  maxWidth: "620px",
  gap: "8px",
};

const desktopSavedMessageStyle: CSSProperties = {
  ...savedMessageStyle,
  gridColumn: "1",
  textAlign: "left",
};

const desktopSummaryGridStyle: CSSProperties = {
  ...summaryGridStyle,
  marginTop: "18px",
  gap: "14px",
};

const desktopSummaryCardStyle: CSSProperties = {
  ...summaryCardStyle,
  padding: "16px",
  borderRadius: "22px",
};

const desktopRelatedSectionStyle: CSSProperties = {
  ...relatedSectionStyle,
  marginTop: "22px",
};

const desktopRelatedGridStyle: CSSProperties = {
  ...relatedGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
};

const desktopRelatedCardStyle: CSSProperties = {
  ...relatedCardStyle,
  gridTemplateColumns: "minmax(120px, 148px) minmax(0, 1fr)",
  gap: "14px",
  padding: "14px",
  borderRadius: "26px",
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
  gridTemplateColumns: "minmax(0, 1fr) 92px",
  gap: "9px",
};

const desktopInfoBoxStyle: CSSProperties = {
  ...infoBoxStyle,
  marginTop: "18px",
  padding: "18px",
  borderRadius: "24px",
};

