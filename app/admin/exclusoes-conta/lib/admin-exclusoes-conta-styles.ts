import type { CSSProperties } from "react";

export const adminExclusoesCss = `
  [data-historietas-admin-exclusoes-root="true"] {
    --admin-delete-card: color-mix(
      in srgb,
      var(--historietas-surface, #120C1E) 92%,
      transparent
    );
    --admin-delete-border: var(
      --historietas-border-soft,
      rgba(255, 255, 255, 0.11)
    );
  }

  [data-historietas-admin-exclusoes-root="true"] .admin-delete-search-input {
    width: 100%;
    min-width: 0;
    min-height: 46px;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--historietas-text-primary, #FFFFFF);
    font: inherit;
    font-size: 13px;
    font-weight: 650;
  }

  [data-historietas-admin-exclusoes-root="true"]
    .admin-delete-search-input::placeholder {
    color: var(--historietas-text-secondary, #A1A1AA);
    opacity: 0.75;
  }

  [data-historietas-admin-exclusoes-root="true"] .admin-delete-card-summary {
    width: 100%;
    border: 0;
    padding: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 14px;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  [data-historietas-admin-exclusoes-root="true"]
    .admin-delete-primary-button {
    min-height: 40px;
    border: 0;
    border-radius: 12px;
    padding: 9px 14px;
    background: var(--historietas-secondary, #7C3AED);
    color: #FFFFFF;
    font: inherit;
    font-size: 12px;
    font-weight: 850;
    cursor: pointer;
  }

  [data-historietas-admin-exclusoes-root="true"]
    .admin-delete-primary-button:disabled {
    opacity: 0.52;
    cursor: not-allowed;
  }

  .admin-delete-loader {
    width: 26px;
    height: 26px;
    border: 3px solid rgba(255, 255, 255, 0.18);
    border-top-color: var(--historietas-secondary, #7C3AED);
    border-radius: 999px;
    animation: admin-delete-spin 700ms linear infinite;
  }

  @keyframes admin-delete-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 760px) {
    [data-historietas-admin-exclusoes-root="true"]
      .admin-delete-card-summary {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [data-historietas-admin-exclusoes-root="true"] *,
    [data-historietas-admin-exclusoes-root="true"] *::before,
    [data-historietas-admin-exclusoes-root="true"] *::after {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
    }
  }
`;

export const recoverySectionStyle: CSSProperties = {
  display: "grid",
  gap: 14,
  padding: 18,
  borderRadius: 18,
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
  background: "color-mix(in srgb, var(--historietas-surface, #120C1E) 94%, transparent)",
};

export const recoveryHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap",
};

export const recoveryTitleStyle: CSSProperties = {
  margin: "5px 0 0",
  fontSize: 20,
  lineHeight: 1.2,
};

export const recoveryDescriptionStyle: CSSProperties = {
  margin: "7px 0 0",
  maxWidth: 820,
  color: "var(--historietas-text-secondary, #C9C3D3)",
  fontSize: 13,
  lineHeight: 1.6,
};

export const recoveryCountStyle: CSSProperties = {
  minWidth: 42,
  height: 42,
  display: "grid",
  placeItems: "center",
  borderRadius: 999,
  background: "rgba(245, 158, 11, 0.14)",
  border: "1px solid rgba(245, 158, 11, 0.34)",
  color: "#FBBF24",
  fontSize: 16,
};

export const recoveryEmptyStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 14,
  background: "rgba(74, 222, 128, 0.08)",
  border: "1px solid rgba(74, 222, 128, 0.2)",
  color: "var(--historietas-text-secondary, #C9C3D3)",
  fontSize: 13,
};

export const recoveryListStyle: CSSProperties = {
  display: "grid",
  gap: 12,
};

export const recoveryCardStyle: CSSProperties = {
  display: "grid",
  gap: 13,
  padding: 15,
  borderRadius: 15,
  background: "rgba(255,255,255,0.025)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.11))",
};

export const recoveryCardTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

export const operationIdStyle: CSSProperties = {
  display: "block",
  marginTop: 5,
  color: "var(--historietas-text-secondary, #C9C3D3)",
  fontSize: 11,
  overflowWrap: "anywhere",
};

export const recoveryMetaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 10,
};

export const recoveryDetailStyle: CSSProperties = {
  display: "grid",
  gap: 5,
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.025)",
  fontSize: 12,
};

