export const comunidadeThemeCss = `
  @keyframes historietas-comunidade-heart-pop {
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

    [data-historietas-community-like] svg {
      animation-duration: 1ms !important;
    }
  }

  html {
    --historietas-comunidade-bg-page: #000000;
    --historietas-comunidade-bg-deep: #000000;
    --historietas-comunidade-surface: #050505;
    --historietas-comunidade-surface-alt: #090909;
    --historietas-comunidade-accent: #FFFFFF;
    --historietas-comunidade-accent-soft: #FFFFFF;
    --historietas-comunidade-secondary: #A1A1AA;
    --historietas-comunidade-secondary-soft: #D4D4D8;
    --historietas-comunidade-secondary-text: #FFFFFF;
    --historietas-comunidade-danger-text: #FFFFFF;
    --historietas-comunidade-heart: #FFFFFF;
    --historietas-comunidade-blue: #FFFFFF;
    --historietas-comunidade-cyan: #D4D4D8;
    --historietas-comunidade-pink: #FFFFFF;
    --historietas-comunidade-success: #FFFFFF;
    --historietas-comunidade-purple-22: rgba(255,255,255,0.08);
    --historietas-comunidade-purple-24: rgba(255,255,255,0.08);
    --historietas-comunidade-purple-25: rgba(255,255,255,0.10);
    --historietas-comunidade-purple-58: rgba(255,255,255,0.10);
    --historietas-comunidade-purple-72: rgba(255,255,255,0.12);
    --historietas-comunidade-purple-soft-34: rgba(255,255,255,0.18);
    --historietas-comunidade-danger-dark-18: rgba(255,255,255,0.08);
    --historietas-comunidade-danger-22: rgba(255,255,255,0.12);
    --historietas-comunidade-danger-24: rgba(255,255,255,0.12);
    --historietas-comunidade-danger-26: rgba(255,255,255,0.14);
    --historietas-comunidade-danger-bg-11: rgba(255,255,255,0.06);
    --historietas-comunidade-danger-bg-12: rgba(255,255,255,0.08);
    --historietas-comunidade-cyan-22: rgba(255,255,255,0.10);
    --historietas-comunidade-cyan-62: rgba(255,255,255,0.62);
    --historietas-comunidade-success-10: rgba(255,255,255,0.06);
    --historietas-comunidade-success-70: rgba(255,255,255,0.70);
    --historietas-comunidade-dark-72: rgba(0,0,0,0.72);
    --historietas-comunidade-dark-98: rgba(0,0,0,0.98);
    --historietas-comunidade-dark-alt-98: rgba(0,0,0,0.98);
    --historietas-comunidade-surface-82: rgba(5,5,5,0.82);
    --historietas-comunidade-surface-94: rgba(5,5,5,0.94);
    --historietas-comunidade-sheet-98: rgba(0,0,0,0.98);
    --historietas-comunidade-menu-98: rgba(0,0,0,0.98);
  }

  html [data-historietas-comunidade-sheet="true"] {
    color: #FFFFFF !important;
  }
`;
