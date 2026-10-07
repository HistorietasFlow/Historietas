export const obraPageCss = `
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

  @keyframes historietas-stat-heart-pop {
    0% { transform: scale(1); }
    45% { transform: scale(1.28); }
    100% { transform: scale(1); }
  }

  @keyframes historietas-synopsis-reveal {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  html {
    --historietas-obra-bg-deep: #000000;
    --historietas-obra-bg-deeper: #000000;
    --historietas-obra-surface: #050505;
    --historietas-obra-bg-deep-96: rgba(0, 0, 0, 0.96);
    --historietas-obra-bg-deep-72: rgba(0, 0, 0, 0.72);
    --historietas-obra-bg-shadow-42: rgba(0, 0, 0, 0.42);
    --historietas-obra-menu-98: rgba(0, 0, 0, 0.98);
    --historietas-obra-rating: #FFFFFF;
    --historietas-obra-rating-strong: #FFFFFF;
    --historietas-obra-rating-muted: rgba(255, 255, 255, 0.32);
    --historietas-obra-danger: #FFFFFF;
    --historietas-obra-heart: #FFFFFF;
    --historietas-obra-logo-mid: #FFFFFF;
    --historietas-obra-logo-end: #D4D4D8;
    --historietas-obra-purple-48: rgba(255, 255, 255, 0.12);
    --historietas-obra-purple-58: rgba(255, 255, 255, 0.16);
    --historietas-obra-purple-72: rgba(255, 255, 255, 0.20);
    --historietas-obra-secondary-22: rgba(255, 255, 255, 0.08);
    --historietas-obra-secondary-72: rgba(255, 255, 255, 0.24);
    --historietas-obra-secondary-soft-34: rgba(255, 255, 255, 0.18);

  }





`;
