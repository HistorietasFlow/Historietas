export const listasPageCss = `
  html {
    --historietas-list-like-active: #FFFFFF;
    --historietas-list-diary-rating: #FFFFFF;
    --historietas-list-diary-rating-muted: rgba(255,255,255,0.30);
    --historietas-list-comments-send-text: #000000;
  }

  @keyframes historietas-list-heart-pop {
    0% { transform: scale(1); }
    45% { transform: scale(1.28); }
    100% { transform: scale(1); }
  }

  @keyframes historietas-list-comments-sheet-up {
    from { transform: translateY(100%); opacity: 0.75; }
    to { transform: translateY(0); opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    .historietas-list-annotation svg {
      animation-duration: 1ms !important;
    }
  }

  body,
  main {
    background: #000000 !important;
    color: #FFFFFF !important;
  }

  .historietas-list-row {
    min-width: 0;
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40px;
    align-items: stretch;
  }

  .historietas-list-annotation {
    grid-column: 1 / -1;
    padding: 0 44px 13px 4px;
  }

  .historietas-list-row::after {
    content: "";
    position: absolute;
    left: 82px;
    right: 4px;
    bottom: 0;
    height: 1px;
    background: rgba(255,255,255,0.10);
    pointer-events: none;
  }

  .historietas-list-row:last-child::after {
    display: none;
  }

  .historietas-list-row-highlight {
    border-radius: 14px;
    background: rgba(255,255,255,0.10);
    box-shadow: 0 0 0 2px rgba(255,255,255,0.72);
    animation: historietas-list-highlight 2.4s ease both;
  }

  @keyframes historietas-list-highlight {
    0%, 100% { background: rgba(255,255,255,0.04); }
    25%, 70% { background: rgba(255,255,255,0.14); }
  }

  .historietas-list-spinner {
    width: 23px;
    height: 23px;
    border: 3px solid rgba(255,255,255,0.16);
    border-top-color: #FFFFFF;
    border-radius: 999px;
    animation: historietas-list-spin 0.75s linear infinite;
  }

  @keyframes historietas-list-spin {
    to { transform: rotate(360deg); }
  }

  @media (min-width: 760px) {
    .historietas-list-row a {
      min-height: 108px !important;
      padding: 10px 0 10px 18px !important;
    }

    .historietas-list-row > button {
      margin-right: 12px !important;
    }

    .historietas-list-annotation {
      padding-left: 18px;
      padding-right: 58px;
    }

    .historietas-list-row::after {
      left: 98px;
      right: 18px;
    }
  }
`;
