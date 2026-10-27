export const loginPageCss = `
  html {
    --historietas-login-bg-page: #000000;
    --historietas-login-bg-deep: #000000;
    --historietas-login-surface: #050505;
    --historietas-login-logo-mid: #D4D4D8;
    --historietas-login-logo-end: #FFFFFF;
    --historietas-login-danger: #FFFFFF;
    --historietas-login-success: #FFFFFF;
    --historietas-login-purple-border: rgba(255,255,255,0.18);
    --historietas-login-purple-border-soft: rgba(255,255,255,0.18);
    --historietas-login-success-bg: rgba(255,255,255,0.06);
    --historietas-login-success-border: rgba(255,255,255,0.18);
    --historietas-login-placeholder: rgba(212,212,216,0.68);
  }

  html {
    --historietas-login-bg-page: #000000;
    --historietas-login-bg-deep: #000000;
    --historietas-login-surface: #050505;
    --historietas-login-logo-mid: #FFFFFF;
    --historietas-login-logo-end: #FFFFFF;
    --historietas-login-danger: #FFFFFF;
    --historietas-login-success: #FFFFFF;
    --historietas-login-purple-border: rgba(255,255,255,0.18);
    --historietas-login-purple-border-soft: rgba(255,255,255,0.18);
    --historietas-login-success-bg: rgba(255,255,255,0.06);
    --historietas-login-success-border: rgba(255,255,255,0.18);
    --historietas-login-placeholder: rgba(212,212,216,0.68);
  }

  html,
  body {
    overflow-x: hidden !important;
    overflow-y: auto !important;
    overscroll-behavior-y: contain !important;
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

  html[data-historietas-tema-visual] input::placeholder {
    color: var(--historietas-login-placeholder) !important;
  }

  html[data-historietas-tema-visual] input {
    color: #FFFFFF !important;
  }

  html .historietas-theme-logo-text,
  html .historietas-theme-title {
    background: none !important;
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    text-shadow: none !important;
  }
`;
