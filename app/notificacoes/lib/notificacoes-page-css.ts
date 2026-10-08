export const notificacoesPageCss = `
  @keyframes historietas-loading-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .historietas-loading-spinner {
      animation-duration: 1.4s !important;
    }
  }

  html {
    --historietas-notificacoes-bg-page: #000000;
    --historietas-notificacoes-bg-deep: #000000;
    --historietas-notificacoes-surface: #050505;
    --historietas-notificacoes-bg-end: #020006;
    --historietas-notificacoes-purple-text: #FFFFFF;
    --historietas-notificacoes-purple-soft: #D4D4D8;
    --historietas-notificacoes-accent: #FFFFFF;
    --historietas-notificacoes-danger-text: #FFFFFF;
    --historietas-notificacoes-purple-border: rgba(59, 7, 100, 0.58);
    --historietas-notificacoes-danger-border: rgba(239,68,68,0.18);
    --historietas-notificacoes-danger-bg: rgba(239,68,68,0.075);
    --historietas-notificacoes-danger-surface: rgba(127,29,29,0.24);
    --historietas-notificacoes-danger-strong: rgba(248,113,113,0.36);
    --historietas-notificacoes-success-bg: rgba(34,197,94,0.12);
    --historietas-notificacoes-success-border: rgba(34,197,94,0.18);
    --historietas-notificacoes-accent-bg: rgba(249,115,22,0.12);
    --historietas-notificacoes-accent-border: rgba(249,115,22,0.20);
    --historietas-notificacoes-secondary-bg: rgba(124,58,237,0.16);
    --historietas-notificacoes-secondary-border: rgba(124,58,237,0.26);
  }

  html {
    --historietas-notificacoes-bg-page: #000000;
    --historietas-notificacoes-bg-deep: #000000;
    --historietas-notificacoes-surface: #050505;
    --historietas-notificacoes-bg-end: #000000;
    --historietas-notificacoes-purple-text: #FFFFFF;
    --historietas-notificacoes-purple-soft: #FFFFFF;
    --historietas-notificacoes-accent: #FFFFFF;
    --historietas-notificacoes-danger-text: #FFFFFF;
    --historietas-notificacoes-purple-border: rgba(255,255,255,0.18);
    --historietas-notificacoes-danger-border: rgba(255,255,255,0.18);
    --historietas-notificacoes-danger-bg: rgba(255,255,255,0.06);
    --historietas-notificacoes-danger-surface: rgba(255,255,255,0.08);
    --historietas-notificacoes-danger-strong: rgba(255,255,255,0.24);
    --historietas-notificacoes-success-bg: rgba(255,255,255,0.06);
    --historietas-notificacoes-success-border: rgba(255,255,255,0.18);
    --historietas-notificacoes-accent-bg: rgba(255,255,255,0.06);
    --historietas-notificacoes-accent-border: rgba(255,255,255,0.18);
    --historietas-notificacoes-secondary-bg: rgba(255,255,255,0.06);
    --historietas-notificacoes-secondary-border: rgba(255,255,255,0.18);
  }

  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #000000 !important;
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

  html[data-historietas-notificacoes-overlay-aberto="true"] body {
    overflow: hidden !important;
  }

  html[data-historietas-notificacoes-overlay-aberto="true"] nav,
  html[data-historietas-notificacoes-overlay-aberto="true"] [data-bottom-nav],
  html[data-historietas-notificacoes-overlay-aberto="true"] [data-mobile-nav],
  html[data-historietas-notificacoes-overlay-aberto="true"] nav:has(a[href="/publicar"]),
  html[data-historietas-notificacoes-overlay-aberto="true"] div:has(> a[href="/publicar"]):has(> a[href="/perfil-autor?aba=biblioteca"]) {
    z-index: 1 !important;
    pointer-events: none !important;
  }

  html[data-historietas-tema-visual] nav,
  html[data-historietas-tema-visual] [data-bottom-nav],
  html[data-historietas-tema-visual] [data-mobile-nav] {
    background: var(--historietas-bottom-nav-bg, #000000) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/notificacoes"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/notificacoes"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/notificacoes"] {
    background: var(
      --historietas-bottom-nav-active-bg,
      rgba(59, 7, 100, 0.54)
    ) !important;
    border-color: var(
      --historietas-bottom-nav-active-border,
      rgba(109, 40, 217, 0.48)
    ) !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] nav a[href="/notificacoes"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/notificacoes"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/notificacoes"] .historietas-bottom-nav-icon {
    color: #FFFFFF !important;
    background: var(
      --historietas-bottom-nav-active-icon-bg,
      #3B0764
    ) !important;
    border-color: var(
      --historietas-bottom-nav-active-icon-border,
      rgba(167, 139, 250, 0.46)
    ) !important;
  }

  html nav a[href="/notificacoes"],
  html [data-bottom-nav] a[href="/notificacoes"],
  html [data-mobile-nav] a[href="/notificacoes"] {
    background: #050505 !important;
    border-color: #FFFFFF !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  html nav a[href="/notificacoes"] .historietas-bottom-nav-icon,
  html [data-bottom-nav] a[href="/notificacoes"] .historietas-bottom-nav-icon,
  html [data-mobile-nav] a[href="/notificacoes"] .historietas-bottom-nav-icon {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.24) !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] nav a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) {
    background: transparent !important;
    border-color: transparent !important;
    color: var(--historietas-bottom-nav-text, #9980D8) !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual] .notificacoes-search-input::placeholder {
    color: #FFFFFF !important;
    opacity: 1 !important;
  }

  html[data-historietas-tema-visual] input::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  html[data-historietas-tema-visual] input,
  html[data-historietas-tema-visual] textarea,
  html[data-historietas-tema-visual] select {
    color: #FFFFFF !important;
  }
`;
