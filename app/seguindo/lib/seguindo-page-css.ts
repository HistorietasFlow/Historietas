export const seguindoPageCss = `
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
    --historietas-seguindo-bg-page: #000000;
    --historietas-seguindo-bg-deep: #000000;
    --historietas-seguindo-surface: #050505;
    --historietas-seguindo-bg-end: #000000;
    --historietas-seguindo-purple-text: #FFFFFF;
    --historietas-seguindo-purple-soft: #D4D4D8;
    --historietas-seguindo-success: #FFFFFF;
    --historietas-seguindo-success-soft: #FFFFFF;
    --historietas-seguindo-danger-text: #FFFFFF;
    --historietas-seguindo-purple-border: rgba(255,255,255,0.18);
    --historietas-seguindo-panel: rgba(5,5,5,0.92);
    --historietas-seguindo-success-border: rgba(255,255,255,0.18);
    --historietas-seguindo-success-bg: rgba(255,255,255,0.06);
    --historietas-seguindo-success-active-bg: rgba(255,255,255,0.08);
    --historietas-seguindo-success-active-border: rgba(255,255,255,0.22);
    --historietas-seguindo-danger-border: rgba(255,255,255,0.18);
    --historietas-seguindo-danger-bg: rgba(255,255,255,0.06);
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
    background: var(--historietas-bottom-nav-bg, #050505) !important;
  }

  nav a[href="/seguindo"],
  [data-bottom-nav] a[href="/seguindo"],
  [data-mobile-nav] a[href="/seguindo"] {
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

  nav a[href="/seguindo"] .historietas-bottom-nav-icon,
  [data-bottom-nav] a[href="/seguindo"] .historietas-bottom-nav-icon,
  [data-mobile-nav] a[href="/seguindo"] .historietas-bottom-nav-icon {
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

  nav a[href="/seguindo"],
  [data-bottom-nav] a[href="/seguindo"],
  [data-mobile-nav] a[href="/seguindo"] {
    background: #050505 !important;
    border-color: #FFFFFF !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  nav a[href="/seguindo"] .historietas-bottom-nav-icon,
  [data-bottom-nav] a[href="/seguindo"] .historietas-bottom-nav-icon,
  [data-mobile-nav] a[href="/seguindo"] .historietas-bottom-nav-icon {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.24) !important;
    color: #FFFFFF !important;
  }

  input::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  input,
  textarea,
  select {
    color: #FFFFFF !important;
  }

  .seguindo-summary-carousel {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .seguindo-summary-carousel::-webkit-scrollbar {
    display: none;
  }
`;
