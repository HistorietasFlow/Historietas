export const themePageCss = `
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

  body,
  main {
    background: #000000 !important;
    color: var(--historietas-text-primary, #FFFFFF) !important;
  }

  main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  .explorar-carousel {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .explorar-carousel::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }

  nav,
  [data-bottom-nav],
  [data-mobile-nav],
  nav:has(a[href="/publicar"]),
  div:has(> a[href="/publicar"]):has(> a[href="/perfil-autor?aba=biblioteca"]) {
    background: var(--historietas-bottom-nav-bg, #000000) !important;
    border-color: var(--historietas-bottom-nav-border, rgba(255,255,255,0.18)) !important;
    box-shadow: var(--historietas-bottom-nav-shadow, none) !important;
    color: var(--historietas-bottom-nav-text, #A1A1AA) !important;
  }

  nav::before,
  [data-bottom-nav]::before,
  [data-mobile-nav]::before {
    background: var(--historietas-bottom-nav-shine, none) !important;
  }

  nav a,
  [data-bottom-nav] a,
  [data-mobile-nav] a,
  nav button,
  [data-bottom-nav] button,
  [data-mobile-nav] button {
    color: var(--historietas-bottom-nav-text, #A1A1AA) !important;
    box-shadow: none !important;
  }

  @media (hover: hover) and (pointer: fine) {
    nav a:hover,
    [data-bottom-nav] a:hover,
    [data-mobile-nav] a:hover,
    nav button:hover,
    [data-bottom-nav] button:hover,
    [data-mobile-nav] button:hover {
      background: var(--historietas-bottom-nav-hover-bg, rgba(255,255,255,0.06)) !important;
      border-color: var(--historietas-bottom-nav-border, rgba(255,255,255,0.18)) !important;
      color: var(--historietas-bottom-nav-hover-text, #FFFFFF) !important;
    }
  }

  nav a[href="/explorar"],
  [data-bottom-nav] a[href="/explorar"],
  [data-mobile-nav] a[href="/explorar"] {
    background: var(--historietas-bottom-nav-active-bg, rgba(255,255,255,0.10)) !important;
    border-color: var(--historietas-bottom-nav-active-border, #FFFFFF) !important;
    color: #FFFFFF !important;
  }

  nav a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  [data-bottom-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  [data-mobile-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) {
    background: transparent !important;
    border-color: transparent !important;
    box-shadow: none !important;
    color: var(--historietas-bottom-nav-text, #A1A1AA) !important;
  }

  nav .historietas-bottom-nav-icon,
  [data-bottom-nav] .historietas-bottom-nav-icon,
  [data-mobile-nav] .historietas-bottom-nav-icon {
    color: var(--historietas-bottom-nav-icon-text, #A1A1AA) !important;
    background: var(--historietas-bottom-nav-icon-bg, #050505) !important;
    border-color: var(--historietas-bottom-nav-icon-border, rgba(255,255,255,0.18)) !important;
  }

  nav a[href="/explorar"] .historietas-bottom-nav-icon,
  [data-bottom-nav] a[href="/explorar"] .historietas-bottom-nav-icon,
  [data-mobile-nav] a[href="/explorar"] .historietas-bottom-nav-icon {
    color: #FFFFFF !important;
    background: var(--historietas-bottom-nav-active-icon-bg, #050505) !important;
    border-color: var(--historietas-bottom-nav-active-icon-border, #FFFFFF) !important;
  }

  nav a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) .historietas-bottom-nav-icon,
  [data-bottom-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) .historietas-bottom-nav-icon,
  [data-mobile-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) .historietas-bottom-nav-icon {
    color: var(--historietas-bottom-nav-icon-text, #A1A1AA) !important;
    background: var(--historietas-bottom-nav-icon-bg, #050505) !important;
    border-color: var(--historietas-bottom-nav-icon-border, rgba(255,255,255,0.18)) !important;
  }

  input::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  input,
  textarea,
  select {
    color: #FFFFFF !important;
  }

  button {
    color: inherit;
  }


  [data-historietas-page-background-action="true"] {
    background: var(--historietas-bg-start, #000000) !important;
    background-color: var(--historietas-bg-start, #000000) !important;
    background-image: none !important;
    box-shadow: none !important;
  }
`;
