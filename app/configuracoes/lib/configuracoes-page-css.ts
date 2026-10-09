export const configuracoesPageCss = `
  html {
    --configuracoes-page-bg: #000000;
    --configuracoes-control-bg: #000000;
    --configuracoes-card-bg: #000000;
    --configuracoes-border: rgba(255,255,255,0.18);
    --configuracoes-text-secondary: #A1A1AA;
    --configuracoes-theme-active-bg: #000000;
    --configuracoes-theme-active-shadow: inset 0 0 0 1px #FFFFFF;
    --configuracoes-toggle-knob-bg: #000000;
    --configuracoes-danger-text: #FFFFFF;
    --historietas-accent: #FFFFFF;
    --historietas-secondary: #A1A1AA;
    --historietas-secondary-button-text: #FFFFFF;
    --historietas-input-text: #FFFFFF;
  }

  html body,
  html main {
    background: #000000 !important;
    color: #FFFFFF !important;
  }

  .configuracoes-input::placeholder {
    color: #A1A1AA !important;
    opacity: 1 !important;
  }

  .configuracoes-input {
    color: var(--historietas-input-text, #FFFFFF) !important;
    box-shadow: none !important;
  }

  .configuracoes-input-transparente {
    background: transparent !important;
    border: 0 !important;
    outline: none !important;
    box-shadow: none !important;
  }

  .configuracoes-theme-swatch {
    background: linear-gradient(135deg, #D4D4D8 0%, #A1A1AA 100%) !important;
    border-color: rgba(255,255,255,0.22) !important;
    box-shadow: none !important;
  }

  .configuracoes-theme-swatch[data-tema-visual-opcao="foco"] {
    background: linear-gradient(135deg, #FFFFFF 0%, #A1A1AA 100%) !important;
  }

  button,
  a {
    box-shadow: none;
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
  }

  .configuracoes-input {
    appearance: none;
  }

  .configuracoes-input::-webkit-search-cancel-button {
    appearance: none;
  }
`;
