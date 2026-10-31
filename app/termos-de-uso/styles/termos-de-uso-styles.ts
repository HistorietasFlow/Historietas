import type { CSSProperties } from "react";

export const termosUsoCss = `
  [data-historietas-termos-uso-root="true"] {
    --termos-uso-card: color-mix(
      in srgb,
      var(--historietas-surface, #120C1E) 90%,
      transparent
    );
    --termos-uso-card-strong: color-mix(
      in srgb,
      var(--historietas-surface-strong, #120C1E) 96%,
      transparent
    );
    --termos-uso-control: color-mix(
      in srgb,
      var(--historietas-text-primary, #FFFFFF) 8%,
      transparent
    );
    --termos-uso-control-hover: color-mix(
      in srgb,
      var(--historietas-text-primary, #FFFFFF) 12%,
      transparent
    );
    --termos-uso-border: var(
      --historietas-border-soft,
      rgba(255,255,255,0.10)
    );
    --termos-uso-muted: var(
      --historietas-text-secondary,
      #D4D4D8
    );
    scroll-behavior: smooth;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-highlight {
    min-height: 130px;
    border: 1px solid var(--termos-uso-border);
    border-radius: 17px;
    padding: 14px;
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr);
    align-items: start;
    gap: 11px;
    background: var(--termos-uso-card);
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-highlight-icon {
    width: 42px;
    height: 42px;
    border-radius: 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--termos-uso-control);
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-highlight-copy {
    min-width: 0;
    display: grid;
    gap: 5px;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-highlight-copy h3 {
    margin: 0;
    color: var(--historietas-text-primary, #FFFFFF);
    font-size: 14px;
    line-height: 1.2;
    font-weight: 830;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-highlight-copy p {
    margin: 0;
    color: var(--termos-uso-muted);
    font-size: 12px;
    line-height: 1.48;
    font-weight: 550;
    overflow-wrap: anywhere;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-toc-link {
    min-height: 42px;
    border-radius: 11px;
    padding: 8px 9px;
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    color: var(--termos-uso-muted);
    text-decoration: none;
    transition: background 150ms ease, color 150ms ease;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-toc-link:hover {
    background: var(--termos-uso-control);
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-toc-link:focus-visible,
  [data-historietas-termos-uso-root="true"] .termos-uso-inline-link:focus-visible,
  [data-historietas-termos-uso-root="true"] .termos-uso-primary-link:focus-visible {
    outline: 3px solid color-mix(
      in srgb,
      var(--historietas-accent, #F97316) 70%,
      transparent
    );
    outline-offset: 3px;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-toc-link > span {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--termos-uso-control);
    color: inherit;
    font-size: 10px;
    line-height: 1;
    font-weight: 900;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-toc-link strong {
    min-width: 0;
    font-size: 11px;
    line-height: 1.25;
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section {
    scroll-margin-top: 16px;
    border: 1px solid var(--termos-uso-border);
    border-radius: 21px;
    padding: clamp(16px, 4vw, 23px);
    background: var(--termos-uso-card);
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section-header {
    display: grid;
    grid-template-columns: 47px minmax(0, 1fr);
    align-items: start;
    gap: 12px;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--termos-uso-border);
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section-icon {
    width: 47px;
    height: 47px;
    border-radius: 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: color-mix(
      in srgb,
      var(--historietas-secondary, #7C3AED) 20%,
      var(--termos-uso-control)
    );
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section-heading {
    min-width: 0;
    display: grid;
    gap: 5px;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section-heading > span {
    color: var(--historietas-secondary, #7C3AED);
    font-size: 9px;
    line-height: 1;
    font-weight: 900;
    letter-spacing: 0.13em;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section-heading h2 {
    margin: 0;
    color: var(--historietas-text-primary, #FFFFFF);
    font-size: clamp(18px, 4.7vw, 23px);
    line-height: 1.12;
    font-weight: 870;
    letter-spacing: -0.035em;
    overflow-wrap: anywhere;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section-heading p {
    margin: 0;
    color: var(--termos-uso-muted);
    font-size: 12px;
    line-height: 1.42;
    font-weight: 570;
    overflow-wrap: anywhere;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section-content {
    padding-top: 16px;
    display: grid;
    gap: 12px;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section-content > p {
    margin: 0;
    color: var(--termos-uso-muted);
    font-size: 14px;
    line-height: 1.68;
    font-weight: 520;
    overflow-wrap: anywhere;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section-content > ul {
    margin: 2px 0 0;
    padding: 0;
    display: grid;
    gap: 9px;
    list-style: none;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-section-content > ul > li {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr);
    align-items: start;
    gap: 9px;
    color: var(--termos-uso-muted);
    font-size: 13px;
    line-height: 1.52;
    font-weight: 550;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-list-check {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: color-mix(
      in srgb,
      var(--historietas-secondary, #7C3AED) 18%,
      var(--termos-uso-control)
    );
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-inline-link {
    width: fit-content;
    min-height: 38px;
    border-radius: 11px;
    padding: 8px 11px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: var(--termos-uso-control);
    border: 1px solid var(--termos-uso-border);
    color: var(--historietas-text-primary, #FFFFFF);
    text-decoration: none;
    font-size: 12px;
    line-height: 1;
    font-weight: 760;
    transition: background 150ms ease, transform 150ms ease;
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-inline-link:hover {
    background: var(--termos-uso-control-hover);
    transform: translateY(-1px);
  }

  [data-historietas-termos-uso-root="true"] .termos-uso-primary-link {
    width: fit-content;
    min-height: 42px;
    border-radius: 12px;
    padding: 10px 13px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--historietas-secondary, #7C3AED);
    color: #FFFFFF;
    text-decoration: none;
    font-size: 13px;
    line-height: 1;
    font-weight: 820;
  }

  html[data-historietas-tema-visual="foco"]
  [data-historietas-termos-uso-root="true"] {
    --termos-uso-card: #050505;
    --termos-uso-card-strong: #000000;
    --termos-uso-control: rgba(255,255,255,0.08);
    --termos-uso-control-hover: rgba(255,255,255,0.12);
    --termos-uso-border: rgba(255,255,255,0.18);
    --termos-uso-muted: #C4C4C8;
  }

  html[data-historietas-tema-visual="foco"]
  [data-historietas-termos-uso-root="true"] .termos-uso-section-icon,
  html[data-historietas-tema-visual="foco"]
  [data-historietas-termos-uso-root="true"] .termos-uso-list-check {
    background: rgba(255,255,255,0.10);
  }

  html[data-historietas-tema-visual="foco"]
  [data-historietas-termos-uso-root="true"] .termos-uso-primary-link {
    background: #FFFFFF;
    color: #000000;
  }

  @media (max-width: 780px) {
    [data-historietas-termos-uso-root="true"] .termos-uso-section {
      scroll-margin-top: 12px;
    }
  }

  @media (max-width: 780px) {
    [data-historietas-termos-uso-root="true"] .termos-uso-content-layout {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 620px) {
    [data-historietas-termos-uso-root="true"] .termos-uso-section-header {
      grid-template-columns: 43px minmax(0, 1fr);
      gap: 10px;
    }

    [data-historietas-termos-uso-root="true"] .termos-uso-section-icon {
      width: 43px;
      height: 43px;
      border-radius: 14px;
    }

    [data-historietas-termos-uso-root="true"] .termos-uso-section-content > p {
      font-size: 13px;
      line-height: 1.63;
    }
  }

  @media (max-width: 780px) {
    [data-historietas-termos-uso-root="true"] {
      scroll-padding-top: 12px;
    }
  }

  @media (max-width: 780px) {
    [data-historietas-termos-uso-root="true"] .termos-uso-toc-link {
      min-height: 40px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [data-historietas-termos-uso-root="true"],
    [data-historietas-termos-uso-root="true"] *,
    [data-historietas-termos-uso-root="true"] *::before,
    [data-historietas-termos-uso-root="true"] *::after {
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
  width: "min(980px, calc(100% - 32px))",
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
    "linear-gradient(145deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 26%, var(--historietas-surface-strong, #120C1E)) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 9%, var(--historietas-surface-strong, #120C1E)) 100%)",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  marginBottom: "13px",
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
  maxWidth: "720px",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  lineHeight: 1.5,
  fontWeight: 560,
};

export const updatedAtStyle: CSSProperties = {
  width: "fit-content",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.2,
  fontWeight: 590,
};

export const importantNoticeStyle: CSSProperties = {
  borderRadius: "18px",
  padding: "14px",
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr)",
  alignItems: "start",
  gap: "11px",
  background:
    "color-mix(in srgb, var(--historietas-accent, #F97316) 11%, var(--historietas-surface, #120C1E))",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  marginBottom: "27px",
};

export const importantNoticeIconStyle: CSSProperties = {
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

export const importantNoticeTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "5px",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.45,
};

export const highlightsSectionStyle: CSSProperties = {
  marginBottom: "28px",
};

export const sectionHeadingStyle: CSSProperties = {
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

export const highlightsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(235px, 100%), 1fr))",
  gap: "10px",
};

export const contentLayoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(210px, 250px) minmax(0, 1fr)",
  alignItems: "start",
  gap: "14px",
};

export const tableOfContentsStyle: CSSProperties = {
  position: "sticky",
  top: "14px",
  maxHeight: "calc(100vh - 28px)",
  overflowY: "auto",
  borderRadius: "18px",
  padding: "13px",
  background:
    "color-mix(in srgb, var(--historietas-surface, #120C1E) 90%, transparent)",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
};

export const tocLabelStyle: CSSProperties = {
  display: "block",
  margin: "2px 5px 9px",
  color: "var(--historietas-secondary, #7C3AED)",
  fontSize: "9px",
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: "0.14em",
};

export const tocLinksStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
};

export const sectionsColumnStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "12px",
};

export const footerStyle: CSSProperties = {
  marginTop: "28px",
  borderRadius: "19px",
  padding: "15px",
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "11px",
  background:
    "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 12%, var(--historietas-surface, #120C1E))",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
};

export const footerIconStyle: CSSProperties = {
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

export const footerTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "4px",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.4,
};

export const footerLinkStyle: CSSProperties = {
  minHeight: "39px",
  borderRadius: "11px",
  padding: "9px 11px",
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  background:
    "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent)",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "12px",
  lineHeight: 1,
  fontWeight: 780,
};