export const recoveryErrorStyle: CSSProperties = {
  display: "grid",
  gap: 5,
  padding: "11px 12px",
  borderRadius: 12,
  background: "rgba(251, 113, 133, 0.08)",
  border: "1px solid rgba(251, 113, 133, 0.2)",
  color: "var(--historietas-text-secondary, #E4DDEB)",
  fontSize: 12,
  lineHeight: 1.5,
};

export const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "var(--historietas-page-background, #070212)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily:
    "Inter, Poppins, Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

export const containerStyle: CSSProperties = {
  width: "min(1080px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "22px 0 120px",
  boxSizing: "border-box",
};

export const stateCardStyle: CSSProperties = {
  minHeight: "240px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.1))",
  borderRadius: "22px",
  padding: "24px",
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: "14px",
  background: "var(--historietas-surface, #120C1E)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textAlign: "center",
};

export const stateDescriptionStyle: CSSProperties = {
  maxWidth: "560px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  lineHeight: 1.6,
};

export const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "18px",
  flexWrap: "wrap",
};

export const headerCopyStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "720px",
  display: "grid",
  gap: "6px",
};

export const eyebrowStyle: CSSProperties = {
  color: "var(--historietas-secondary, #A78BFA)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.16em",
};

export const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(26px, 5vw, 42px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.05em",
};

export const subtitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #C4B5FD)",
  fontSize: "13px",
  lineHeight: 1.55,
  fontWeight: 560,
};

export const headerActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "9px",
  flexWrap: "wrap",
};

export const secondaryLinkStyle: CSSProperties = {
  minHeight: "40px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  borderRadius: "12px",
  padding: "9px 14px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.05)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 820,
};

export const warningStyle: CSSProperties = {
  marginBottom: "14px",
  border: "1px solid rgba(245,158,11,0.3)",
  borderRadius: "16px",
  padding: "13px 14px",
  display: "grid",
  gap: "5px",
  background: "rgba(120,53,15,0.14)",
  color: "#FDE68A",
  fontSize: "11px",
  lineHeight: 1.55,
};

export const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(126px, 1fr))",
  gap: "10px",
  marginBottom: "14px",
};

export const summaryCardStyle: CSSProperties = {
  minHeight: "84px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.1))",
  borderRadius: "16px",
  padding: "13px",
  display: "grid",
  alignContent: "center",
  gap: "4px",
  background: "var(--historietas-surface, #120C1E)",
};

export const summaryNumberStyle: CSSProperties = {
  fontSize: "24px",
  lineHeight: 1,
  fontWeight: 950,
};

export const summaryLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 780,
};

export const filtersStyle: CSSProperties = {
  marginBottom: "14px",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(180px, 240px)",
  gap: "10px",
};

export const searchStyle: CSSProperties = {
  minHeight: "48px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.1))",
  borderRadius: "14px",
  padding: "0 13px",
  display: "grid",
  gridTemplateColumns: "22px minmax(0, 1fr)",
  alignItems: "center",
  gap: "8px",
  background: "var(--historietas-surface, #120C1E)",
  color: "var(--historietas-text-secondary, #A1A1AA)",
};

export const selectFilterStyle: CSSProperties = {
  minHeight: "48px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.1))",
  borderRadius: "14px",
  padding: "0 12px",
  outline: "none",
  background: "var(--historietas-surface, #120C1E)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  font: "inherit",
  fontSize: "12px",
  fontWeight: 750,
};

export const errorBannerStyle: CSSProperties = {
  marginBottom: "12px",
  border: "1px solid rgba(251,113,133,0.35)",
  borderRadius: "14px",
  padding: "11px 13px",
  background: "rgba(190,24,93,0.14)",
  color: "#FDA4AF",
  fontSize: "11px",
  fontWeight: 760,
  lineHeight: 1.45,
};

export const successBannerStyle: CSSProperties = {
  marginBottom: "12px",
  border: "1px solid rgba(74,222,128,0.32)",
  borderRadius: "14px",
  padding: "11px 13px",
  background: "rgba(22,101,52,0.16)",
  color: "#86EFAC",
  fontSize: "11px",
  fontWeight: 760,
  lineHeight: 1.45,
};

export const resultsHeaderStyle: CSSProperties = {
  margin: "0 2px 10px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
};

