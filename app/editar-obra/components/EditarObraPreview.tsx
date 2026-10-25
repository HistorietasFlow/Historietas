import type { CSSProperties } from "react";
import { criarPreviewCoverStyle } from "../lib/editar-obra-cover-style-utils";
import { safeTextStyle } from "../styles/editar-obra-shared-styles";

type EditarObraPreviewProps = {
  isDesktop: boolean;
  capa: string;
  titulo: string;
  formatoFinal: string;
  classificacaoIndicativa: string;
  autorPreview: string;
  quantidadeCapitulos: number;
  progresso: number;
  generoFinal: string;
  publicado: boolean | undefined;
};

export function EditarObraPreview({
  isDesktop,
  capa,
  titulo,
  formatoFinal,
  classificacaoIndicativa,
  autorPreview,
  quantidadeCapitulos,
  progresso,
  generoFinal,
  publicado,
}: EditarObraPreviewProps) {
  return (
    <aside style={isDesktop ? desktopPreviewPanelStyle : previewPanelStyle}>
      <div style={previewHeaderStyle}>
        <span style={previewMiniTitleStyle}>PRÉVIA DA OBRA</span>
      </div>

      <article style={isDesktop ? desktopPreviewCardStyle : previewCardStyle}>
        <div style={criarPreviewCoverStyle(capa, previewCoverStyle)}>
          <div style={previewCoverGlowStyle} />
        </div>

        <div style={previewContentStyle}>
          <div style={previewTopRowStyle}>
            <h3 style={previewObraTitleStyle}>
              {titulo.trim() ? (
                <span data-historietas-i18n-ignore="true">{titulo.trim()}</span>
              ) : (
                "Obra sem título"
              )}
            </h3>

            <div style={previewBadgesStyle}>
              <span style={previewBadgeStyle}>{formatoFinal || "Formato"}</span>

              <span style={previewRatingBadgeStyle}>
                {classificacaoIndicativa === "Não informada" ||
                classificacaoIndicativa === "Não informado"
                  ? "Livre"
                  : classificacaoIndicativa || "Livre"}
              </span>
            </div>
          </div>

          <p style={previewAuthorStyle}>
            Por{" "}
            {autorPreview ? (
              <span data-historietas-i18n-ignore="true">{autorPreview}</span>
            ) : (
              "Autor não informado"
            )}
          </p>

          <div style={previewStatsStyle}>
            <span style={previewStatItemStyle}>
              <span style={previewStatIconStyle}>👁</span>
              <span style={previewStatValueStyle}>0</span>
            </span>

            <span style={previewStatItemStyle}>
              <span style={previewStatHeartIconStyle}>♥</span>
              <span style={previewStatValueStyle}>0</span>
            </span>

            <span style={previewStatItemStyle}>
              <span style={previewStatIconStyle}>💬</span>
              <span style={previewStatValueStyle}>0</span>
            </span>

            <span style={previewStatItemStyle}>
              <span style={previewStatIconStyle}>📚</span>
              <span style={previewStatValueStyle}>
                {quantidadeCapitulos === 1
                  ? "1 cap."
                  : `${quantidadeCapitulos} cap.`}
              </span>
            </span>
          </div>

          <div style={previewProgressCompactStyle}>
            <div style={previewProgressTrackStyle}>
              <div
                style={{
                  ...previewProgressFillStyle,
                  width: `${progresso}%`,
                }}
              />
            </div>

            <span style={previewProgressTextStyle}>{progresso}% pronto</span>
          </div>

          <div style={previewActionRowStyle}>
            <span style={previewGenreBadgeStyle}>{generoFinal || "Gênero"}</span>

            <span style={previewActionBadgeStyle}>
              {publicado ? "Publicado" : "Rascunho"}
            </span>
          </div>
        </div>
      </article>
    </aside>
  );
}

const previewPanelStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: 0,
  background: "transparent",
  border: "none",
  borderRadius: 0,
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const previewHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  justifyItems: "center",
  textAlign: "center",
  minWidth: 0,
};

const previewMiniTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  fontSize: "19px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  textAlign: "center",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const previewCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(88px, 98px) minmax(0, 1fr)",
  alignItems: "stretch",
  gap: "14px",
  padding: "11px",
  borderRadius: "22px",
  background: "var(--historietas-editar-obra-panel, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

const desktopPreviewCardStyle: CSSProperties = {
  ...previewCardStyle,
  gridTemplateColumns: "132px minmax(0, 1fr)",
  gap: "18px",
  padding: "14px",
  borderRadius: "22px",
};

const previewCoverGlowStyle: CSSProperties = {
  display: "none",
};

const previewCoverStyle: CSSProperties = {
  width: "100%",
  minHeight: "116px",
  height: "100%",
  maxHeight: "none",
  maxWidth: "100%",
  alignSelf: "stretch",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  background: "var(--historietas-editar-obra-bg-deep, #000000)",
  backgroundImage:
    "linear-gradient(135deg, var(--historietas-editar-obra-surface, #050505) 0%, var(--historietas-editar-obra-bg-deep, #000000) 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  border: "1px solid rgba(255,255,255,0.08)",
  minWidth: 0,
  boxSizing: "border-box",
  flex: "0 0 auto",
  boxShadow: "none",
};

const previewContentStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const previewBadgesStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  rowGap: "5px",
  minWidth: 0,
  maxWidth: "100%",
};

const previewBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const previewRatingBadgeStyle: CSSProperties = {
  ...previewBadgeStyle,
  color: "var(--historietas-text-primary, #FFFFFF)",
};

const previewObraTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "20px",
  lineHeight: 1.05,
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 500,
  letterSpacing: "-0.01em",
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textDecoration: "none",
  borderBottom: "none",
  ...safeTextStyle,
};

const previewAuthorStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  margin: 0,
  color:
    "var(--historietas-text-secondary, var(--historietas-editar-obra-author-text, #D4D4D8))",
  fontSize: "12px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 450,
  lineHeight: 1.25,
  textDecoration: "none",
  borderBottom: "none",
  ...safeTextStyle,
};

const previewTopRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

const previewStatsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 850,
  maxWidth: "100%",
  minWidth: 0,
};

const previewStatItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  whiteSpace: "nowrap",
  lineHeight: 1,
};

const previewStatIconStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  flex: "0 0 auto",
};

const previewStatHeartIconStyle: CSSProperties = {
  ...previewStatIconStyle,
  color: "var(--historietas-editar-obra-heart, #E11D48)",
};

const previewStatValueStyle: CSSProperties = {
  display: "inline-block",
  lineHeight: 1,
  whiteSpace: "nowrap",
};

const previewProgressCompactStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "8px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const previewProgressTrackStyle: CSSProperties = {
  width: "100%",
  height: "7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
  boxSizing: "border-box",
};

const previewProgressFillStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background:
    "linear-gradient(90deg, var(--historietas-accent, var(--historietas-editar-obra-accent, #FFFFFF)) 0%, var(--historietas-secondary, var(--historietas-editar-obra-secondary, #A1A1AA)) 100%)",
};

const previewProgressTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

const previewActionRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "2px",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
  boxSizing: "border-box",
};

const previewGenreBadgeStyle: CSSProperties = {
  flex: "0 1 42%",
  maxWidth: "42%",
  minHeight: "34px",
  padding: "0 10px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: 1.12,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const previewActionBadgeStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  maxWidth: "100%",
  minHeight: "34px",
  padding: "0 12px",
  borderRadius: "999px",
  background: "var(--historietas-editar-obra-surface, #050505)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1.15,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  textAlign: "center",
  ...safeTextStyle,
};

const desktopPreviewPanelStyle: CSSProperties = {
  ...previewPanelStyle,
  position: "static",
  top: "auto",
  alignSelf: "stretch",
  width: "100%",
  maxWidth: "760px",
  margin: "0 auto",
};
