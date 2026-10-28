export const emBrevePageCss = `
  html {
    --historietas-em-breve-bg-page: #000000;
    --historietas-em-breve-bg-deep: #000000;
    --historietas-em-breve-bg-end: #000000;
    --historietas-em-breve-surface: #050505;
    --historietas-em-breve-nav-text: #D4D4D8;
    --historietas-em-breve-accent: #FFFFFF;
    --historietas-em-breve-secondary: #A1A1AA;
    --historietas-em-breve-accent-soft: #FFFFFF;
    --historietas-em-breve-title-from: #FFFFFF;
    --historietas-em-breve-title-mid: #D4D4D8;
    --historietas-em-breve-secondary-text: #D4D4D8;
    --historietas-em-breve-danger: #FFFFFF;
    --historietas-em-breve-success: #FFFFFF;
    --historietas-em-breve-notification-badge-bg: #FFFFFF;
    --historietas-em-breve-notification-badge-text: #FFFFFF;
    --historietas-em-breve-accent-bg: rgba(255,255,255,0.06);
    --historietas-em-breve-accent-border: rgba(255,255,255,0.18);
    --historietas-em-breve-secondary-bg-soft: rgba(255,255,255,0.06);
    --historietas-em-breve-secondary-bg: rgba(255,255,255,0.08);
    --historietas-em-breve-secondary-border-soft: rgba(255,255,255,0.18);
    --historietas-em-breve-secondary-border: rgba(255,255,255,0.22);
    --historietas-em-breve-success-bg: rgba(255,255,255,0.06);
    --historietas-em-breve-success-border: rgba(255,255,255,0.18);
    --historietas-em-breve-panel: rgba(5,5,5,0.92);
    --historietas-em-breve-panel-strong: rgba(5,5,5,0.96);
  }

  html {
    --historietas-em-breve-bg-page: #000000;
    --historietas-em-breve-bg-deep: #000000;
    --historietas-em-breve-bg-end: #000000;
    --historietas-em-breve-surface: #050505;
    --historietas-em-breve-nav-text: #D4D4D8;
    --historietas-em-breve-accent: #FFFFFF;
    --historietas-em-breve-secondary: #A1A1AA;
    --historietas-em-breve-accent-soft: #FFFFFF;
    --historietas-em-breve-title-from: #FFFFFF;
    --historietas-em-breve-title-mid: #D4D4D8;
    --historietas-em-breve-secondary-text: #D4D4D8;
    --historietas-em-breve-danger: #FFFFFF;
    --historietas-em-breve-success: #FFFFFF;
    --historietas-em-breve-notification-badge-bg: #FFFFFF;
    --historietas-em-breve-notification-badge-text: #000000;
    --historietas-em-breve-accent-bg: rgba(255,255,255,0.06);
    --historietas-em-breve-accent-border: rgba(255,255,255,0.18);
    --historietas-em-breve-secondary-bg-soft: rgba(255,255,255,0.06);
    --historietas-em-breve-secondary-bg: rgba(255,255,255,0.08);
    --historietas-em-breve-secondary-border-soft: rgba(255,255,255,0.18);
    --historietas-em-breve-secondary-border: rgba(255,255,255,0.22);
    --historietas-em-breve-success-bg: rgba(255,255,255,0.06);
    --historietas-em-breve-success-border: rgba(255,255,255,0.18);
    --historietas-em-breve-panel: rgba(5,5,5,0.92);
    --historietas-em-breve-panel-strong: rgba(5,5,5,0.96);
  }

  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #000000 !important;
    color: #FFFFFF !important;
  }

  html body,
  html main {
    background: #000000 !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  html[data-historietas-tema-visual] nav,
  html[data-historietas-tema-visual] [data-bottom-nav],
  html[data-historietas-tema-visual] [data-mobile-nav] {
    background: var(--historietas-bottom-nav-bg, #000000) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) {
    background: transparent !important;
    border-color: transparent !important;
    color: var(
      --historietas-bottom-nav-text,
      var(--historietas-em-breve-nav-text, #D4D4D8)
    ) !important;
    box-shadow: none !important;
  }

  html .historietas-theme-logo-text,
  html .historietas-theme-title {
    background: none !important;
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    text-shadow: none !important;
  }
`;
