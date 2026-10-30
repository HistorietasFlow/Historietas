export const ajudaPageCss = `
  [data-historietas-ajuda-root="true"] {
    --ajuda-card: color-mix(in srgb, var(--historietas-surface, #120C1E) 88%, transparent);
    --ajuda-card-strong: color-mix(in srgb, var(--historietas-surface-strong, #120C1E) 94%, transparent);
    --ajuda-control: color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent);
    --ajuda-control-hover: color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 12%, transparent);
    --ajuda-border: var(--historietas-border-soft, rgba(255,255,255,0.10));
    --ajuda-muted: var(--historietas-text-secondary, #D4D4D8);
  }

  [data-historietas-ajuda-root="true"] .ajuda-search-input {
    appearance: none;
  }

  [data-historietas-ajuda-root="true"] .ajuda-search-input::-webkit-search-cancel-button {
    appearance: none;
  }

  [data-historietas-ajuda-root="true"] .ajuda-search-input::placeholder {
    color: color-mix(in srgb, var(--ajuda-muted) 70%, transparent);
    opacity: 1;
  }

  [data-historietas-ajuda-root="true"] .ajuda-clear-button {
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--ajuda-control);
    color: var(--historietas-text-primary, #FFFFFF);
    font: inherit;
    font-size: 21px;
    line-height: 1;
    cursor: pointer;
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-button {
    width: 100%;
    min-height: 82px;
    border: 1px solid var(--ajuda-border);
    border-radius: 17px;
    padding: 13px;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr);
    align-items: center;
    gap: 11px;
    background: var(--ajuda-card);
    color: var(--historietas-text-primary, #FFFFFF);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-button:hover {
    transform: translateY(-1px);
    background: var(--ajuda-control-hover);
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-button[data-active="true"] {
    border-color: color-mix(in srgb, var(--historietas-secondary, #7C3AED) 75%, white 8%);
    background: color-mix(in srgb, var(--historietas-secondary, #7C3AED) 22%, var(--ajuda-card-strong));
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-icon,
  [data-historietas-ajuda-root="true"] .ajuda-shortcut-icon {
    width: 40px;
    height: 40px;
    border-radius: 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--ajuda-control);
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-button[data-active="true"] .ajuda-category-icon {
    background: var(--historietas-secondary, #7C3AED);
    color: #FFFFFF;
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-copy,
  [data-historietas-ajuda-root="true"] .ajuda-shortcut-copy {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-copy strong,
  [data-historietas-ajuda-root="true"] .ajuda-shortcut-copy strong {
    color: var(--historietas-text-primary, #FFFFFF);
    font-size: 14px;
    line-height: 1.15;
    font-weight: 820;
  }

  [data-historietas-ajuda-root="true"] .ajuda-category-copy span,
  [data-historietas-ajuda-root="true"] .ajuda-shortcut-copy span {
    color: var(--ajuda-muted);
    font-size: 12px;
    line-height: 1.32;
    font-weight: 560;
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-details {
    border: 1px solid var(--ajuda-border);
    border-radius: 16px;
    background: var(--ajuda-card);
    overflow: hidden;
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-details[open] {
    background: var(--ajuda-card-strong);
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-summary {
    min-height: 64px;
    padding: 13px 14px;
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr) 30px;
    align-items: center;
    gap: 11px;
    color: var(--historietas-text-primary, #FFFFFF);
    cursor: pointer;
    list-style: none;
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-summary::-webkit-details-marker {
    display: none;
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-icon {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--ajuda-control);
    color: var(--historietas-text-primary, #FFFFFF);
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-question {
    min-width: 0;
    color: var(--historietas-text-primary, #FFFFFF);
    font-size: 14px;
    line-height: 1.3;
    font-weight: 760;
    overflow-wrap: anywhere;
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-chevron {
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--ajuda-muted);
    transition: transform 180ms ease;
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-details[open] .ajuda-faq-chevron {
    transform: rotate(180deg);
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-answer {
    padding: 0 16px 16px 63px;
  }

  [data-historietas-ajuda-root="true"] .ajuda-faq-answer p {
    margin: 0;
    padding-top: 13px;
    border-top: 1px solid var(--ajuda-border);
    color: var(--ajuda-muted);
    font-size: 13px;
    line-height: 1.62;
    font-weight: 540;
    overflow-wrap: anywhere;
  }

  [data-historietas-ajuda-root="true"] .ajuda-reset-button {
    min-height: 42px;
    border: 1px solid var(--ajuda-border);
    border-radius: 12px;
    padding: 9px 14px;
    background: var(--historietas-secondary, #7C3AED);
    color: #FFFFFF;
    font: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
  }

  [data-historietas-ajuda-root="true"] .ajuda-shortcut-link {
    min-height: 76px;
    border: 1px solid var(--ajuda-border);
    border-radius: 16px;
    padding: 12px;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) 26px;
    align-items: center;
    gap: 10px;
    background: var(--ajuda-card);
    color: inherit;
    text-decoration: none;
    transition: transform 160ms ease, background 160ms ease;
  }

  [data-historietas-ajuda-root="true"] .ajuda-shortcut-link:hover {
    transform: translateY(-1px);
    background: var(--ajuda-control-hover);
  }

  [data-historietas-ajuda-root="true"] .ajuda-shortcut-arrow {
    width: 26px;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--ajuda-muted);
  }

  [data-historietas-ajuda-root="true"] .ajuda-support-control {
    transition: border-color 160ms ease, background 160ms ease;
  }

  [data-historietas-ajuda-root="true"] .ajuda-support-control:focus {
    border-color: var(--historietas-secondary, #7C3AED) !important;
  }

  [data-historietas-ajuda-root="true"] .ajuda-support-control::placeholder {
    color: color-mix(in srgb, var(--ajuda-muted) 68%, transparent);
    opacity: 1;
  }

  [data-historietas-ajuda-root="true"] .ajuda-submit-ticket-button {
    min-height: 44px;
    border: 0;
    border-radius: 13px;
    padding: 10px 16px;
    background: var(--historietas-secondary, #7C3AED);
    color: #FFFFFF;
    font: inherit;
    font-size: 13px;
    font-weight: 850;
    cursor: pointer;
  }

  [data-historietas-ajuda-root="true"] .ajuda-submit-ticket-button:disabled {
    opacity: 0.52;
    cursor: not-allowed;
  }

  html[data-historietas-tema-visual="foco"] [data-historietas-ajuda-root="true"] {
    --ajuda-card: #050505;
    --ajuda-card-strong: #000000;
    --ajuda-control: rgba(255,255,255,0.08);
    --ajuda-control-hover: rgba(255,255,255,0.10);
    --ajuda-border: rgba(255,255,255,0.18);
    --ajuda-muted: #A1A1AA;
  }

  html[data-historietas-tema-visual="foco"] [data-historietas-ajuda-root="true"] .ajuda-category-button[data-active="true"] {
    border-color: #FFFFFF;
    background: #000000;
  }

  html[data-historietas-tema-visual="foco"] [data-historietas-ajuda-root="true"] .ajuda-category-button[data-active="true"] .ajuda-category-icon,
  html[data-historietas-tema-visual="foco"] [data-historietas-ajuda-root="true"] .ajuda-reset-button {
    background: #FFFFFF;
    color: #000000;
  }

  @media (max-width: 680px) {
    [data-historietas-ajuda-root="true"] .ajuda-faq-answer {
      padding-left: 14px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [data-historietas-ajuda-root="true"] *,
    [data-historietas-ajuda-root="true"] *::before,
    [data-historietas-ajuda-root="true"] *::after {
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
