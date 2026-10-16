"use client";

import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import {
  desktopActiveLinkStyle,
  desktopHeaderActionsStyle,
  desktopHeaderIconLinkStyle,
  desktopInlineSearchAreaStyle,
  desktopInputStyle,
  desktopLinkStyle,
  desktopLogoMarkStyle,
  desktopLogoStyle,
  desktopLogoTextStyle,
  desktopMenuStyle,
  desktopNavInnerStyle,
  desktopNavStyle,
  desktopNotificationCountBadgeStyle,
  desktopProfileAvatarStyle,
  desktopProfileLinkStyle,
  desktopSearchIconStyle,
  logoMarkStyle,
  logoStyle,
  logoTextStyle,
  mobileHeaderSearchAreaStyle,
  mobileHeaderSearchInputStyle,
  mobileNavStyle,
  mobileSearchToggleActiveStyle,
  mobileSearchToggleStyle,
  navIconsStyle,
  navInnerStyle,
  navTopRowStyle,
} from "../app/lib/home-shell-header-styles";

export default function HomeHeader({
  isDesktop,
  busca,
  setBusca,
  buscaMobileAberta,
  setBuscaMobileAberta,
  notificacoesNaoLidas,
  usuarioLogado,
}: {
  isDesktop: boolean;
  busca: string;
  setBusca: Dispatch<SetStateAction<string>>;
  buscaMobileAberta: boolean;
  setBuscaMobileAberta: Dispatch<SetStateAction<boolean>>;
  notificacoesNaoLidas: number;
  usuarioLogado: boolean;
}) {
  return (
    <header className="historietas-home-header" style={isDesktop ? desktopNavStyle : mobileNavStyle}>
      {isDesktop && (
        <div style={desktopNavInnerStyle}>
          <Link
            href="/"
            className="historietas-home-logo"
            style={desktopLogoStyle}
            aria-label="Historietas"
          >
            <span className="historietas-home-logo-mark" style={desktopLogoMarkStyle}>H</span>
            <span className="historietas-home-logo-text" style={desktopLogoTextStyle}>istorietas</span>
          </Link>

          <div
            className="historietas-home-desktop-links"
            style={desktopMenuStyle}
            role="navigation"
            aria-label="Navegação principal"
          >
            <Link href="/" className="historietas-home-desktop-link" style={desktopActiveLinkStyle}>
              Início
            </Link>

            <Link href="/explorar" className="historietas-home-desktop-link" style={desktopLinkStyle}>
              Explorar
            </Link>

            <Link href="/publicar" className="historietas-home-desktop-link" style={desktopLinkStyle}>
              Publicar
            </Link>

            <Link href="/comunidade" className="historietas-home-desktop-link" style={desktopLinkStyle}>
              Comunidade
            </Link>

            <Link href="/seguindo" className="historietas-home-desktop-link" style={desktopLinkStyle}>
              Seguindo
            </Link>

          </div>

          <div style={desktopInlineSearchAreaStyle}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              style={desktopSearchIconStyle}
            >
              <circle cx="10.75" cy="10.75" r="6.75" stroke="currentColor" strokeWidth="2" />
              <path d="M16 16L20.25 20.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>

            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              aria-label="Buscar obras, autor, gênero..."
              placeholder="Buscar obras, autor, gênero..."
              className="historietas-home-header-search-input"
              style={desktopInputStyle}
            />
          </div>

          <div className="historietas-home-desktop-actions" style={desktopHeaderActionsStyle}>
            <Link
              href="/notificacoes"
              className="historietas-home-desktop-icon-link"
              style={desktopHeaderIconLinkStyle}
              aria-label={
                notificacoesNaoLidas > 0
                  ? `Notificações: ${notificacoesNaoLidas} novas`
                  : "Notificações"
              }
              title="Notificações"
            >
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M6.75 9.75C6.75 6.85 8.85 4.5 12 4.5C15.15 4.5 17.25 6.85 17.25 9.75V13.1L18.7 15.7H5.3L6.75 13.1V9.75Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path d="M9.75 18C10.15 18.8 10.9 19.25 12 19.25C13.1 19.25 13.85 18.8 14.25 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>

              {usuarioLogado && notificacoesNaoLidas > 0 ? (
                <span style={desktopNotificationCountBadgeStyle}>
                  {notificacoesNaoLidas > 99 ? "99+" : notificacoesNaoLidas}
                </span>
              ) : null}
            </Link>

            <Link
              href="/configuracoes"
              className="historietas-home-desktop-icon-link"
              style={desktopHeaderIconLinkStyle}
              aria-label="Configurações"
              title="Configurações"
            >
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M9.8 4.6L10.35 3H13.65L14.2 4.6L15.65 5.2L17.15 4.45L19.5 6.8L18.75 8.3L19.35 9.75L21 10.35V13.65L19.35 14.25L18.75 15.7L19.5 17.2L17.15 19.55L15.65 18.8L14.2 19.4L13.65 21H10.35L9.8 19.4L8.35 18.8L6.85 19.55L4.5 17.2L5.25 15.7L4.65 14.25L3 13.65V10.35L4.65 9.75L5.25 8.3L4.5 6.8L6.85 4.45L8.35 5.2L9.8 4.6Z"
                  stroke="currentColor"
                  strokeWidth="1.55"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            </Link>

            <Link
              href="/perfil-autor"
              className="historietas-home-desktop-profile-link"
              style={desktopProfileLinkStyle}
              aria-label="Abrir perfil"
              title="Perfil"
            >
              <span style={desktopProfileAvatarStyle}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8.25" r="3.25" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M5.75 19C6.3 15.75 8.6 14 12 14C15.4 14 17.7 15.75 18.25 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      )}

      {!isDesktop && (
        <div style={navInnerStyle}>
          <div style={navTopRowStyle}>
            <Link href="/" className="historietas-home-logo" style={logoStyle} aria-label="Historietas">
              <span className="historietas-home-logo-mark" style={logoMarkStyle}>H</span>
              <span className="historietas-home-logo-text" style={logoTextStyle}>istorietas</span>
            </Link>

            {buscaMobileAberta ? (
              <div className="historietas-home-mobile-search-area" style={mobileHeaderSearchAreaStyle}>
                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  aria-label="Buscar..."
                  placeholder="Buscar..."
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={90}
                  className="historietas-home-header-search-input"
                  style={mobileHeaderSearchInputStyle}
                  type="text"
                  autoFocus
                />

              </div>
            ) : null}

            <div className="historietas-home-header-actions" style={navIconsStyle}>
              <button
                type="button"
                onClick={() => setBuscaMobileAberta((aberta) => !aberta)}
                aria-label={buscaMobileAberta ? "Fechar busca" : "Abrir busca"}
                aria-pressed={buscaMobileAberta}
                className="historietas-home-search-toggle"
                style={
                  buscaMobileAberta
                    ? mobileSearchToggleActiveStyle
                    : mobileSearchToggleStyle
                }
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
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
