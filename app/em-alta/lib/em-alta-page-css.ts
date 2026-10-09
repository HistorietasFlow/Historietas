export const emAltaPageCss = `
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
    --historietas-em-alta-hex-04000a: #000000;
    --historietas-em-alta-hex-061523: #000000;
    --historietas-em-alta-hex-070212: #000000;
    --historietas-em-alta-hex-08030f: #000000;
    --historietas-em-alta-hex-090a18: #000000;
    --historietas-em-alta-hex-0b2235: #000000;
    --historietas-em-alta-hex-0d0917: #000000;
    --historietas-em-alta-hex-0d0b16: #000000;
    --historietas-em-alta-hex-100a14: #000000;
    --historietas-em-alta-hex-101722: #000000;
    --historietas-em-alta-hex-111827: #000000;
    --historietas-em-alta-hex-111c33: #000000;
    --historietas-em-alta-hex-1a202b: #000000;
    --historietas-em-alta-hex-241006: #000000;
    --historietas-em-alta-hex-24140b: #000000;
    --historietas-em-alta-hex-2486c2: #050505;
    --historietas-em-alta-hex-26303d: #000000;
    --historietas-em-alta-hex-271504: #000000;
    --historietas-em-alta-hex-271808: #000000;
    --historietas-em-alta-hex-28101f: #000000;
    --historietas-em-alta-hex-2a0716: #000000;
    --historietas-em-alta-hex-2b1407: #000000;
    --historietas-em-alta-hex-34d399: #FFFFFF;
    --historietas-em-alta-hex-351d0e: #000000;
    --historietas-em-alta-hex-38bdf8: #FFFFFF;
    --historietas-em-alta-hex-3a1020: #000000;
    --historietas-em-alta-hex-3a2508: #000000;
    --historietas-em-alta-hex-64748b: #A1A1AA;
    --historietas-em-alta-hex-7b8aa3: #050505;
    --historietas-em-alta-hex-7c3aed: #FFFFFF;
    --historietas-em-alta-hex-7dd3fc: #FFFFFF;
    --historietas-em-alta-hex-86efac: #D4D4D8;
    --historietas-em-alta-hex-9a3412: #A1A1AA;
    --historietas-em-alta-hex-9a6535: #050505;
    --historietas-em-alta-hex-a32a4b: #050505;
    --historietas-em-alta-hex-a78bfa: #FFFFFF;
    --historietas-em-alta-hex-b57d22: #050505;
    --historietas-em-alta-hex-bae6fd: #D4D4D8;
    --historietas-em-alta-hex-be123c: #A1A1AA;
    --historietas-em-alta-hex-c084fc: #FFFFFF;
    --historietas-em-alta-hex-c4b5fd: #D4D4D8;
    --historietas-em-alta-hex-cbd5e1: #D4D4D8;
    --historietas-em-alta-hex-d8c8ff: #D4D4D8;
    --historietas-em-alta-hex-d97706: #A1A1AA;
    --historietas-em-alta-hex-ddd6fe: #D4D4D8;
    --historietas-em-alta-hex-e0f2fe: #D4D4D8;
    --historietas-em-alta-hex-e2e8f0: #D4D4D8;
    --historietas-em-alta-hex-ecfeff: #FFFFFF;
    --historietas-em-alta-hex-ef4444: #FFFFFF;
    --historietas-em-alta-hex-f472b6: #FFFFFF;
    --historietas-em-alta-hex-f5f3ff: #FFFFFF;
    --historietas-em-alta-hex-f8fafc: #FFFFFF;
    --historietas-em-alta-hex-f97316: #FFFFFF;
    --historietas-em-alta-hex-fb7185: #FFFFFF;
    --historietas-em-alta-hex-fb923c: #FFFFFF;
    --historietas-em-alta-hex-fbbf24: #FFFFFF;
    --historietas-em-alta-hex-fcd34d: #D4D4D8;
    --historietas-em-alta-hex-fda4af: #D4D4D8;
    --historietas-em-alta-hex-fdba74: #D4D4D8;
    --historietas-em-alta-hex-fed7aa: #FFFFFF;
    --historietas-em-alta-hex-fef3c7: #FFFFFF;
    --historietas-em-alta-hex-ffe4e6: #FFFFFF;
    --historietas-em-alta-rgba-10-29-25-0-92: rgba(0,0,0,0.92);
    --historietas-em-alta-rgba-11-17-32-0-92: rgba(0,0,0,0.92);
    --historietas-em-alta-rgba-125-211-252-0-16: rgba(212,212,216,0.16);
    --historietas-em-alta-rgba-125-211-252-0-22: rgba(212,212,216,0.22);
    --historietas-em-alta-rgba-125-211-252-0-42: rgba(212,212,216,0.42);
    --historietas-em-alta-rgba-125-211-252-0-78: rgba(212,212,216,0.78);
    --historietas-em-alta-rgba-125-211-252-0-96: rgba(212,212,216,0.96);
    --historietas-em-alta-rgba-139-92-246-0-18: rgba(212,212,216,0.18);
    --historietas-em-alta-rgba-148-163-184-0-18: rgba(212,212,216,0.18);
    --historietas-em-alta-rgba-16-23-34-0-78: rgba(0,0,0,0.78);
    --historietas-em-alta-rgba-167-139-250-0-12: rgba(212,212,216,0.12);
    --historietas-em-alta-rgba-167-139-250-0-42: rgba(212,212,216,0.42);
    --historietas-em-alta-rgba-167-139-250-0-58: rgba(212,212,216,0.58);
    --historietas-em-alta-rgba-167-139-250-0-96: rgba(212,212,216,0.96);
    --historietas-em-alta-rgba-17-48-39-0-82: rgba(0,0,0,0.82);
    --historietas-em-alta-rgba-18-12-30-0-92: rgba(0,0,0,0.92);
    --historietas-em-alta-rgba-18-12-34-0-92: rgba(0,0,0,0.92);
    --historietas-em-alta-rgba-18-36-54-0-82: rgba(0,0,0,0.82);
    --historietas-em-alta-rgba-192-132-252-0-12: rgba(212,212,216,0.12);
    --historietas-em-alta-rgba-192-132-252-0-42: rgba(212,212,216,0.42);
    --historietas-em-alta-rgba-192-132-252-0-58: rgba(212,212,216,0.58);
    --historietas-em-alta-rgba-20-12-34-0-92: rgba(0,0,0,0.92);
    --historietas-em-alta-rgba-203-213-225-0-13: rgba(212,212,216,0.13);
    --historietas-em-alta-rgba-203-213-225-0-18: rgba(212,212,216,0.18);
    --historietas-em-alta-rgba-203-213-225-0-38: rgba(212,212,216,0.38);
    --historietas-em-alta-rgba-203-213-225-0-68: rgba(212,212,216,0.68);
    --historietas-em-alta-rgba-224-242-254-0-06: rgba(212,212,216,0.06);
    --historietas-em-alta-rgba-224-242-254-0-22: rgba(212,212,216,0.22);
    --historietas-em-alta-rgba-236-254-255-0-96: rgba(212,212,216,0.96);
    --historietas-em-alta-rgba-244-114-182-0-11: rgba(212,212,216,0.11);
    --historietas-em-alta-rgba-244-114-182-0-42: rgba(212,212,216,0.42);
    --historietas-em-alta-rgba-244-114-182-0-58: rgba(212,212,216,0.58);
    --historietas-em-alta-rgba-248-250-252-0-04: rgba(212,212,216,0.04);
    --historietas-em-alta-rgba-248-250-252-0-14: rgba(212,212,216,0.14);
    --historietas-em-alta-rgba-251-113-133-0-12: rgba(212,212,216,0.12);
    --historietas-em-alta-rgba-251-113-133-0-16: rgba(212,212,216,0.16);
    --historietas-em-alta-rgba-251-113-133-0-24: rgba(212,212,216,0.24);
    --historietas-em-alta-rgba-251-113-133-0-42: rgba(212,212,216,0.42);
    --historietas-em-alta-rgba-251-113-133-0-44: rgba(212,212,216,0.44);
    --historietas-em-alta-rgba-251-113-133-0-58: rgba(212,212,216,0.58);
    --historietas-em-alta-rgba-251-113-133-0-74: rgba(212,212,216,0.74);
    --historietas-em-alta-rgba-251-146-60-0-15: rgba(212,212,216,0.15);
    --historietas-em-alta-rgba-251-146-60-0-20: rgba(212,212,216,0.2);
    --historietas-em-alta-rgba-251-146-60-0-22: rgba(212,212,216,0.22);
    --historietas-em-alta-rgba-251-146-60-0-40: rgba(212,212,216,0.4);
    --historietas-em-alta-rgba-251-146-60-0-70: rgba(212,212,216,0.7);
    --historietas-em-alta-rgba-251-191-36-0-16: rgba(212,212,216,0.16);
    --historietas-em-alta-rgba-251-191-36-0-24: rgba(212,212,216,0.24);
    --historietas-em-alta-rgba-251-191-36-0-44: rgba(212,212,216,0.44);
    --historietas-em-alta-rgba-251-191-36-0-72: rgba(212,212,216,0.72);
    --historietas-em-alta-rgba-254-215-170-0-04: rgba(212,212,216,0.04);
    --historietas-em-alta-rgba-254-215-170-0-14: rgba(212,212,216,0.14);
    --historietas-em-alta-rgba-254-243-199-0-05: rgba(212,212,216,0.05);
    --historietas-em-alta-rgba-254-243-199-0-18: rgba(212,212,216,0.18);
    --historietas-em-alta-rgba-255-228-230-0-05: rgba(212,212,216,0.05);
    --historietas-em-alta-rgba-255-228-230-0-16: rgba(212,212,216,0.16);
    --historietas-em-alta-rgba-29-13-27-0-92: rgba(0,0,0,0.92);
    --historietas-em-alta-rgba-30-13-31-0-92: rgba(0,0,0,0.92);
    --historietas-em-alta-rgba-34-197-94-0-14: rgba(161,161,170,0.14);
    --historietas-em-alta-rgba-34-197-94-0-3: rgba(161,161,170,0.3);
    --historietas-em-alta-rgba-36-16-6-0-78: rgba(0,0,0,0.78);
    --historietas-em-alta-rgba-37-27-60-0-82: rgba(0,0,0,0.82);
    --historietas-em-alta-rgba-39-21-4-0-78: rgba(0,0,0,0.78);
    --historietas-em-alta-rgba-4-0-10-0-72: rgba(0,0,0,0.72);
    --historietas-em-alta-rgba-40-25-62-0-82: rgba(0,0,0,0.82);
    --historietas-em-alta-rgba-41-27-53-0-82: rgba(0,0,0,0.82);
    --historietas-em-alta-rgba-42-7-22-0-78: rgba(0,0,0,0.78);
    --historietas-em-alta-rgba-52-211-153-0-11: rgba(161,161,170,0.11);
    --historietas-em-alta-rgba-52-211-153-0-42: rgba(161,161,170,0.42);
    --historietas-em-alta-rgba-52-211-153-0-58: rgba(161,161,170,0.58);
    --historietas-em-alta-rgba-54-20-38-0-82: rgba(0,0,0,0.82);
    --historietas-em-alta-rgba-54-22-45-0-82: rgba(0,0,0,0.82);
    --historietas-em-alta-rgba-56-189-248-0-12: rgba(212,212,216,0.12);
    --historietas-em-alta-rgba-56-189-248-0-22: rgba(212,212,216,0.22);
    --historietas-em-alta-rgba-56-189-248-0-42: rgba(212,212,216,0.42);
    --historietas-em-alta-rgba-56-189-248-0-58: rgba(212,212,216,0.58);
    --historietas-em-alta-rgba-59-7-100-0-58: rgba(0,0,0,0.58);
    --historietas-em-alta-rgba-6-21-35-0-76: rgba(0,0,0,0.76);
    --historietas-page-background: #000000;
    --historietas-bg-start: #000000;
    --historietas-bg-mid: #000000;
    --historietas-bg-end: #000000;
    --historietas-surface: #050505;
    --historietas-surface-strong: #000000;
    --historietas-text-primary: #FFFFFF;
    --historietas-text-secondary: #A1A1AA;
    --historietas-accent: #FFFFFF;
    --historietas-secondary: #A1A1AA;
    --historietas-border-soft: rgba(255,255,255,0.18);
    --historietas-active-surface: rgba(255,255,255,0.10);
    --historietas-secondary-surface: rgba(255,255,255,0.06);
    --historietas-title-from: #FFFFFF;
    --historietas-title-mid: #FFFFFF;
    --historietas-title-to: #FFFFFF;
    }




  body,
  main.historietas-em-alta-page {
    background: #000000 !important;
    color: #FFFFFF !important;
    color-scheme: dark;
  }

  .historietas-em-alta-page,
  .historietas-em-alta-page *,
  .historietas-em-alta-page *::before,
  .historietas-em-alta-page *::after {
    -webkit-tap-highlight-color: transparent !important;
  }

  .historietas-em-alta-page a,
  .historietas-em-alta-page button,
  .historietas-em-alta-page [role="link"],
  .historietas-em-alta-page [role="button"] {
    -webkit-tap-highlight-color: transparent !important;
    -webkit-touch-callout: none;
    touch-action: manipulation;
  }

  .historietas-em-alta-page a:active,
  .historietas-em-alta-page button:active,
  .historietas-em-alta-page [role="link"]:active,
  .historietas-em-alta-page [role="button"]:active,
  .historietas-em-alta-page a:focus,
  .historietas-em-alta-page button:focus,
  .historietas-em-alta-page [role="link"]:focus,
  .historietas-em-alta-page [role="button"]:focus,
  .historietas-em-alta-page a:focus-visible,
  .historietas-em-alta-page button:focus-visible,
  .historietas-em-alta-page [role="link"]:focus-visible,
  .historietas-em-alta-page [role="button"]:focus-visible {
    outline: none !important;
  }

  .historietas-ranking-card[data-ranking-level="diamante"] {
    --historietas-ranking-line-color: #7DD3FC;
  }

  .historietas-ranking-card[data-ranking-level="rubi"] {
    --historietas-ranking-line-color: #FB7185;
  }

  .historietas-ranking-card[data-ranking-level="ouro"] {
    --historietas-ranking-line-color: #FBBF24;
  }

  .historietas-ranking-card[data-ranking-level="prata"] {
    --historietas-ranking-line-color: #CBD5E1;
  }

  .historietas-ranking-card[data-ranking-level="bronze"] {
    --historietas-ranking-line-color: #FB923C;
  }

  .historietas-em-alta-page article {
    background: #050505 !important;
    background-color: #050505 !important;
    background-image: none !important;
    border: 1px solid rgba(255,255,255,0.18) !important;
    box-shadow: none !important;
  }

  .historietas-em-alta-page article.historietas-ranking-card {
    border-color: var(--historietas-ranking-line-color, rgba(255,255,255,0.18)) !important;
  }

  .historietas-ranking-card .historietas-ranking-level-line {
    border: 1px solid var(--historietas-ranking-line-color, rgba(255,255,255,0.18)) !important;
    background: transparent !important;
    background-color: transparent !important;
    background-image: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }

  .historietas-em-alta-page *,
  .historietas-em-alta-page *::before,
  .historietas-em-alta-page *::after {
    box-shadow: none !important;
    text-shadow: none !important;
  }

  .historietas-em-alta-hero-title {
    background: none !important;
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    text-shadow: none !important;
  }

  .historietas-em-alta-emoji-icon {
    filter: none !important;
  }

  .historietas-em-alta-heart-icon {
    color: #EF4444 !important;
    -webkit-text-fill-color: #EF4444 !important;
  }

  .historietas-em-alta-logo-mark {
    background: #050505 !important;
    color: #FFFFFF !important;
    border-color: rgba(255,255,255,0.18) !important;
    box-shadow: none !important;
  }

  .historietas-em-alta-page > div[aria-hidden="true"] {
    opacity: 0 !important;
  }

  input::placeholder,
  textarea::placeholder {
    color: #A1A1AA !important;
    opacity: 1 !important;
  }

  input,
  textarea,
  select {
    background: #000000 !important;
    color: #FFFFFF !important;
    border-color: rgba(255,255,255,0.18) !important;
  }

  nav a[href="/em-alta"],
  [data-bottom-nav] a[href="/em-alta"],
  [data-mobile-nav] a[href="/em-alta"] {
    background: transparent !important;
    background-image: none !important;
    border: 0 !important;
    box-shadow: none !important;
    outline: none !important;
  }

  nav a[href="/em-alta"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  [data-bottom-nav] a[href="/em-alta"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
  [data-mobile-nav] a[href="/em-alta"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) {
    color: var(--historietas-bottom-nav-text, #A1A1AA) !important;
    -webkit-text-fill-color: var(--historietas-bottom-nav-text, #A1A1AA) !important;
  }

  nav a[href="/em-alta"][aria-current="page"],
  nav a[href="/em-alta"].historietas-bottom-nav-item-active,
  [data-bottom-nav] a[href="/em-alta"][aria-current="page"],
  [data-bottom-nav] a[href="/em-alta"].historietas-bottom-nav-item-active,
  [data-mobile-nav] a[href="/em-alta"][aria-current="page"],
  [data-mobile-nav] a[href="/em-alta"].historietas-bottom-nav-item-active {
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
  }

  nav a[href="/em-alta"] .historietas-bottom-nav-icon,
  [data-bottom-nav] a[href="/em-alta"] .historietas-bottom-nav-icon,
  [data-mobile-nav] a[href="/em-alta"] .historietas-bottom-nav-icon {
    color: currentColor !important;
    background: transparent !important;
    background-image: none !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    filter: none !important;
  }

  nav a[href="/em-alta"] .historietas-bottom-nav-svg,
  nav a[href="/em-alta"] .historietas-bottom-nav-svg *,
  [data-bottom-nav] a[href="/em-alta"] .historietas-bottom-nav-svg,
  [data-bottom-nav] a[href="/em-alta"] .historietas-bottom-nav-svg *,
  [data-mobile-nav] a[href="/em-alta"] .historietas-bottom-nav-svg,
  [data-mobile-nav] a[href="/em-alta"] .historietas-bottom-nav-svg * {
    color: currentColor !important;
    stroke: currentColor !important;
  }
`;
