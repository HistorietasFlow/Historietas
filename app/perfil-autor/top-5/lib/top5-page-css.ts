export const top5PerfilAutorPageCss = `
  html {
    --historietas-top5-message: #FDE68A;
    --historietas-top5-purple-page: rgba(124,58,237,0.12);
    --historietas-top5-purple-empty: rgba(124,58,237,0.18);
    --historietas-top5-purple-cover: rgba(124,58,237,0.22);
    --historietas-top5-orange-soft: rgba(249,115,22,0.10);
    --historietas-top5-orange-cover: rgba(249,115,22,0.13);
    --historietas-top5-orange-border: rgba(249,115,22,0.20);
  }

  html[data-historietas-tema-visual="foco"] {
    --historietas-top5-message: #FFFFFF;
    --historietas-top5-purple-page: rgba(255,255,255,0.06);
    --historietas-top5-purple-empty: rgba(255,255,255,0.08);
    --historietas-top5-purple-cover: rgba(255,255,255,0.10);
    --historietas-top5-orange-soft: rgba(255,255,255,0.06);
    --historietas-top5-orange-cover: rgba(255,255,255,0.08);
    --historietas-top5-orange-border: rgba(255,255,255,0.18);
  }

  html[data-historietas-tema-visual="original"] body {
    background: #000000 !important;
  }

  html[data-historietas-tema-visual="foco"] body,
  html[data-historietas-tema-visual="foco"] main {
    background: #000000 !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] input::placeholder {
    color: rgba(212,212,216,0.68) !important;
  }

  html[data-historietas-tema-visual="foco"] input,
  html[data-historietas-tema-visual="foco"] button,
  html[data-historietas-tema-visual="foco"] a {
    color: #FFFFFF;
  }


  @media (min-width: 768px) {
    [data-historietas-top5-works-grid="true"] {
      grid-template-columns: repeat(
        auto-fill,
        minmax(138px, 1fr)
      ) !important;
      row-gap: 12px !important;
      column-gap: 14px !important;
    }
  }
`;
