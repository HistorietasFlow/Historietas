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

  body {
    background: var(--historietas-bg-start, #000000) !important;
    color: var(--historietas-text-primary, #FFFFFF) !important;
  }

  nav,
  [data-bottom-nav],
  [data-mobile-nav],
  nav:has(a[href="/publicar"]),
  div:has(> a[href="/publicar"]):has(> a[href="/perfil-autor?aba=biblioteca"]) {
    background: var(--historietas-bottom-nav-bg, #000000) !important;
    border-color: var(--historietas-bottom-nav-border, var(--historietas-border-soft, rgba(255,255,255,0.12))) !important;
    box-shadow: var(--historietas-bottom-nav-shadow, none) !important;
    color: var(--historietas-bottom-nav-text, var(--historietas-text-secondary, #A1A1AA)) !important;
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
    color: var(--historietas-bottom-nav-text, var(--historietas-text-secondary, #A1A1AA)) !important;
    box-shadow: none !important;
  }

  nav a:hover,
  [data-bottom-nav] a:hover,
  [data-mobile-nav] a:hover,
  nav button:hover,
  [data-bottom-nav] button:hover,
  [data-mobile-nav] button:hover {
    background: var(--historietas-bottom-nav-hover-bg, var(--historietas-active-surface, rgba(255,255,255,0.055))) !important;
    border-color: var(--historietas-bottom-nav-border, var(--historietas-border-soft, rgba(255,255,255,0.10))) !important;
    color: var(--historietas-bottom-nav-hover-text, var(--historietas-text-primary, #FFFFFF)) !important;
  }

  nav a[href="/"],
  [data-bottom-nav] a[href="/"],
  [data-mobile-nav] a[href="/"] {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.18) !important;
    color: #FFFFFF !important;
  }

  nav a[href="/publicar"],
  [data-bottom-nav] a[href="/publicar"],
  [data-mobile-nav] a[href="/publicar"] {
    background: #000000 !important;
    border-color: #FFFFFF !important;
    box-shadow: none !important;
    color: #FFFFFF !important;
  }

  nav .historietas-bottom-nav-icon,
  [data-bottom-nav] .historietas-bottom-nav-icon,
  [data-mobile-nav] .historietas-bottom-nav-icon {
    color: var(--historietas-bottom-nav-icon-text, #FFFFFF) !important;
    background: var(--historietas-bottom-nav-icon-bg, var(--historietas-surface, rgba(255,255,255,0.045))) !important;
    border-color: var(--historietas-bottom-nav-icon-border, var(--historietas-border-soft, rgba(255,255,255,0.055))) !important;
  }

  nav a[href="/publicar"] .historietas-bottom-nav-icon,
  [data-bottom-nav] a[href="/publicar"] .historietas-bottom-nav-icon,
  [data-mobile-nav] a[href="/publicar"] .historietas-bottom-nav-icon {
    color: #FFFFFF !important;
    background: var(--historietas-bottom-nav-main-icon-bg, rgba(255,255,255,0.16)) !important;
    border-color: var(--historietas-bottom-nav-main-icon-border, rgba(255,255,255,0.18)) !important;
  }



  .historietas-home-search-toggle,
  .historietas-home-search-toggle:hover,
  .historietas-home-search-toggle:active,
  .historietas-home-search-toggle:focus,
  .historietas-home-search-toggle:focus-visible {
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
    outline: none !important;
    filter: none !important;
    backdrop-filter: none !important;
    -webkit-tap-highlight-color: transparent !important;
  }

  .historietas-home-header-search-input,
  .historietas-home-header-search-input:hover,
  .historietas-home-header-search-input:focus,
  .historietas-home-header-search-input:focus-visible {
    border-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
    filter: none !important;
    backdrop-filter: none !important;
  }

  .historietas-home-header {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.10) !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  .historietas-home-logo {
    color: #FFFFFF !important;
  }

  .historietas-home-logo-mark {
    background: #000000 !important;
    border-color: rgba(255,255,255,0.22) !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  .historietas-home-logo-text {
    background: none !important;
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    text-shadow: none !important;
  }

  .historietas-home-header-search-input {
    background: #050505 !important;
    border-color: rgba(255,255,255,0.18) !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
    outline: none !important;
  }

  .historietas-home-header-search-input::placeholder {
    color: #A1A1AA !important;
  }

  .historietas-home-search-toggle,
  .historietas-home-search-toggle:hover,
  .historietas-home-search-toggle:active,
  .historietas-home-search-toggle:focus,
  .historietas-home-search-toggle:focus-visible {
    background: transparent !important;
    border: 0 !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
    outline: none !important;
  }

  .historietas-home-header-actions a {
    background: #050505 !important;
    border-color: rgba(255,255,255,0.18) !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
  }

  .historietas-home-desktop-menu a {
    background: #050505 !important;
    border-color: rgba(255,255,255,0.14) !important;
    color: #D4D4D8 !important;
    box-shadow: none !important;
  }

  .historietas-home-desktop-menu a[href="/"] {
    background: #FFFFFF !important;
    border-color: #FFFFFF !important;
    color: #000000 !important;
  }

  .historietas-home-desktop-links::-webkit-scrollbar {
    display: none;
  }

  .historietas-home-desktop-link:hover,
  .historietas-home-desktop-link:focus-visible {
    color: #FFFFFF !important;
  }

  .historietas-home-desktop-icon-link:hover,
  .historietas-home-desktop-icon-link:focus-visible,
  .historietas-home-desktop-profile-link:hover,
  .historietas-home-desktop-profile-link:focus-visible {
    background: rgba(255,255,255,0.08) !important;
    color: #FFFFFF !important;
    outline: none !important;
  }

`;
