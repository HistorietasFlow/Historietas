export const publicarPageCss = `
  html {
    --historietas-publicar-bg-page: #000000;
    --historietas-publicar-bg-deep: #000000;
    --historietas-publicar-surface: #050505;
    --historietas-publicar-bg-end: #000000;
    --historietas-publicar-accent: #FFFFFF;
    --historietas-publicar-secondary: #A1A1AA;
    --historietas-publicar-accent-soft: #FFFFFF;
    --historietas-publicar-purple-text: #FFFFFF;
    --historietas-publicar-purple-soft: #D4D4D8;
    --historietas-publicar-author-text: #D4D4D8;
    --historietas-publicar-danger: #FFFFFF;
    --historietas-publicar-danger-text: #FFFFFF;
    --historietas-publicar-heart: #FFFFFF;
    --historietas-publicar-success: #FFFFFF;
    --historietas-publicar-purple-border: rgba(255,255,255,0.18);
    --historietas-publicar-danger-bg: rgba(255,255,255,0.06);
    --historietas-publicar-danger-border: rgba(255,255,255,0.18);
    --historietas-publicar-success-bg: rgba(255,255,255,0.06);
    --historietas-publicar-success-border: rgba(255,255,255,0.18);
  }

  body,
  main {
    background: #000000 !important;
    color: #FFFFFF !important;
  }

  main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  nav,
  [data-bottom-nav],
  [data-mobile-nav] {
    background: var(--historietas-bottom-nav-bg, #000000) !important;
  }

  nav a[href="/publicar"],
  [data-bottom-nav] a[href="/publicar"],
  [data-mobile-nav] a[href="/publicar"] {
    background: #050505 !important;
    border-color: #FFFFFF !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  nav a[href="/publicar"] .historietas-bottom-nav-icon,
  [data-bottom-nav] a[href="/publicar"] .historietas-bottom-nav-icon,
  [data-mobile-nav] a[href="/publicar"] .historietas-bottom-nav-icon {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.24) !important;
    color: #FFFFFF !important;
  }

  input::placeholder,
  textarea::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  input,
  textarea,
  select {
    color: #FFFFFF !important;
  }

  option {
    background: #000000;
    color: #FFFFFF;
  }
`;
