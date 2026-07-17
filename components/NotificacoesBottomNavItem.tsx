"use client";

import Link from "next/link";
import { useNotificacoes } from "./NotificacoesProvider";

type NotificacoesBottomNavItemProps = {
  href?: string;
  className?: string;
};

function normalizarTotalNaoLidas(total: number) {
  if (!Number.isFinite(total)) {
    return 0;
  }

  return Math.max(0, Math.trunc(total));
}

export function NotificacoesBottomNavItem({
  href = "/notificacoes",
  className = "historietas-bottom-nav-item",
}: NotificacoesBottomNavItemProps) {
  const { notificacoesNaoLidas, carregandoNotificacoes } =
    useNotificacoes();

  const totalNaoLidas = normalizarTotalNaoLidas(
    notificacoesNaoLidas,
  );
  const totalFormatado =
    totalNaoLidas > 99 ? "99+" : String(totalNaoLidas);
  const rotuloAcessivel = carregandoNotificacoes
    ? "Notificações, carregando"
    : totalNaoLidas > 0
      ? `Notificações, ${totalFormatado} não lidas`
      : "Notificações";

  return (
    <>
      <style>{notificacoesBottomNavItemCss}</style>

      <Link
        href={href}
        className={className}
        aria-label={rotuloAcessivel}
        aria-busy={carregandoNotificacoes || undefined}
        title={rotuloAcessivel}
      >
        <span
          className="historietas-bottom-nav-icon historietas-notificacoes-bottom-nav-icon"
          aria-hidden="true"
        >
          <svg
            className="historietas-bottom-nav-svg"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18.25 9.9C18.25 6.45 15.95 4.25 12.5 4.25C9.05 4.25 6.75 6.45 6.75 9.9C6.75 13.95 5.4 15.05 4.65 16.05C4.22 16.63 4.63 17.45 5.35 17.45H19.65C20.37 17.45 20.78 16.63 20.35 16.05C19.6 15.05 18.25 13.95 18.25 9.9Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10.35 19.25C10.78 19.9 11.52 20.25 12.5 20.25C13.48 20.25 14.22 19.9 14.65 19.25"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {totalNaoLidas > 0 ? (
            <span
              className="historietas-notificacoes-bottom-nav-badge"
              aria-hidden="true"
            >
              {totalFormatado}
            </span>
          ) : null}
        </span>

        <span className="historietas-bottom-nav-label">
          Notificações
        </span>
      </Link>
    </>
  );
}

const notificacoesBottomNavItemCss = `
  html {
    --historietas-notificacoes-bottom-nav-badge-bg: #DC2626;
    --historietas-notificacoes-bottom-nav-badge-text: #FFFFFF;
    --historietas-notificacoes-bottom-nav-badge-ring: #070212;
  }

  html[data-historietas-tema-visual="foco"] {
    --historietas-notificacoes-bottom-nav-badge-bg: #FFFFFF;
    --historietas-notificacoes-bottom-nav-badge-text: #000000;
    --historietas-notificacoes-bottom-nav-badge-ring: #000000;
  }

  .historietas-notificacoes-bottom-nav-icon {
    position: relative;
  }

  .historietas-notificacoes-bottom-nav-badge {
    position: absolute;
    top: -9px;
    right: -12px;
    z-index: 1;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    background: var(
      --historietas-notificacoes-bottom-nav-badge-bg,
      #DC2626
    );
    color: var(
      --historietas-notificacoes-bottom-nav-badge-text,
      #FFFFFF
    );
    font-size: 10px;
    font-weight: 900;
    line-height: 1;
    white-space: nowrap;
    box-shadow: 0 0 0 2px var(
      --historietas-notificacoes-bottom-nav-badge-ring,
      #070212
    );
    pointer-events: none;
  }
`;