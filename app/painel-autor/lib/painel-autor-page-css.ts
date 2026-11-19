export const painelAutorPageCss = `
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
    --historietas-painel-bg: #000000;
    --historietas-painel-bg-deep: #000000;
    --historietas-painel-surface: #050505;
    --historietas-painel-card-bg: rgba(4, 0, 10, 0.72);
    --historietas-painel-status-bg: rgba(8,5,13,0.52);
    --historietas-painel-heart-meta: #FFFFFF;
    --historietas-painel-heart-icon: #F43F5E;
    --historietas-painel-success: #86EFAC;
  }

  html {
    --historietas-painel-bg: #000000;
    --historietas-painel-bg-deep: #000000;
    --historietas-painel-surface: #050505;
    --historietas-painel-card-bg: #050505;
    --historietas-painel-status-bg: rgba(255,255,255,0.08);
    --historietas-painel-heart-meta: #FFFFFF;
    --historietas-painel-heart-icon: #FFFFFF;
    --historietas-painel-success: #FFFFFF;
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

  html[data-historietas-tema-visual="original"] main > div[aria-hidden="true"],
  html main > div[aria-hidden="true"] {
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
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/painel-autor"],
  html[data-historietas-tema-visual] nav a[href="/painel"],
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/painel"],
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/painel"] {
    background: var(--historietas-bottom-nav-active-bg, rgba(59, 7, 100, 0.54)) !important;
    border-color: var(--historietas-bottom-nav-active-border, rgba(109, 40, 217, 0.48)) !important;
    color: var(--historietas-bottom-nav-active-text, #FFFFFF) !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual] nav a[href="/painel-autor"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/painel-autor"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] nav a[href="/painel"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/painel"] .historietas-bottom-nav-icon,
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/painel"] .historietas-bottom-nav-icon {
    color: var(--historietas-bottom-nav-active-icon-text, #FFFFFF) !important;
    background: var(--historietas-bottom-nav-active-icon-bg, #3B0764) !important;
    border-color: var(--historietas-bottom-nav-active-icon-border, rgba(255,255,255,0.46)) !important;
  }

  html[data-historietas-tema-visual] nav a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) {
    background: transparent !important;
    border-color: transparent !important;
    color: var(--historietas-bottom-nav-text, #9980D8) !important;
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual] input::placeholder,
  html[data-historietas-tema-visual] textarea::placeholder {
    color: var(--historietas-input-placeholder, rgba(212,212,216,0.68)) !important;
  }

  html[data-historietas-tema-visual] input,
  html[data-historietas-tema-visual] textarea,
  html[data-historietas-tema-visual] select {
    color: var(--historietas-input-text, #FFFFFF) !important;
  }

  html button,
  html a {
    box-shadow: none !important;
  }

  html[data-historietas-tema-visual] button:disabled {
    opacity: 0.62 !important;
    cursor: not-allowed !important;
    box-shadow: none !important;
  }

  .painel-autor-orientacoes {
    margin: 0 22px 10px;
    min-width: 0;
    border: 1px solid #363636;
    border-radius: 12px;
    background: var(--historietas-painel-surface, #050505);
    color: #ffffff;
    font-size: 14px;
    line-height: 1.45;
  }

  .painel-autor-orientacoes > summary {
    min-height: 44px;
    box-sizing: border-box;
    padding: 11px 14px;
    cursor: pointer;
    font-weight: 700;
  }

  .painel-autor-orientacoes > summary:focus-visible {
    outline: 2px solid #ffffff;
    outline-offset: -3px;
    border-radius: 12px;
  }

  .painel-autor-orientacoes-conteudo {
    display: grid;
    gap: 12px;
    padding: 0 14px 14px;
    overflow-wrap: anywhere;
  }

  .painel-autor-orientacoes :is(h3, p, dl, dd) {
    margin: 0;
  }

  .painel-autor-orientacoes h3 {
    font-size: 15px;
    font-weight: 700;
  }

  .painel-autor-orientacoes p,
  .painel-autor-orientacoes dd {
    color: #cccccc;
  }

  .painel-autor-orientacoes-totais {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 135px), 1fr));
    gap: 8px;
  }

  .painel-autor-orientacoes-totais > div {
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #363636;
  }

  .painel-autor-orientacoes-totais dd:first-of-type {
    color: #ffffff;
    font-size: 21px;
    font-weight: 700;
  }

  .painel-autor-orientacoes-capitulos > div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .painel-autor-orientacoes :is(.painel-autor-orientacoes-capitulos, .painel-autor-orientacoes-analises) > div {
    border-top: 1px solid #363636;
    padding: 7px 0;
  }

  .painel-autor-orientacoes .painel-autor-orientacoes-capitulos {
    margin-top: 8px;
  }
`;
