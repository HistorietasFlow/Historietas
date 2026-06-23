"use client";

import Link from "next/link";
import { useNotificacoes } from "./NotificacoesProvider";

type NotificacoesBottomNavItemProps = {
  href?: string;
  className?: string;
};

export function NotificacoesBottomNavItem({
  href = "/notificacoes",
  className = "historietas-bottom-nav-item",
}: NotificacoesBottomNavItemProps) {
  const { notificacoesNaoLidas } = useNotificacoes();
  const totalFormatado =
    notificacoesNaoLidas > 99 ? "99+" : String(notificacoesNaoLidas);

  return (
    <Link href={href} className={className} aria-label="Notificações">
      <span
        className="historietas-bottom-nav-icon"
        aria-hidden="true"
        style={{ position: "relative" }}
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

        {notificacoesNaoLidas > 0 ? (
          <span
            aria-label={`${totalFormatado} notificações não lidas`}
            style={{
              position: "absolute",
              top: "-9px",
              right: "-12px",
              minWidth: "18px",
              height: "18px",
              borderRadius: "999px",
              padding: "0 5px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#dc2626",
              color: "#fff",
              fontSize: "10px",
              fontWeight: 900,
              lineHeight: 1,
              boxShadow: "0 0 0 2px #04000A",
            }}
          >
            {totalFormatado}
          </span>
        ) : null}
      </span>

      <span className="historietas-bottom-nav-label">Notificações</span>
    </Link>
  );
}
