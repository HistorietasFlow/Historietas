import type { CSSProperties } from "react";

export const termosPageCss = `
  [data-historietas-termos-root="true"] {
    --termos-card: color-mix(in srgb, var(--historietas-surface, #120C1E) 88%, transparent);
    --termos-card-strong: color-mix(in srgb, var(--historietas-surface-strong, #120C1E) 95%, transparent);
    --termos-control: color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent);
    --termos-control-hover: color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 12%, transparent);
    --termos-border: var(--historietas-border-soft, rgba(255,255,255,0.10));
    --termos-muted: var(--historietas-text-secondary, #D4D4D8);
  }

  [data-historietas-termos-root="true"] .termos-document-link {
    min-height: 210px;
    border: 1px solid var(--termos-border);
    border-radius: 20px;
    padding: 17px;
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr) 30px;
    align-items: start;
    gap: 13px;
    background: var(--termos-card);
    color: inherit;
    text-decoration: none;
    transition:
      transform 160ms ease,
      background 160ms ease,
      border-color 160ms ease;
  }

  [data-historietas-termos-root="true"] .termos-document-link:hover {
    transform: translateY(-2px);
    background: var(--termos-card-strong);
    border-color: color-mix(
      in srgb,
      var(--historietas-secondary, #7C3AED) 65%,
      var(--termos-border)
    );
  }

  [data-historietas-termos-root="true"] .termos-document-link:focus-visible,
  [data-historietas-termos-root="true"] .termos-quick-link:focus-visible {
    outline: 3px solid color-mix(
      in srgb,
      var(--historietas-accent, #F97316) 70%,
      transparent
    );
    outline-offset: 3px;
  }

  [data-historietas-termos-root="true"] .termos-document-icon {
    width: 48px;
    height: 48px;
    border-radius: 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: color-mix(
      in srgb,
      var(--historietas-secondary, #7C3AED) 22%,
      var(--termos-control)
    );
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-termos-root="true"] .termos-document-copy {
    min-width: 0;
    display: grid;
    gap: 8px;
  }

  [data-historietas-termos-root="true"] .termos-document-copy > strong {
    color: var(--historietas-text-primary, #FFFFFF);
    font-size: 18px;
    line-height: 1.12;
    font-weight: 880;
    letter-spacing: -0.025em;
  }

  [data-historietas-termos-root="true"] .termos-document-description {
    color: var(--termos-muted);
    font-size: 13px;
    line-height: 1.5;
    font-weight: 550;
    overflow-wrap: anywhere;
  }

  [data-historietas-termos-root="true"] .termos-document-topics {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 3px;
  }

  [data-historietas-termos-root="true"] .termos-topic-chip {
    min-height: 27px;
    border: 1px solid var(--termos-border);
    border-radius: 999px;
    padding: 6px 9px;
    display: inline-flex;
    align-items: center;
    background: var(--termos-control);
    color: var(--termos-muted);
    font-size: 10px;
    line-height: 1;
    font-weight: 760;
  }

  [data-historietas-termos-root="true"] .termos-document-arrow {
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--termos-muted);
    transition: transform 160ms ease;
  }

  [data-historietas-termos-root="true"] .termos-document-link:hover .termos-document-arrow {
    transform: translateX(2px);
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-termos-root="true"] .termos-principle-card {
    min-height: 138px;
    border: 1px solid var(--termos-border);
    border-radius: 17px;
    padding: 14px;
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr);
    align-items: start;
    gap: 11px;
    background: var(--termos-card);
  }

  [data-historietas-termos-root="true"] .termos-principle-icon,
  [data-historietas-termos-root="true"] .termos-quick-icon {
    width: 42px;
    height: 42px;
    border-radius: 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--termos-control);
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-termos-root="true"] .termos-principle-copy,
  [data-historietas-termos-root="true"] .termos-step-copy {
    min-width: 0;
    display: grid;
    gap: 5px;
  }

  [data-historietas-termos-root="true"] .termos-principle-copy h3,
  [data-historietas-termos-root="true"] .termos-step-copy h3 {
    margin: 0;
    color: var(--historietas-text-primary, #FFFFFF);
    font-size: 14px;
    line-height: 1.2;
    font-weight: 820;
  }

  [data-historietas-termos-root="true"] .termos-principle-copy p,
  [data-historietas-termos-root="true"] .termos-step-copy p {
    margin: 0;
    color: var(--termos-muted);
    font-size: 12px;
    line-height: 1.48;
    font-weight: 550;
    overflow-wrap: anywhere;
  }

  [data-historietas-termos-root="true"] .termos-step-card {
    min-height: 126px;
    border: 1px solid var(--termos-border);
    border-radius: 17px;
    padding: 14px;
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr);
    align-items: start;
    gap: 11px;
    background: var(--termos-card);
  }

  [data-historietas-termos-root="true"] .termos-step-number {
    width: 38px;
    height: 38px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--historietas-secondary, #7C3AED);
    color: #FFFFFF;
    font-size: 14px;
    line-height: 1;
    font-weight: 900;
  }

  [data-historietas-termos-root="true"] .termos-quick-link {
    min-height: 76px;
    border: 1px solid var(--termos-border);
    border-radius: 16px;
    padding: 12px;
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr) 26px;
    align-items: center;
    gap: 10px;
    background: var(--termos-card);
    color: inherit;
    text-decoration: none;
    transition: transform 160ms ease, background 160ms ease;
  }

  [data-historietas-termos-root="true"] .termos-quick-link:hover {
    transform: translateY(-1px);
    background: var(--termos-control-hover);
  }

  [data-historietas-termos-root="true"] .termos-quick-copy {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  [data-historietas-termos-root="true"] .termos-quick-copy strong {
    color: var(--historietas-text-primary, #FFFFFF);
    font-size: 14px;
    line-height: 1.15;
    font-weight: 820;
  }

  [data-historietas-termos-root="true"] .termos-quick-copy span {
    color: var(--termos-muted);
    font-size: 12px;
    line-height: 1.35;
    font-weight: 550;
  }

  [data-historietas-termos-root="true"] .termos-quick-arrow {
    width: 26px;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--termos-muted);
  }

  html[data-historietas-tema-visual="foco"] [data-historietas-termos-root="true"] {
    --termos-card: #050505;
    --termos-card-strong: #000000;
    --termos-control: rgba(255,255,255,0.08);
    --termos-control-hover: rgba(255,255,255,0.10);
    --termos-border: rgba(255,255,255,0.18);
    --termos-muted: #A1A1AA;
  }

  html[data-historietas-tema-visual="foco"] [data-historietas-termos-root="true"] .termos-document-link:hover {
    border-color: #FFFFFF;
  }

  html[data-historietas-tema-visual="foco"] [data-historietas-termos-root="true"] .termos-step-number {
    background: #FFFFFF;
    color: #000000;
  }

  @media (max-width: 620px) {
    [data-historietas-termos-root="true"] .termos-document-link {
      min-height: 0;
      grid-template-columns: 44px minmax(0, 1fr) 26px;
      padding: 14px;
    }

    [data-historietas-termos-root="true"] .termos-document-icon {
      width: 44px;
      height: 44px;
      border-radius: 14px;
    }

    [data-historietas-termos-root="true"] .termos-document-copy > strong {
      font-size: 16px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [data-historietas-termos-root="true"] *,
    [data-historietas-termos-root="true"] *::before,
    [data-historietas-termos-root="true"] *::after {
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

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
  width: "min(920px, calc(100% - 32px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "16px 0 124px",
  boxSizing: "border-box",
};

export const headerStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr)",
  alignItems: "center",
  gap: "11px",
  marginBottom: "17px",
};

export const backButtonStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent)",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
};

export const headerTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "2px",
};

export const eyebrowStyle: CSSProperties = {
  color: "var(--historietas-secondary, #7C3AED)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: "0.16em",
};

export const pageTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(21px, 5vw, 27px)",
  lineHeight: 1.08,
  fontWeight: 900,
  letterSpacing: "-0.04em",
};

export const heroStyle: CSSProperties = {
  borderRadius: "24px",
  padding: "clamp(18px, 4vw, 28px)",
  display: "grid",
  gridTemplateColumns: "50px minmax(0, 1fr)",
  alignItems: "start",
  gap: "13px",
  background:
    "linear-gradient(145deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 26%, var(--historietas-surface-strong, #120C1E)) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, var(--historietas-surface-strong, #120C1E)) 100%)",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  marginBottom: "27px",
};

export const heroIconStyle: CSSProperties = {
  width: "50px",
  height: "50px",
  borderRadius: "16px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.10)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

export const heroTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  alignContent: "center",
  gap: "8px",
};

export const heroBadgeStyle: CSSProperties = {
  width: "fit-content",
  minHeight: "28px",
  borderRadius: "999px",
  padding: "6px 9px",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  background:
    "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 9%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 12%, transparent)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 800,
};

export const heroTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(24px, 6vw, 38px)",
  lineHeight: 1.02,
  fontWeight: 900,
  letterSpacing: "-0.055em",
};

export const heroDescriptionStyle: CSSProperties = {
  margin: 0,
  maxWidth: "700px",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  lineHeight: 1.5,
  fontWeight: 560,
};

export const sectionStyle: CSSProperties = {
  marginBottom: "28px",
};

export const quickAccessSectionStyle: CSSProperties = {
  marginTop: "28px",
};

export const sectionHeadingStyle: CSSProperties = {
  display: "flex",
  alignItems: "end",
  justifyContent: "space-between",
  gap: "14px",
  marginBottom: "12px",
};

export const sectionKickerStyle: CSSProperties = {
  display: "block",
  marginBottom: "4px",
  color: "var(--historietas-secondary, #7C3AED)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: "0.14em",
};

export const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(18px, 4.5vw, 22px)",
  lineHeight: 1.1,
  fontWeight: 870,
  letterSpacing: "-0.035em",
};

export const documentsCountStyle: CSSProperties = {
  flex: "0 0 auto",
  padding: "7px 10px",
  borderRadius: "999px",
  background:
    "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 7%, transparent)",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 760,
};

export const documentsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(270px, 100%), 1fr))",
  gap: "11px",
};

export const principlesGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
  gap: "10px",
};

export const stepsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(230px, 100%), 1fr))",
  gap: "10px",
};

export const noticeStyle: CSSProperties = {
  borderRadius: "18px",
  padding: "15px",
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr)",
  alignItems: "start",
  gap: "12px",
  background:
    "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 12%, var(--historietas-surface, #120C1E))",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
};

export const noticeIconStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "13px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

export const noticeTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "5px",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.45,
};

export const quickAccessGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
  gap: "10px",
};
