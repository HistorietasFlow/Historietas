// Escopo exclusivo da seção nova: não modifica cards/rankings legados.
export const rankingGeralCss = `
  .ranking-geral-historias { color: var(--historietas-text-primary, #fff); }
  .ranking-geral-historias .ranking-geral-descricao {
    max-width: 620px; margin: 8px auto 0; font-size: 14px; line-height: 1.6;
    color: var(--historietas-text-secondary, #a1a1aa);
  }
  .ranking-geral-lista { display: grid; gap: 12px; list-style: none; padding: 0; margin: 24px 0; }
  .ranking-geral-card {
    display: grid; grid-template-columns: 48px minmax(0, 1fr); align-items: start;
    gap: 16px; padding: 20px; border-radius: 20px; min-width: 0;
    background: var(--historietas-surface, #080808);
    border: 1px solid var(--historietas-border-soft, rgba(255,255,255,.14));
  }
  .ranking-geral-posicao {
    display: flex; align-items: center; justify-content: center; min-height: 48px;
    padding: 4px; box-sizing: border-box; border-radius: 14px;
    background: rgba(128,128,128,.14); font-weight: 900; font-size: 18px;
    font-variant-numeric: tabular-nums; overflow-wrap: anywhere;
  }
  .ranking-geral-info { min-width: 0; }
  .ranking-geral-obra {
    display: inline-block; max-width: 100%; min-height: 44px; box-sizing: border-box;
    padding: 8px 0; color: inherit; font-size: 18px; line-height: 1.4;
    font-weight: 800; text-decoration: none; overflow-wrap: anywhere;
  }
  .ranking-geral-obra:hover { text-decoration: underline; text-underline-offset: 4px; }
  .ranking-geral-metricas { margin: 6px 0 10px; font-size: 14px; line-height: 1.7;
    color: var(--historietas-text-secondary, #a1a1aa); overflow-wrap: anywhere; }
  .ranking-geral-aviso { display: inline-block; padding: 5px 10px; border-radius: 999px;
    background: rgba(128,128,128,.12); border: 1px solid rgba(128,128,128,.3);
    font-size: 12px; font-weight: 700; line-height: 1.5; }
  .ranking-geral-paginacao { display: flex; flex-wrap: wrap; gap: 12px; justify-content: flex-end;
    padding: 8px 0 16px; scroll-margin-bottom: calc(120px + env(safe-area-inset-bottom, 0px)); }
  .ranking-geral-historias button {
    min-height: 48px; padding: 12px 20px; border-radius: 14px; font: inherit;
    font-size: 14px; line-height: 1.5; font-weight: 750; cursor: pointer;
    color: var(--historietas-text-primary, #fff); background: var(--historietas-surface, #080808);
    border: 1px solid var(--historietas-border-soft, rgba(255,255,255,.3));
    overflow-wrap: anywhere; scroll-margin-block: 24px calc(120px + env(safe-area-inset-bottom, 0px));
  }
  .ranking-geral-historias button:hover { background: rgba(128,128,128,.2); }
  .ranking-geral-historias .ranking-geral-proxima { background: #fff; color: #111; border-color: #fff; }
  .ranking-geral-historias .ranking-geral-proxima:hover { background: #e4e4e7; }
  .ranking-geral-historias :is(button, a, h2):focus-visible { outline: 3px solid #a78bfa; outline-offset: 4px; }
  @media (max-width: 600px) {
    .ranking-geral-card { grid-template-columns: 40px minmax(0, 1fr); gap: 12px; padding: 16px; border-radius: 16px; }
    .ranking-geral-posicao { min-height: 40px; font-size: 16px; border-radius: 12px; }
    .ranking-geral-obra { font-size: 16px; }
    .ranking-geral-paginacao { padding-bottom: calc(104px + env(safe-area-inset-bottom, 0px)); }
    .ranking-geral-paginacao button { flex: 1 1 180px; }
  }
`;
