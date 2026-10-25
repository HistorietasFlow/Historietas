export const editarCapituloPageCss = `
  html {
    --historietas-editar-capitulo-bg-page: #000000;
    --historietas-editar-capitulo-bg-deep: #000000;
    --historietas-editar-capitulo-surface: #050505;
    --historietas-editar-capitulo-accent: #FFFFFF;
    --historietas-editar-capitulo-danger: #FFFFFF;
    --historietas-editar-capitulo-danger-text: #FFFFFF;
    --historietas-editar-capitulo-danger-text-soft: #FECACA;
    --historietas-editar-capitulo-success: #86EFAC;
    --historietas-editar-capitulo-panel: rgba(4, 0, 10, 0.72);
    --historietas-editar-capitulo-danger-surface: rgba(127,29,29,0.18);
    --historietas-editar-capitulo-danger-border: rgba(239,68,68,0.26);
    --historietas-editar-capitulo-danger-bg: rgba(239,68,68,0.13);
    --historietas-editar-capitulo-danger-border-strong: rgba(239,68,68,0.28);
    --historietas-editar-capitulo-success-bg: rgba(34,197,94,0.12);
    --historietas-editar-capitulo-success-border: rgba(34,197,94,0.28);
  }

  html {
    --historietas-editar-capitulo-bg-page: #000000;
    --historietas-editar-capitulo-bg-deep: #000000;
    --historietas-editar-capitulo-surface: #050505;
    --historietas-editar-capitulo-accent: #FFFFFF;
    --historietas-editar-capitulo-danger: #A1A1AA;
    --historietas-editar-capitulo-danger-text: #FFFFFF;
    --historietas-editar-capitulo-danger-text-soft: #D4D4D8;
    --historietas-editar-capitulo-success: #FFFFFF;
    --historietas-editar-capitulo-panel: rgba(5,5,5,0.92);
    --historietas-editar-capitulo-danger-surface: rgba(255,255,255,0.08);
    --historietas-editar-capitulo-danger-border: rgba(255,255,255,0.18);
    --historietas-editar-capitulo-danger-bg: rgba(255,255,255,0.06);
    --historietas-editar-capitulo-danger-border-strong: rgba(255,255,255,0.22);
    --historietas-editar-capitulo-success-bg: rgba(255,255,255,0.06);
    --historietas-editar-capitulo-success-border: rgba(255,255,255,0.18);
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

  html[data-historietas-tema-visual] input::placeholder,
  html[data-historietas-tema-visual] textarea::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  html[data-historietas-tema-visual] input,
  html[data-historietas-tema-visual] textarea {
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] nav,
  html[data-historietas-tema-visual] [data-bottom-nav],
  html[data-historietas-tema-visual] [data-mobile-nav] {
    background: var(--historietas-bottom-nav-bg, #000000) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/painel-autor"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/painel-autor"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/painel-autor"] {
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

  html[data-historietas-tema-visual] nav a[href="/painel-autor"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon {
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

  html nav a[href="/painel-autor"],
  html [data-bottom-nav] a[href="/painel-autor"],
  html [data-mobile-nav] a[href="/painel-autor"] {
    background: #050505 !important;
    border-color: #FFFFFF !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  html nav a[href="/painel-autor"] .historietas-bottom-nav-icon,
  html [data-bottom-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon,
  html [data-mobile-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.24) !important;
    color: #FFFFFF !important;
  }
`;
