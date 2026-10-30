export const excluirContaPageCss = `
  .exclusao-conta-page { padding: 28px 18px 120px; box-sizing: border-box; }
  .exclusao-conta-shell { width: min(760px, 100%); margin: 0 auto; display: grid; gap: 18px; }
  .exclusao-conta-voltar { color: var(--historietas-text-secondary, #c4b5fd); text-decoration: none; font-weight: 750; }
  .exclusao-conta-hero { padding: 18px 2px 4px; }
  .exclusao-conta-selo { display: inline-flex; padding: 7px 11px; border-radius: 999px; background: rgba(139,92,246,.16); border: 1px solid rgba(167,139,250,.28); color: #ddd6fe; font-size: 12px; font-weight: 850; text-transform: uppercase; letter-spacing: .04em; }
  .exclusao-conta-hero h1 { margin: 15px 0 9px; font-size: clamp(30px, 7vw, 48px); line-height: 1; letter-spacing: -.045em; }
  .exclusao-conta-hero p, .exclusao-conta-card p { color: var(--historietas-text-secondary, rgba(255,255,255,.67)); line-height: 1.55; }
  .exclusao-conta-card { padding: 22px; border-radius: 22px; background: rgba(255,255,255,.055); border: 1px solid rgba(255,255,255,.09); box-shadow: 0 18px 60px rgba(0,0,0,.24); }
  .exclusao-conta-card-destaque { border-color: rgba(167,139,250,.28); background: linear-gradient(180deg, rgba(91,33,182,.18), rgba(255,255,255,.04)); }
  .exclusao-conta-card h2 { margin: 0 0 8px; font-size: 21px; }
  .exclusao-conta-card ul { padding-left: 22px; color: rgba(255,255,255,.8); line-height: 1.55; }
  .exclusao-conta-aviso { padding: 13px 14px; border-radius: 14px; background: rgba(127,29,29,.18); border: 1px solid rgba(248,113,113,.25); color: #fecaca !important; }
  .exclusao-conta-acoes { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
  .exclusao-conta-botao, .exclusao-conta-enviar { min-height: 46px; padding: 11px 16px; border: 0; border-radius: 13px; display: inline-flex; align-items: center; justify-content: center; font: inherit; font-weight: 850; text-decoration: none; cursor: pointer; }
  .exclusao-conta-botao.primario, .exclusao-conta-enviar { background: var(--historietas-accent, #8b5cf6); color: #fff; }
  .exclusao-conta-botao.secundario { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); color: #fff; }
  .exclusao-conta-form { display: grid; gap: 15px; margin-top: 18px; }
  .exclusao-conta-honeypot { position: absolute !important; left: -10000px !important; width: 1px !important; height: 1px !important; overflow: hidden !important; opacity: 0 !important; pointer-events: none !important; }
  .exclusao-conta-form label:not(.exclusao-conta-checkbox) { display: grid; gap: 7px; color: rgba(255,255,255,.75); font-size: 13px; font-weight: 800; }
  .exclusao-conta-form input[type=email], .exclusao-conta-form textarea { width: 100%; box-sizing: border-box; padding: 12px 13px; border-radius: 13px; border: 1px solid rgba(255,255,255,.14); outline: 0; background: rgba(255,255,255,.07); color: #fff; font: inherit; }
  .exclusao-conta-checkbox { display: grid; grid-template-columns: 20px minmax(0,1fr); gap: 10px; align-items: start; color: rgba(255,255,255,.75); line-height: 1.4; font-size: 13px; }
  .exclusao-conta-checkbox input { width: 18px; height: 18px; accent-color: var(--historietas-accent, #8b5cf6); }
  .exclusao-conta-erro { padding: 12px 13px; border-radius: 13px; background: rgba(127,29,29,.2); border: 1px solid rgba(248,113,113,.3); color: #fecaca; font-size: 13px; font-weight: 750; }
  .exclusao-conta-sucesso { display: grid; gap: 5px; margin-top: 16px; padding: 15px; border-radius: 15px; background: rgba(20,83,45,.23); border: 1px solid rgba(74,222,128,.28); color: #bbf7d0; }
  .exclusao-conta-enviar:disabled { opacity: .6; cursor: not-allowed; }
  .exclusao-conta-rodape { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; color: rgba(255,255,255,.45); font-size: 13px; }
  .exclusao-conta-rodape a { color: rgba(255,255,255,.7); }
  @media (max-width: 560px) { .exclusao-conta-card { padding: 18px; } .exclusao-conta-acoes { display: grid; } }
`;
