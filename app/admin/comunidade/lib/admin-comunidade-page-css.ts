export const adminComunidadePageCss = `
  html {
    --historietas-admin-comunidade-bg-page: #000000;
    --historietas-admin-comunidade-bg-deep: #000000;
    --historietas-admin-comunidade-surface: #050505;
    --historietas-admin-comunidade-accent: #FFFFFF;
    --historietas-admin-comunidade-secondary: #A1A1AA;
    --historietas-admin-comunidade-accent-soft: #FFFFFF;
    --historietas-admin-comunidade-accent-pale: #FFFFFF;
    --historietas-admin-comunidade-purple-text: #FFFFFF;
    --historietas-admin-comunidade-title-mid: #FFFFFF;
    --historietas-admin-comunidade-danger-text: #FFFFFF;
    --historietas-admin-comunidade-danger-menu: #FFFFFF;
    --historietas-admin-comunidade-success-text: #FFFFFF;
    --historietas-admin-comunidade-notification-badge-bg: #FFFFFF;
    --historietas-admin-comunidade-notification-badge-text: #FFFFFF;
    --historietas-admin-comunidade-accent-bg: rgba(255,255,255,0.06);
    --historietas-admin-comunidade-accent-bg-strong: rgba(255,255,255,0.08);
    --historietas-admin-comunidade-accent-border-soft: rgba(255,255,255,0.18);
    --historietas-admin-comunidade-accent-border: rgba(255,255,255,0.22);
    --historietas-admin-comunidade-secondary-bg: rgba(255,255,255,0.06);
    --historietas-admin-comunidade-surface-gradient: #050505;
    --historietas-admin-comunidade-surface-gradient-strong: #050505;
    --historietas-admin-comunidade-surface-strong: #000000;
    --historietas-admin-comunidade-danger-bg: rgba(255,255,255,0.06);
    --historietas-admin-comunidade-danger-border: rgba(255,255,255,0.18);
    --historietas-admin-comunidade-danger-border-strong: rgba(255,255,255,0.22);
    --historietas-admin-comunidade-success-bg: rgba(255,255,255,0.06);
    --historietas-admin-comunidade-success-border: rgba(255,255,255,0.18);
    --historietas-admin-comunidade-panel: rgba(5,5,5,0.92);
  }

  html[data-historietas-tema-visual="foco"] {
    --historietas-admin-comunidade-bg-page: #000000;
    --historietas-admin-comunidade-bg-deep: #000000;
    --historietas-admin-comunidade-surface: #050505;
    --historietas-admin-comunidade-accent: #FFFFFF;
    --historietas-admin-comunidade-secondary: #A1A1AA;
    --historietas-admin-comunidade-accent-soft: #FFFFFF;
    --historietas-admin-comunidade-accent-pale: #FFFFFF;
    --historietas-admin-comunidade-purple-text: #FFFFFF;
    --historietas-admin-comunidade-title-mid: #FFFFFF;
    --historietas-admin-comunidade-danger-text: #FFFFFF;
    --historietas-admin-comunidade-danger-menu: #FFFFFF;
    --historietas-admin-comunidade-success-text: #FFFFFF;
    --historietas-admin-comunidade-notification-badge-bg: #FFFFFF;
    --historietas-admin-comunidade-notification-badge-text: #000000;
    --historietas-admin-comunidade-accent-bg: rgba(255,255,255,0.06);
    --historietas-admin-comunidade-accent-bg-strong: rgba(255,255,255,0.08);
    --historietas-admin-comunidade-accent-border-soft: rgba(255,255,255,0.18);
    --historietas-admin-comunidade-accent-border: rgba(255,255,255,0.22);
    --historietas-admin-comunidade-secondary-bg: rgba(255,255,255,0.06);
    --historietas-admin-comunidade-surface-gradient: #050505;
    --historietas-admin-comunidade-surface-gradient-strong: #050505;
    --historietas-admin-comunidade-surface-strong: #000000;
    --historietas-admin-comunidade-danger-bg: rgba(255,255,255,0.06);
    --historietas-admin-comunidade-danger-border: rgba(255,255,255,0.18);
    --historietas-admin-comunidade-danger-border-strong: rgba(255,255,255,0.22);
    --historietas-admin-comunidade-success-bg: rgba(255,255,255,0.06);
    --historietas-admin-comunidade-success-border: rgba(255,255,255,0.18);
    --historietas-admin-comunidade-panel: rgba(5,5,5,0.92);
  }

  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #000000 !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual="foco"] body,
  html[data-historietas-tema-visual="foco"] main {
    background: #000000 !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  html[data-historietas-tema-visual] input::placeholder,
  html[data-historietas-tema-visual] textarea::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  html[data-historietas-tema-visual] input,
  html[data-historietas-tema-visual] textarea,
  html[data-historietas-tema-visual] select {
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] nav,
  html[data-historietas-tema-visual] [data-bottom-nav],
  html[data-historietas-tema-visual] [data-mobile-nav] {
    background: var(--historietas-bottom-nav-bg, #000000) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/admin/comunidade"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/admin/comunidade"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/admin/comunidade"] {
    background: var(
      --historietas-bottom-nav-active-bg,
      #050505
    ) !important;
    border-color: var(
      --historietas-bottom-nav-active-border,
      #FFFFFF
    ) !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual] nav a[href="/admin/comunidade"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/admin/comunidade"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/admin/comunidade"] .historietas-bottom-nav-icon {
    color: #FFFFFF !important;
    background: var(
      --historietas-bottom-nav-active-icon-bg,
      #000000
    ) !important;
    border-color: var(
      --historietas-bottom-nav-active-icon-border,
      rgba(255,255,255,0.24)
    ) !important;
  }

  html[data-historietas-tema-visual="foco"] nav a[href="/admin/comunidade"],
  html[data-historietas-tema-visual="foco"] [data-bottom-nav] a[href="/admin/comunidade"],
  html[data-historietas-tema-visual="foco"] [data-mobile-nav] a[href="/admin/comunidade"] {
    background: #050505 !important;
    border-color: #FFFFFF !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual="foco"] nav a[href="/admin/comunidade"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual="foco"] [data-bottom-nav] a[href="/admin/comunidade"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual="foco"] [data-mobile-nav] a[href="/admin/comunidade"] .historietas-bottom-nav-icon {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.24) !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual="foco"] .historietas-theme-logo-text,
  html[data-historietas-tema-visual="foco"] .historietas-theme-title {
    background: none !important;
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    text-shadow: none !important;
  }

  .admin-comunidade-stats > * {
    min-width: 0;
  }

  .admin-comunidade-stats > *:nth-child(-n + 3) {
    grid-column: span 4;
  }

  .admin-comunidade-stats > *:nth-child(n + 4) {
    grid-column: span 3;
  }

  .admin-comunidade-filter-buttons {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .admin-comunidade-filter-buttons::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }

  @media (max-width: 760px) {
    .admin-comunidade-header-actions {
      grid-template-columns: 1fr !important;
    }

    .admin-comunidade-report-header {
      grid-template-columns: minmax(0, 1fr) auto !important;
      align-items: start !important;
    }

    .admin-comunidade-report-body {
      grid-template-columns: minmax(0, 1fr) !important;
    }
  }
`;
