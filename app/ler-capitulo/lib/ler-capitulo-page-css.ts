export const leitorPageCss = `
  @keyframes historietas-reader-heart-pop {
    0% { transform: scale(1); }
    45% { transform: scale(1.28); }
    100% { transform: scale(1); }
  }

  @keyframes historietas-loading-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .historietas-loading-spinner {
      animation-duration: 1.4s !important;
    }

    [data-historietas-reader-like] svg {
      animation-duration: 1ms !important;
    }
  }

  html {
    --historietas-reader-bg-page: #000000;
    --historietas-reader-bg-deep: #000000;
    --historietas-reader-surface: #050505;
    --historietas-reader-bg-end: #020006;
    --historietas-reader-progress: #FFFFFF;
    --historietas-reader-danger: #FFFFFF;
    --historietas-reader-heart: #FFFFFF;
    --historietas-reader-logo-mid: #FFFFFF;
    --historietas-reader-logo-end: #D4D4D8;
    --historietas-reader-secondary: #A1A1AA;
    --historietas-reader-accent: #FFFFFF;
    --historietas-reader-success: #FFFFFF;
    --historietas-reader-danger-text: #FFFFFF;
    --historietas-reader-purple-border: rgba(255, 255, 255, 0.18);
    --historietas-reader-panel: rgba(4, 0, 10, 0.72);
    --historietas-reader-menu: rgba(18, 9, 35, 0.98);
    --historietas-reader-highlight-border: rgba(255, 255, 255, 0.24);
    --historietas-reader-publish-bg: #050505;
    --historietas-reader-danger-surface: rgba(127,29,29,0.18);
    --historietas-reader-danger-bg: rgba(239,68,68,0.12);
    --historietas-reader-danger-border: rgba(248,113,113,0.24);
  }

  {
    --historietas-reader-bg-page: #000000;
    --historietas-reader-bg-deep: #000000;
    --historietas-reader-surface: #050505;
    --historietas-reader-bg-end: #000000;
    --historietas-reader-progress: #FFFFFF;
    --historietas-reader-danger: #FFFFFF;
    --historietas-reader-heart: #FFFFFF;
    --historietas-reader-logo-mid: #FFFFFF;
    --historietas-reader-logo-end: #FFFFFF;
    --historietas-reader-secondary: #A1A1AA;
    --historietas-reader-accent: #FFFFFF;
    --historietas-reader-success: #FFFFFF;
    --historietas-reader-danger-text: #FFFFFF;
    --historietas-reader-purple-border: rgba(255,255,255,0.18);
    --historietas-reader-panel: rgba(5,5,5,0.92);
    --historietas-reader-menu: #000000;
    --historietas-reader-highlight-border: rgba(255,255,255,0.26);
    --historietas-reader-publish-bg: #000000;
    --historietas-reader-danger-surface: rgba(255,255,255,0.08);
    --historietas-reader-danger-bg: rgba(255,255,255,0.06);
    --historietas-reader-danger-border: rgba(255,255,255,0.18);
  }

  body,
  main {
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

  html[data-historietas-tema-visual] input::placeholder,
  html[data-historietas-tema-visual] textarea::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  html[data-historietas-tema-visual] select,
  html[data-historietas-tema-visual] textarea {
    color: #FFFFFF !important;
  }

  body {
    background: #000000 !important;
    --historietas-reader-bg-page: #000000;
    --historietas-reader-bg-deep: #000000;
    --historietas-reader-surface: #050505;
    --historietas-reader-bg-end: #000000;
    --historietas-reader-progress: #FFFFFF;
    --historietas-reader-danger: #FFFFFF;
    --historietas-reader-heart: #FFFFFF;
    --historietas-reader-logo-mid: #FFFFFF;
    --historietas-reader-logo-end: #FFFFFF;
    --historietas-reader-secondary: #A1A1AA;
    --historietas-reader-accent: #FFFFFF;
    --historietas-reader-success: #FFFFFF;
    --historietas-reader-danger-text: #FFFFFF;
    --historietas-reader-purple-border: rgba(255,255,255,0.18);
    --historietas-reader-panel: rgba(5,5,5,0.92);
    --historietas-reader-menu: #000000;
    --historietas-reader-highlight-border: rgba(255,255,255,0.26);
    --historietas-reader-publish-bg: #000000;
    --historietas-reader-danger-surface: rgba(255,255,255,0.08);
    --historietas-reader-danger-bg: rgba(255,255,255,0.06);
    --historietas-reader-danger-border: rgba(255,255,255,0.18);
  }
`;
