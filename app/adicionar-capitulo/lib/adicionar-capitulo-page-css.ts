export const adicionarCapituloPageCss = `
  html {
    --historietas-adicionar-capitulo-bg-page: #000000;
    --historietas-adicionar-capitulo-bg-deep: #000000;
    --historietas-adicionar-capitulo-surface: #050505;
    --historietas-adicionar-capitulo-bg-end: #000000;
    --historietas-adicionar-capitulo-accent: #FFFFFF;
    --historietas-adicionar-capitulo-secondary: #A1A1AA;
    --historietas-adicionar-capitulo-accent-soft: #FFFFFF;
    --historietas-adicionar-capitulo-purple-text: #FFFFFF;
    --historietas-adicionar-capitulo-purple-soft: #D4D4D8;
    --historietas-adicionar-capitulo-danger: #FFFFFF;
    --historietas-adicionar-capitulo-danger-text: #FFFFFF;
    --historietas-adicionar-capitulo-danger-text-soft: #FFFFFF;
    --historietas-adicionar-capitulo-success: #FFFFFF;
    --historietas-adicionar-capitulo-purple-border: rgba(255,255,255,0.18);
    --historietas-adicionar-capitulo-danger-surface: rgba(255,255,255,0.08);
    --historietas-adicionar-capitulo-danger-border: rgba(255,255,255,0.18);
    --historietas-adicionar-capitulo-danger-bg: rgba(255,255,255,0.06);
    --historietas-adicionar-capitulo-danger-border-strong: rgba(255,255,255,0.22);
    --historietas-adicionar-capitulo-success-bg: rgba(255,255,255,0.06);
    --historietas-adicionar-capitulo-success-border: rgba(255,255,255,0.18);
    --historietas-adicionar-capitulo-success-bg-soft: rgba(255,255,255,0.06);
    --historietas-adicionar-capitulo-success-border-soft: rgba(255,255,255,0.18);
    --historietas-adicionar-capitulo-accent-bg: rgba(255,255,255,0.06);
    --historietas-adicionar-capitulo-accent-border: rgba(255,255,255,0.18);
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

  input::placeholder,
  textarea::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  input,
  textarea {
    color: #FFFFFF !important;
  }

  nav,
  [data-bottom-nav],
  [data-mobile-nav] {
    background: var(--historietas-bottom-nav-bg, #000000) !important;
  }

  nav a[href="/painel-autor"],
  [data-bottom-nav] a[href="/painel-autor"],
  [data-mobile-nav] a[href="/painel-autor"] {
    background: var(
      --historietas-bottom-nav-active-bg,
      rgba(59, 7, 100, 0.54)
    ) !important;
    border-color: var(
      --historietas-bottom-nav-active-border,
      rgba(109, 40, 217, 0.48)
    ) !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  nav a[href="/painel-autor"] .historietas-bottom-nav-icon,
  [data-bottom-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon,
  [data-mobile-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon {
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

  nav a[href="/painel-autor"],
  [data-bottom-nav] a[href="/painel-autor"],
  [data-mobile-nav] a[href="/painel-autor"] {
    background: #050505 !important;
    border-color: #FFFFFF !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  nav a[href="/painel-autor"] .historietas-bottom-nav-icon,
  [data-bottom-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon,
  [data-mobile-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.24) !important;
    color: #FFFFFF !important;
  }
`;
