export const editarObraPageCss = `
  html {
    --historietas-editar-obra-bg-page: #000000;
    --historietas-editar-obra-bg-deep: #000000;
    --historietas-editar-obra-surface: #050505;
    --historietas-editar-obra-cover-surface: #0B0714;
    --historietas-editar-obra-bg-end: #020006;
    --historietas-editar-obra-accent: #FFFFFF;
    --historietas-editar-obra-secondary: #A1A1AA;
    --historietas-editar-obra-accent-soft: #FFFFFF;
    --historietas-editar-obra-purple-text: #FFFFFF;
    --historietas-editar-obra-purple-soft: #D4D4D8;
    --historietas-editar-obra-author-text: #D4D4D8;
    --historietas-editar-obra-danger: #FFFFFF;
    --historietas-editar-obra-danger-text: #FFFFFF;
    --historietas-editar-obra-danger-text-soft: #FECACA;
    --historietas-editar-obra-heart: #E11D48;
    --historietas-editar-obra-purple-border: rgba(59, 7, 100, 0.58);
    --historietas-editar-obra-panel: rgba(4, 0, 10, 0.72);
    --historietas-editar-obra-accent-bg: rgba(249,115,22,0.11);
    --historietas-editar-obra-accent-border: rgba(249,115,22,0.24);
    --historietas-editar-obra-danger-bg: rgba(239,68,68,0.075);
    --historietas-editar-obra-danger-border: rgba(239,68,68,0.18);
  }

  html {
    --historietas-editar-obra-bg-page: #000000;
    --historietas-editar-obra-bg-deep: #000000;
    --historietas-editar-obra-surface: #050505;
    --historietas-editar-obra-cover-surface: #050505;
    --historietas-editar-obra-bg-end: #000000;
    --historietas-editar-obra-accent: #FFFFFF;
    --historietas-editar-obra-secondary: #A1A1AA;
    --historietas-editar-obra-accent-soft: #FFFFFF;
    --historietas-editar-obra-purple-text: #FFFFFF;
    --historietas-editar-obra-purple-soft: #D4D4D8;
    --historietas-editar-obra-author-text: #D4D4D8;
    --historietas-editar-obra-danger: #FFFFFF;
    --historietas-editar-obra-danger-text: #FFFFFF;
    --historietas-editar-obra-danger-text-soft: #FFFFFF;
    --historietas-editar-obra-heart: #FFFFFF;
    --historietas-editar-obra-purple-border: rgba(255,255,255,0.18);
    --historietas-editar-obra-panel: rgba(5,5,5,0.92);
    --historietas-editar-obra-accent-bg: rgba(255,255,255,0.06);
    --historietas-editar-obra-accent-border: rgba(255,255,255,0.18);
    --historietas-editar-obra-danger-bg: rgba(255,255,255,0.06);
    --historietas-editar-obra-danger-border: rgba(255,255,255,0.18);
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

  html[data-historietas-tema-visual] input::placeholder,
  html[data-historietas-tema-visual] textarea::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  html[data-historietas-tema-visual] input,
  html[data-historietas-tema-visual] textarea,
  html[data-historietas-tema-visual] select {
    color: #FFFFFF !important;
  }

  html option {
    background: #000000;
    color: #FFFFFF;
  }
`;
