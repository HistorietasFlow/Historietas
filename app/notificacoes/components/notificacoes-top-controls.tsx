"use client";

import {
  desktopNotificationsFilterButtonStyle,
  desktopNotificationsSearchIconStyle,
  desktopNotificationsSearchInputStyle,
  desktopNotificationsSearchShellStyle,
  desktopNotificationsTitleStyle,
  desktopNotificationsTopActionsStyle,
  desktopTitleHeaderStyle,
  mobileSearchToggleStyle,
  notificationSearchInputStyle,
  notificationSearchShellStyle,
  notificacoesHeaderFilterButtonStyle,
  notificacoesHeaderFilterIconStyle,
  titleHeaderStyle,
} from "../lib/notificacoes-shell-styles";

type NotificacoesTopControlsProps = {
  isDesktop: boolean;
  busca: string;
  buscaTopoAberta: boolean;
  mostrarPainelOrdenacao: boolean;
  onBuscaChange: (busca: string) => void;
  onAlternarPainelOrdenacao: () => void;
  onAbrirBusca: () => void;
  onFecharBusca: () => void;
};

export default function NotificacoesTopControls({
  isDesktop,
  busca,
  buscaTopoAberta,
  mostrarPainelOrdenacao,
  onBuscaChange,
  onAlternarPainelOrdenacao,
  onAbrirBusca,
  onFecharBusca,
}: NotificacoesTopControlsProps) {
  if (isDesktop) {
    return (
      <div style={desktopTitleHeaderStyle}>
        <h1 style={desktopNotificationsTitleStyle}>Notificações</h1>

        <div style={desktopNotificationsTopActionsStyle}>
          <label style={desktopNotificationsSearchShellStyle}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              style={desktopNotificationsSearchIconStyle}
            >
              <circle
                cx="10.85"
                cy="10.85"
                r="6.65"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M16.05 16.05L20.25 20.25"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            <input
              value={busca}
              onChange={(event) => onBuscaChange(event.target.value)}
              className="notificacoes-search-input"
              aria-label="Buscar notificações..."
              placeholder="Buscar notificações..."
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={90}
              style={desktopNotificationsSearchInputStyle}
              type="text"
            />
          </label>

          <button
            type="button"
            onClick={onAlternarPainelOrdenacao}
            style={desktopNotificationsFilterButtonStyle}
            aria-label="Abrir opções das notificações"
            aria-expanded={mostrarPainelOrdenacao}
          >
            <span>Filtros</span>
            <span aria-hidden="true">+</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={titleHeaderStyle}>
      <button
        type="button"
        onClick={onAlternarPainelOrdenacao}
        style={notificacoesHeaderFilterButtonStyle}
        aria-label="Abrir opções das notificações"
        aria-expanded={mostrarPainelOrdenacao}
      >
        <span>Notificações</span>
        <span style={notificacoesHeaderFilterIconStyle} aria-hidden="true">
          +
        </span>
      </button>

      {buscaTopoAberta || Boolean(busca.trim()) ? (
        <>
          <label style={notificationSearchShellStyle}>
            <input
              value={busca}
              onChange={(event) => onBuscaChange(event.target.value)}
              className="notificacoes-search-input"
              aria-label="Buscar notificações..."
              placeholder="Buscar notificações..."
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={90}
              style={notificationSearchInputStyle}
              type="text"
              autoFocus
            />
          </label>

          <button
            type="button"
            onClick={onFecharBusca}
            aria-label="Fechar busca"
            aria-expanded="true"
            style={mobileSearchToggleStyle}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle
                cx="10.85"
                cy="10.85"
                r="6.65"
                stroke="currentColor"
                strokeWidth="2.15"
              />
              <path
                d="M16.05 16.05L20.25 20.25"
                stroke="currentColor"
                strokeWidth="2.15"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={onAbrirBusca}
          aria-label="Abrir busca"
          aria-expanded="false"
          style={mobileSearchToggleStyle}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              cx="10.85"
              cy="10.85"
              r="6.65"
              stroke="currentColor"
              strokeWidth="2.15"
            />
            <path
              d="M16.05 16.05L20.25 20.25"
              stroke="currentColor"
              strokeWidth="2.15"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
