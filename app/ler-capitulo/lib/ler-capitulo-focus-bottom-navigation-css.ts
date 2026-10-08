export const focusBottomNavigationCss = `
  body {
    --historietas-accent: #FFFFFF;
    --historietas-secondary: #A1A1AA;
    --historietas-bg-start: #000000;
    --historietas-bg-mid: #000000;
    --historietas-bg-end: #000000;
    --historietas-glow-primary: transparent;
    --historietas-glow-secondary: transparent;
    --historietas-text-primary: #FFFFFF;
    --historietas-text-secondary: #D4D4D8;
    --historietas-surface: #050505;
    --historietas-surface-strong: #000000;
    --historietas-border-soft: rgba(255,255,255,0.12);
    --historietas-input-bg: #000000;
    --historietas-input-text: #FFFFFF;
    --historietas-title-from: #FFFFFF;
    --historietas-title-mid: #FFFFFF;
    --historietas-title-to: #FFFFFF;
    --historietas-secondary-surface: rgba(255,255,255,0.06);
    --historietas-secondary-button-text: #FFFFFF;
    --historietas-danger-surface: rgba(255,255,255,0.08);
    --historietas-danger-button-text: #FFFFFF;
    --historietas-logo-shadow: none;
    --historietas-card-shadow: none;
    --historietas-hero-shadow: none;
    --historietas-bottom-nav-bg: #000000;
    --historietas-bottom-nav-border: rgba(255,255,255,0.18);
    --historietas-bottom-nav-shadow: none;
    --historietas-bottom-nav-text: #A1A1AA;
    --historietas-bottom-nav-hover-bg: rgba(255,255,255,0.08);
    --historietas-bottom-nav-hover-text: #FFFFFF;
    --historietas-bottom-nav-icon-text: #FFFFFF;
    --historietas-bottom-nav-icon-bg: #050505;
    --historietas-bottom-nav-icon-border: rgba(255,255,255,0.18);
    --historietas-bottom-nav-main-bg: #000000;
    --historietas-bottom-nav-main-border: #FFFFFF;
  }

  body article,
  body article p,
  body h1,
  body h2,
  body p {
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    text-shadow: none !important;
  }

  body span,
  body label {
    color: #D4D4D8 !important;
    -webkit-text-fill-color: initial !important;
    text-shadow: none !important;
  }

  body .historietas-theme-logo-text,
  body .historietas-theme-title {
    background: none !important;
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
  }

  body nav,
  body [data-bottom-nav],
  body [data-mobile-nav],
  body nav[aria-label*="Navegação"],
  body nav[aria-label*="navegação"],
  body div:has(a[href="/publicar"]):has(a[href="/perfil-autor?aba=biblioteca"]) {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.18) !important;
    box-shadow: none !important;
    color: #A1A1AA !important;
  }

  body nav a,
  body [data-bottom-nav] a,
  body [data-mobile-nav] a,
  body nav button,
  body [data-bottom-nav] button,
  body [data-mobile-nav] button,
  body div:has(a[href="/publicar"]):has(a[href="/perfil-autor?aba=biblioteca"]) a,
  body div:has(a[href="/publicar"]):has(a[href="/perfil-autor?aba=biblioteca"]) button {
    color: #A1A1AA !important;
    box-shadow: none !important;
  }

  body nav a[href="/publicar"],
  body [data-bottom-nav] a[href="/publicar"],
  body [data-mobile-nav] a[href="/publicar"],
  body div:has(a[href="/publicar"]):has(a[href="/perfil-autor?aba=biblioteca"]) a[href="/publicar"] {
    background: #000000 !important;
    border-color: #FFFFFF !important;
    color: #FFFFFF !important;
  }

  body .historietas-bottom-nav-icon {
    background: #050505 !important;
    border-color: rgba(255,255,255,0.18) !important;
    color: #FFFFFF !important;
  }
`;
