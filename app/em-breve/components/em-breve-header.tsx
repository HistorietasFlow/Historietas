import Link from "next/link";
import {
  titleHeaderStyle,
  titleLinkStyle,
  titleTextStyle,
  desktopTitleHeaderStyle,
  desktopNotificationButtonStyle,
  desktopNotificationBadgeStyle,
  desktopTitleLinkStyle,
  desktopTitleTextStyle,
} from "../lib/em-breve-styles";

export function EmBreveHeader({
  desktopLayout,
  notificacoesNaoLidas,
}: {
  desktopLayout: boolean;
  notificacoesNaoLidas: number;
}) {
  return (
    <header style={desktopLayout ? desktopTitleHeaderStyle : titleHeaderStyle}>
      <Link
        href="/"
        style={desktopLayout ? desktopTitleLinkStyle : titleLinkStyle}
        aria-label="Voltar para a Home"
      >
        <span
          className="historietas-theme-title"
          style={desktopLayout ? desktopTitleTextStyle : titleTextStyle}
        >
          EM BREVE
        </span>
      </Link>

      {desktopLayout ? (
        <Link
          href="/notificacoes"
          style={desktopNotificationButtonStyle}
          aria-label={
            notificacoesNaoLidas > 0
              ? `Notificações: ${notificacoesNaoLidas} não lidas`
              : "Notificações"
          }
        >
          N

          {notificacoesNaoLidas > 0 ? (
            <span style={desktopNotificationBadgeStyle}>
              {notificacoesNaoLidas > 99
                ? "99+"
                : notificacoesNaoLidas}
            </span>
          ) : null}
        </Link>
      ) : null}
    </header>
  );
}
