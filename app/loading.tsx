export default function Loading() {
  return (
    <main className="historietas-loading-page" aria-busy="true">
      <style>{loadingCss}</style>
      <section role="status" aria-live="polite" aria-label="Carregando página">
        <span className="historietas-loading-logo" aria-hidden="true">
          H
        </span>
        <span className="historietas-loading-label">Carregando…</span>
        <div className="historietas-loading-line historietas-loading-line-title" />
        <div className="historietas-loading-line" />
        <div className="historietas-loading-line historietas-loading-line-short" />
        <div className="historietas-loading-cards" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>
    </main>
  );
}

const loadingCss = `
  .historietas-loading-page {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: 24px 16px calc(104px + env(safe-area-inset-bottom));
    box-sizing: border-box;
    background: var(--historietas-page-background, #000);
    color: var(--historietas-text-primary, #fff);
  }

  .historietas-loading-page section {
    width: min(620px, 100%);
    display: grid;
    gap: 12px;
    padding: clamp(24px, 6vw, 42px);
    box-sizing: border-box;
    border: 1px solid var(--historietas-border-soft, rgba(255,255,255,.18));
    border-radius: 28px;
    background: var(--historietas-surface, #050505);
  }

  .historietas-loading-logo {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: var(--historietas-accent, #fff);
    color: var(--historietas-page-background, #000);
    font-weight: 950;
  }

  .historietas-loading-label {
    width: 1px;
    height: 1px;
    overflow: hidden;
    position: absolute;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .historietas-loading-line,
  .historietas-loading-cards span {
    display: block;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      var(--historietas-secondary-surface, rgba(255,255,255,.06)) 20%,
      var(--historietas-active-surface, rgba(255,255,255,.12)) 45%,
      var(--historietas-secondary-surface, rgba(255,255,255,.06)) 70%
    );
    background-size: 220% 100%;
    animation: historietas-loading-pulse 1.4s ease-in-out infinite;
  }

  .historietas-loading-line { height: 14px; }
  .historietas-loading-line-title { width: 74%; height: 28px; margin-top: 16px; }
  .historietas-loading-line-short { width: 58%; }

  .historietas-loading-cards {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-top: 18px;
  }

  .historietas-loading-cards span { min-height: 112px; border-radius: 18px; }

  @keyframes historietas-loading-pulse {
    from { background-position: 100% 0; }
    to { background-position: -120% 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .historietas-loading-line,
    .historietas-loading-cards span { animation: none; }
  }
`;