export const emptyStyle: CSSProperties = {
  minHeight: "180px",
  border: "1px dashed var(--historietas-border-soft, rgba(255,255,255,0.14))",
  borderRadius: "20px",
  padding: "22px",
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: "7px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  textAlign: "center",
};

export const listStyle: CSSProperties = {
  display: "grid",
  gap: "11px",
};

export const cardStyle: CSSProperties = {
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.1))",
  borderRadius: "19px",
  padding: "15px",
  background: "var(--historietas-surface, #120C1E)",
  overflow: "hidden",
};

export const cardHeadingStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "8px",
};

export const badgesStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  flexWrap: "wrap",
};

export const badgeStyle: CSSProperties = {
  minHeight: "23px",
  border: "1px solid",
  borderRadius: "999px",
  padding: "4px 8px",
  display: "inline-flex",
  alignItems: "center",
  fontSize: "9px",
  fontWeight: 900,
};

export const sourceBadgeStyle: CSSProperties = {
  ...badgeStyle,
  borderColor: "rgba(167,139,250,0.35)",
  color: "#C4B5FD",
};

export const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "17px",
  lineHeight: 1.25,
  fontWeight: 900,
  overflowWrap: "anywhere",
};

export const cardDescriptionPreviewStyle: CSSProperties = {
  margin: 0,
  maxWidth: "780px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  lineHeight: 1.5,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

export const cardMetaStyle: CSSProperties = {
  display: "grid",
  justifyItems: "end",
  alignContent: "center",
  gap: "5px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  fontWeight: 730,
  whiteSpace: "nowrap",
};

export const detailsStyle: CSSProperties = {
  marginTop: "15px",
  paddingTop: "15px",
  borderTop: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  display: "grid",
  gap: "14px",
};

export const detailGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "8px",
};

export const detailItemStyle: CSSProperties = {
  minWidth: 0,
  borderRadius: "12px",
  padding: "10px",
  display: "grid",
  gap: "4px",
  background: "rgba(255,255,255,0.035)",
  overflowWrap: "anywhere",
};

export const detailLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  fontWeight: 850,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
};

export const contentBoxStyle: CSSProperties = {
  borderRadius: "14px",
  padding: "12px",
  display: "grid",
  gap: "7px",
  background: "rgba(255,255,255,0.035)",
};

export const fullDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 560,
  lineHeight: 1.62,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

export const environmentStyle: CSSProperties = {
  borderRadius: "14px",
  padding: "12px",
  display: "grid",
  gap: "7px",
  background: "rgba(255,255,255,0.025)",
};

export const environmentValueStyle: CSSProperties = {
  minWidth: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  lineHeight: 1.5,
  overflowWrap: "anywhere",
};

export const controlsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  gap: "10px",
};

export const fieldStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
};

export const fieldLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 820,
};

export const fieldControlStyle: CSSProperties = {
  width: "100%",
  minHeight: "42px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  borderRadius: "12px",
  padding: "0 11px",
  outline: "none",
  background: "rgba(255,255,255,0.05)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  font: "inherit",
  fontSize: "12px",
  fontWeight: 750,
};

export const statusHelpStyle: CSSProperties = {
  borderRadius: "12px",
  padding: "10px 11px",
  display: "grid",
  gap: "4px",
  alignContent: "center",
  background: "rgba(255,255,255,0.03)",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  lineHeight: 1.5,
};

export const finalWarningStyle: CSSProperties = {
  border: "1px solid rgba(251,113,133,0.28)",
  borderRadius: "13px",
  padding: "11px 12px",
  display: "grid",
  gap: "4px",
  background: "rgba(159,18,57,0.12)",
  color: "#FDA4AF",
  fontSize: "10px",
  lineHeight: 1.5,
};

export const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "126px",
  resize: "vertical",
  boxSizing: "border-box",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  borderRadius: "13px",
  padding: "11px 12px",
  outline: "none",
  background: "rgba(255,255,255,0.045)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  font: "inherit",
  fontSize: "12px",
  lineHeight: 1.52,
};

export const counterStyle: CSSProperties = {
  justifySelf: "end",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  fontWeight: 700,
};

export const cardActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "10px",
  flexWrap: "wrap",
};

export const unsavedStyle: CSSProperties = {
  color: "#FDE68A",
  fontSize: "10px",
  fontWeight: 760,
};
