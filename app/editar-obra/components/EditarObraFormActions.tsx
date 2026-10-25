import Link from "next/link";
import type { CSSProperties } from "react";
import { safeTextStyle } from "../styles/editar-obra-shared-styles";

type EditarObraFormActionsProps = {
  isDesktop: boolean;
  processando: boolean;
  salvou: boolean;
  minhaObraHref: string;
  progresso: number;
};

export function EditarObraFormActions({
  isDesktop,
  processando,
  salvou,
  minhaObraHref,
  progresso,
}: EditarObraFormActionsProps) {
  return (
    <>
      <div style={isDesktop ? desktopButtonAreaStyle : buttonAreaStyle}>
        <button
          type="submit"
          style={{
            ...(processando
              ? isDesktop
                ? desktopDisabledButtonStyle
                : disabledButtonStyle
              : isDesktop
                ? desktopSaveButtonStyle
                : saveButtonStyle),
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "7px",
          }}
          disabled={processando}
        >
          {processando ? (
            "Salvando..."
          ) : salvou ? (
            <>
              <span>Atualizada</span>
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{ width: 17, height: 17, flex: "0 0 auto" }}
              >
                <path
                  d="M20 6 9 17l-5-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </>
          ) : (
            "Salvar alterações"
          )}
        </button>

        <Link
          href={minhaObraHref}
          style={isDesktop ? desktopSecondaryButtonStyle : secondaryButtonStyle}
        >
          Ver obra
        </Link>

        <Link
          href="/painel-autor"
          style={isDesktop ? desktopCancelButtonStyle : cancelButtonStyle}
        >
          Cancelar
        </Link>
      </div>

      <div style={isDesktop ? desktopProgressBoxStyle : progressBoxStyle}>
        <div style={progressTopStyle}>
          <span style={progressLabelStyle}>Progresso</span>

          <strong style={progressNumberStyle}>{progresso}%</strong>
        </div>

        <div style={progressTrackStyle}>
          <div style={{ ...progressFillStyle, width: `${progresso}%` }} />
        </div>
      </div>
    </>
  );
}

const progressBoxStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gap: "8px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "0",
  minWidth: 0,
  width: "min(450px, 100%)",
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "none",
};

const progressTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "wrap",
  minWidth: 0,
};

const progressLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 900,
  ...safeTextStyle,
};

const progressNumberStyle: CSSProperties = {
  color:
    "var(--historietas-accent, var(--historietas-editar-obra-accent-soft, #FFFFFF))",
  fontSize: "13px",
  fontWeight: 950,
  ...safeTextStyle,
};

const progressTrackStyle: CSSProperties = {
  height: "7px",
  overflow: "hidden",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  maxWidth: "100%",
};

const progressFillStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background:
    "linear-gradient(90deg, var(--historietas-accent, var(--historietas-editar-obra-accent, #FFFFFF)) 0%, var(--historietas-secondary, var(--historietas-editar-obra-secondary, #A1A1AA)) 100%)",
  transition: "width 0.2s ease",
};

const buttonAreaStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "6px",
  marginTop: "2px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const saveButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-editar-obra-surface, #050505)",
  color: "#FFFFFF",
  fontSize: "11.5px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "none",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 8px",
  lineHeight: 1.05,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

const disabledButtonStyle: CSSProperties = {
  ...saveButtonStyle,
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  boxShadow: "none",
  cursor: "not-allowed",
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-editar-obra-surface, #050505)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "11.5px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 8px",
  lineHeight: 1.05,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

const cancelButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
};

const desktopProgressBoxStyle: CSSProperties = {
  ...progressBoxStyle,
  width: "100%",
  padding: 0,
};

const desktopButtonAreaStyle: CSSProperties = {
  ...buttonAreaStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  justifyContent: "stretch",
  gap: "10px",
  marginTop: "4px",
};

const desktopSaveButtonStyle: CSSProperties = {
  ...saveButtonStyle,
  minHeight: "46px",
  fontSize: "13px",
};

const desktopDisabledButtonStyle: CSSProperties = {
  ...disabledButtonStyle,
  minHeight: "46px",
  fontSize: "13px",
};

const desktopSecondaryButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  minHeight: "46px",
  fontSize: "13px",
};

const desktopCancelButtonStyle: CSSProperties = {
  ...cancelButtonStyle,
  minHeight: "46px",
  fontSize: "13px",
};
