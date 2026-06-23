import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Script from "next/script";
import AdminBottomNavItem from "../components/AdminBottomNavItem";
import { NotificacoesProvider } from "../components/NotificacoesProvider";
import { NotificacoesBottomNavItem } from "../components/NotificacoesBottomNavItem";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Historietas",
    template: "%s | Historietas",
  },
  description:
    "Plataforma para descobrir, ler e publicar webnovels, fanfics, mangás e histórias originais.",
  applicationName: "Historietas",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#070212",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <NotificacoesProvider>
          <div className="historietas-app-shell">{children}</div>

          <nav
          className="historietas-bottom-nav"
          data-bottom-nav="true"
          data-mobile-nav="true"
          aria-label="Navegação inferior"
        >
          <Link
            href="/"
            className="historietas-bottom-nav-item"
            data-nav-exact="true"
          >
            <span className="historietas-bottom-nav-icon">⌂</span>
            <span className="historietas-bottom-nav-label">Início</span>
          </Link>

          <Link href="/explorar" className="historietas-bottom-nav-item">
            <span className="historietas-bottom-nav-icon">◇</span>
            <span className="historietas-bottom-nav-label">Explorar</span>
          </Link>

          <Link href="/em-alta" className="historietas-bottom-nav-item">
            <span className="historietas-bottom-nav-icon">↗</span>
            <span className="historietas-bottom-nav-label">Em alta</span>
          </Link>

          <Link href="/publicar" className="historietas-bottom-nav-item">
            <span className="historietas-bottom-nav-icon">＋</span>
            <span className="historietas-bottom-nav-label">Publicar</span>
          </Link>

          <Link href="/perfil-autor" className="historietas-bottom-nav-item">
            <span className="historietas-bottom-nav-icon" aria-hidden="true">
              <svg
                className="historietas-bottom-nav-svg"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 12.25C14.07 12.25 15.75 10.57 15.75 8.5C15.75 6.43 14.07 4.75 12 4.75C9.93 4.75 8.25 6.43 8.25 8.5C8.25 10.57 9.93 12.25 12 12.25ZM5.75 19.25C6.52 16.72 8.78 15.25 12 15.25C15.22 15.25 17.48 16.72 18.25 19.25"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="historietas-bottom-nav-label">Perfil</span>
          </Link>

          <Link href="/comunidade" className="historietas-bottom-nav-item">
            <span className="historietas-bottom-nav-icon" aria-hidden="true">
              <svg
                className="historietas-bottom-nav-svg"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.5 9.25H16.5M7.5 13H13.2M8.2 18.25H7.85C4.98 18.25 3.25 16.72 3.25 14.06V8.94C3.25 6.28 4.98 4.75 7.85 4.75H16.15C19.02 4.75 20.75 6.28 20.75 8.94V14.06C20.75 16.72 19.02 18.25 16.15 18.25H12.1L8.4 20.65C8.07 20.86 7.62 20.63 7.64 20.24L7.75 18.26"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>

            <span className="historietas-bottom-nav-label">Comunidade</span>
          </Link>

          <NotificacoesBottomNavItem />

          <AdminBottomNavItem />
        </nav>

          <Script
            id="historietas-bottom-nav-active"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                const nav = document.querySelector('[data-bottom-nav="true"]');

                if (!nav) {
                  return;
                }

                let ultimoCaminhoAplicado = "";

                function normalizarCaminho(pathname) {
                  const caminho = pathname || window.location.pathname || "/";

                  if (caminho.length > 1 && caminho.endsWith("/")) {
                    return caminho.slice(0, -1);
                  }

                  return caminho;
                }

                function resolverCaminhoDoMenu(pathname, search = "") {
                  const caminho = normalizarCaminho(pathname);
                  const parametros = new URLSearchParams(search || "");

                  if (caminho === "/") return "/";
                  if (caminho === "/explorar" || caminho.startsWith("/explorar/")) return "/explorar";
                  if (caminho === "/em-alta" || caminho.startsWith("/em-alta/")) return "/em-alta";
                  if (caminho === "/publicar" || caminho.startsWith("/publicar/")) return "/publicar";
                  if (caminho === "/seguindo" || caminho.startsWith("/seguindo/")) return "/perfil-autor";
                  if (caminho === "/comunidade" || caminho.startsWith("/comunidade/")) return "/comunidade";
                  if (caminho === "/perfil-autor" || caminho.startsWith("/perfil-autor/")) return "/perfil-autor";
                  if (caminho === "/admin/comunidade" || caminho.startsWith("/admin/comunidade/")) return "/admin/comunidade";
                  if (caminho === "/notificacoes" || caminho.startsWith("/notificacoes/")) return "/notificacoes";
                  if (caminho === "/configuracoes" || caminho.startsWith("/configuracoes/")) return "/perfil-autor";
                  if (caminho === "/painel-autor" || caminho.startsWith("/painel-autor/")) return "/perfil-autor";

                  if (
                    caminho === "/editar-obra" ||
                    caminho.startsWith("/editar-obra/") ||
                    caminho === "/editar-capitulo" ||
                    caminho.startsWith("/editar-capitulo/") ||
                    caminho === "/adicionar-capitulo" ||
                    caminho.startsWith("/adicionar-capitulo/") ||
                    caminho === "/ver-arquivo" ||
                    caminho.startsWith("/ver-arquivo/") ||
                    caminho === "/configuracoes" ||
                    caminho.startsWith("/configuracoes/")
                  ) {
                    return "/perfil-autor";
                  }

                  if (
                    caminho === "/ler-capitulo" ||
                    caminho.startsWith("/ler-capitulo/")
                  ) {
                    return "/perfil-autor";
                  }

                  if (
                    caminho === "/obra" ||
                    caminho.startsWith("/obra/")
                  ) {
                    return "/explorar";
                  }

                  return "";
                }

                function aplicarItemAtivo(pathname, deveCentralizar = true) {
                  const caminhoAtual = normalizarCaminho(pathname);
                  const buscaAtual = window.location.search || "";
                  const caminhoDoMenu = resolverCaminhoDoMenu(caminhoAtual, buscaAtual);
                  const links = Array.from(
                    nav.querySelectorAll('.historietas-bottom-nav-item[href]')
                  );

                  let linkAtivo = null;

                  links.forEach((link) => {
                    link.classList.remove("historietas-bottom-nav-item-active");
                    link.removeAttribute("aria-current");

                    const href = link.getAttribute("href") || "/";
                    const url = new URL(href, window.location.origin);
                    const caminhoLink = normalizarCaminho(url.pathname || "/");
                    const hrefCompleto = caminhoLink + (url.search || "");

                    if (
                      caminhoDoMenu &&
                      (hrefCompleto === caminhoDoMenu || caminhoLink === caminhoDoMenu)
                    ) {
                      linkAtivo = link;
                    }
                  });

                  ultimoCaminhoAplicado = caminhoAtual + buscaAtual;

                  if (!linkAtivo) {
                    return;
                  }

                  linkAtivo.classList.add("historietas-bottom-nav-item-active");
                  linkAtivo.setAttribute("aria-current", "page");

                  if (!deveCentralizar) {
                    return;
                  }

                  window.requestAnimationFrame(() => {
                    try {
                      linkAtivo.scrollIntoView({
                        behavior: "auto",
                        block: "nearest",
                        inline: "center"
                      });
                    } catch {
                      try {
                        linkAtivo.scrollIntoView(false);
                      } catch {}
                    }
                  });
                }

                function atualizarPorCaminhoAtual(deveCentralizar = true) {
                  const caminhoAtual = normalizarCaminho(window.location.pathname);
                  const buscaAtual = window.location.search || "";
                  const assinaturaAtual = caminhoAtual + buscaAtual;

                  if (assinaturaAtual === ultimoCaminhoAplicado) {
                    return;
                  }

                  aplicarItemAtivo(caminhoAtual, deveCentralizar);
                }

                aplicarItemAtivo(window.location.pathname, false);

                const pushStateOriginal = window.history.pushState;
                const replaceStateOriginal = window.history.replaceState;

                window.history.pushState = function historietasPushState() {
                  const resultado = pushStateOriginal.apply(this, arguments);

                  window.setTimeout(() => atualizarPorCaminhoAtual(false), 90);
                  window.setTimeout(() => atualizarPorCaminhoAtual(true), 220);
                  window.setTimeout(() => atualizarPorCaminhoAtual(true), 420);

                  return resultado;
                };

                window.history.replaceState = function historietasReplaceState() {
                  const resultado = replaceStateOriginal.apply(this, arguments);

                  window.setTimeout(() => atualizarPorCaminhoAtual(false), 90);
                  window.setTimeout(() => atualizarPorCaminhoAtual(true), 220);
                  window.setTimeout(() => atualizarPorCaminhoAtual(true), 420);

                  return resultado;
                };

                nav.addEventListener("click", () => {
                  window.setTimeout(() => atualizarPorCaminhoAtual(false), 120);
                  window.setTimeout(() => atualizarPorCaminhoAtual(true), 280);
                  window.setTimeout(() => atualizarPorCaminhoAtual(true), 520);
                });

                window.addEventListener("popstate", () => {
                  window.setTimeout(() => atualizarPorCaminhoAtual(false), 90);
                  window.setTimeout(() => atualizarPorCaminhoAtual(true), 220);
                });

                window.addEventListener("pageshow", () => {
                  atualizarPorCaminhoAtual(false);
                });
              })();
            `,
          }}
        />

          <style
            dangerouslySetInnerHTML={{
            __html: `
              html,
              body {
                --historietas-bottom-nav-bg: #04000A;
                --historietas-bottom-nav-border: rgba(59, 7, 100, 0.52);
                --historietas-bottom-nav-text: #9980D8;
                --historietas-bottom-nav-hover-text: #FFFFFF;
                --historietas-bottom-nav-hover-bg: rgba(59, 7, 100, 0.20);
                --historietas-bottom-nav-icon-text: #AD95EA;
                --historietas-bottom-nav-icon-bg: rgba(59, 7, 100, 0.28);
                --historietas-bottom-nav-icon-border: rgba(76, 29, 149, 0.34);
                --historietas-bottom-nav-active-bg: rgba(59, 7, 100, 0.54);
                --historietas-bottom-nav-active-border: rgba(109, 40, 217, 0.48);
                --historietas-bottom-nav-active-icon-bg: #3B0764;
                --historietas-bottom-nav-active-icon-border: rgba(167, 139, 250, 0.46);
                --historietas-bottom-nav-shadow: 0 18px 42px rgba(0, 0, 0, 0.58);
                width: 100%;
                max-width: 100vw;
                min-height: 100%;
                margin: 0;
                overflow-x: hidden;
                background: #070212;
              }

              *,
              *::before,
              *::after {
                box-sizing: border-box;
              }

              .historietas-app-shell {
                width: 100%;
                max-width: 100vw;
                min-height: 100vh;
                overflow-x: hidden;
              }

              .historietas-bottom-nav {
                position: fixed;
                left: 50%;
                bottom: max(10px, env(safe-area-inset-bottom));
                z-index: 80;
                width: min(450px, calc(100vw - 18px));
                max-width: calc(100vw - 18px);
                min-height: 66px;
                transform: translateX(-50%);
                display: none;
                align-items: center;
                justify-content: flex-start;
                gap: 5px;
                padding: 7px;
                border-radius: 24px;
                border: 1px solid var(--historietas-bottom-nav-border, rgba(59, 7, 100, 0.52));
                background: var(--historietas-bottom-nav-bg, #04000A);
                box-shadow: var(--historietas-bottom-nav-shadow, 0 18px 42px rgba(0, 0, 0, 0.58));
                overflow-x: auto;
                overflow-y: hidden;
                scroll-snap-type: x proximity;
                scrollbar-width: none;
                -webkit-overflow-scrolling: touch;
                overscroll-behavior-x: contain;
                -webkit-tap-highlight-color: transparent;
              }

              .historietas-bottom-nav *,
              .historietas-bottom-nav *::before,
              .historietas-bottom-nav *::after {
                -webkit-tap-highlight-color: transparent !important;
              }

              .historietas-bottom-nav::-webkit-scrollbar {
                display: none;
              }

              .historietas-bottom-nav::before {
                content: "";
                position: absolute;
                inset: 0;
                pointer-events: none;
                background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.024) 50%, transparent 100%);
              }

              .historietas-bottom-nav-item,
              .historietas-bottom-nav-main {
                position: relative;
                z-index: 1;
                min-width: 64px !important;
                flex: 0 0 64px !important;
                min-height: 50px;
                scroll-snap-align: center;
                padding: 6px 3px;
                border-radius: 18px;
                display: inline-flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 4px;
                color: var(--historietas-bottom-nav-text, #9980D8) !important;
                text-decoration: none;
                font-family: var(--font-geist-sans), Arial, Helvetica, sans-serif;
                border: 1px solid transparent !important;
                background: transparent !important;
                box-shadow: none !important;
                outline: none !important;
                -webkit-tap-highlight-color: transparent !important;
                transition:
                  background 60ms ease,
                  border-color 60ms ease,
                  color 60ms ease;
              }

              .historietas-bottom-nav-item:active,
              .historietas-bottom-nav-item:focus,
              .historietas-bottom-nav-item:focus-visible {
                outline: none !important;
                box-shadow: none !important;
              }

              .historietas-bottom-nav-item:not([aria-current="page"]):not(.historietas-bottom-nav-item-active):active,
              .historietas-bottom-nav-item:not([aria-current="page"]):not(.historietas-bottom-nav-item-active):focus,
              .historietas-bottom-nav-item:not([aria-current="page"]):not(.historietas-bottom-nav-item-active):focus-visible {
                color: var(--historietas-bottom-nav-text, #9980D8) !important;
                border-color: transparent !important;
                background: transparent !important;
                box-shadow: none !important;
              }

              .historietas-bottom-nav-item:not([aria-current="page"]):not(.historietas-bottom-nav-item-active):active .historietas-bottom-nav-icon,
              .historietas-bottom-nav-item:not([aria-current="page"]):not(.historietas-bottom-nav-item-active):focus .historietas-bottom-nav-icon,
              .historietas-bottom-nav-item:not([aria-current="page"]):not(.historietas-bottom-nav-item-active):focus-visible .historietas-bottom-nav-icon {
                color: var(--historietas-bottom-nav-icon-text, #AD95EA) !important;
                background: var(--historietas-bottom-nav-icon-bg, rgba(59, 7, 100, 0.28)) !important;
                border-color: var(--historietas-bottom-nav-icon-border, rgba(76, 29, 149, 0.34)) !important;
              }

              @media (hover: hover) and (pointer: fine) {
                .historietas-bottom-nav-item:hover {
                  color: var(--historietas-bottom-nav-hover-text, #FFFFFF) !important;
                  border-color: var(--historietas-bottom-nav-border, rgba(59, 7, 100, 0.52)) !important;
                  background: var(--historietas-bottom-nav-hover-bg, rgba(59, 7, 100, 0.20)) !important;
                }
              }

              .historietas-bottom-nav-item[aria-current="page"],
              .historietas-bottom-nav-item-active {
                color: var(--historietas-bottom-nav-hover-text, #FFFFFF) !important;
                border-color: var(--historietas-bottom-nav-active-border, rgba(109, 40, 217, 0.48)) !important;
                background: var(--historietas-bottom-nav-active-bg, rgba(59, 7, 100, 0.54)) !important;
                box-shadow: none !important;
              }

              .historietas-bottom-nav-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 23px;
                height: 23px;
                border-radius: 10px;
                font-size: 16px;
                line-height: 1;
                font-weight: 950;
                color: var(--historietas-bottom-nav-icon-text, #AD95EA) !important;
                background: var(--historietas-bottom-nav-icon-bg, rgba(59, 7, 100, 0.28)) !important;
                border: 1px solid var(--historietas-bottom-nav-icon-border, rgba(76, 29, 149, 0.34)) !important;
              }

              .historietas-bottom-nav-item[aria-current="page"] .historietas-bottom-nav-icon,
              .historietas-bottom-nav-item-active .historietas-bottom-nav-icon {
                color: #FFFFFF !important;
                background: var(--historietas-bottom-nav-active-icon-bg, #3B0764) !important;
                border-color: var(--historietas-bottom-nav-active-icon-border, rgba(167, 139, 250, 0.46)) !important;
              }

              .historietas-bottom-nav-label {
                display: block;
                width: 100%;
                max-width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                text-align: center;
                font-size: 10px;
                line-height: 1;
                font-weight: 950;
                letter-spacing: -0.025em;
                color: inherit !important;
              }

              .historietas-bottom-nav-svg {
                width: 16px;
                height: 16px;
                display: block;
                flex: 0 0 auto;
              }

              .historietas-bottom-nav-item[href^="/admin"] .historietas-bottom-nav-icon,
              .historietas-bottom-nav-item[href*="/admin/"] .historietas-bottom-nav-icon {
                font-size: 0;
              }

              .historietas-bottom-nav-item[href^="/admin"] .historietas-bottom-nav-icon::before,
              .historietas-bottom-nav-item[href*="/admin/"] .historietas-bottom-nav-icon::before {
                content: "";
                width: 16px;
                height: 16px;
                display: block;
                background: currentColor;
                -webkit-mask: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5.5 20V5.4C5.5 4.85 5.95 4.4 6.5 4.4H18.1C18.91 4.4 19.38 5.32 18.9 5.97L16.95 8.55C16.69 8.9 16.69 9.38 16.95 9.73L18.9 12.31C19.38 12.96 18.91 13.88 18.1 13.88H6.25M5.5 20H8.25' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / contain no-repeat;
                mask: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5.5 20V5.4C5.5 4.85 5.95 4.4 6.5 4.4H18.1C18.91 4.4 19.38 5.32 18.9 5.97L16.95 8.55C16.69 8.9 16.69 9.38 16.95 9.73L18.9 12.31C19.38 12.96 18.91 13.88 18.1 13.88H6.25M5.5 20H8.25' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / contain no-repeat;
              }

              html[data-historietas-tema-visual] nav.historietas-bottom-nav a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
              html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
              html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) {
                min-width: 64px !important;
                flex: 0 0 64px !important;
                color: var(--historietas-bottom-nav-text, #9980D8) !important;
                border-color: transparent !important;
                background: transparent !important;
                box-shadow: none !important;
              }

              html[data-historietas-tema-visual] nav.historietas-bottom-nav a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) .historietas-bottom-nav-icon,
              html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) .historietas-bottom-nav-icon,
              html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) .historietas-bottom-nav-icon {
                color: var(--historietas-bottom-nav-icon-text, #AD95EA) !important;
                background: var(--historietas-bottom-nav-icon-bg, rgba(59, 7, 100, 0.28)) !important;
                border-color: var(--historietas-bottom-nav-icon-border, rgba(76, 29, 149, 0.34)) !important;
              }

              @media (max-width: 767px) {
                .historietas-app-shell {
                  padding-bottom: calc(94px + env(safe-area-inset-bottom));
                }

                .historietas-bottom-nav {
                  display: flex;
                }
              }

              @media (max-width: 360px) {
                .historietas-bottom-nav {
                  width: min(450px, calc(100vw - 12px));
                  max-width: calc(100vw - 12px);
                  bottom: max(6px, env(safe-area-inset-bottom));
                  padding: 6px;
                  border-radius: 22px;
                  gap: 3px;
                }

                .historietas-bottom-nav-item,
                .historietas-bottom-nav-main {
                  min-width: 59px !important;
                  flex: 0 0 59px !important;
                  min-height: 48px;
                  border-radius: 16px;
                }

                .historietas-bottom-nav-label {
                  font-size: 9px;
                }

                .historietas-bottom-nav-icon {
                  width: 21px;
                  height: 21px;
                  font-size: 15px;
                }
              }

              @media (min-width: 768px) {
                .historietas-app-shell {
                  padding-bottom: 0;
                }

                .historietas-bottom-nav {
                  display: none;
                }
              }
            `,
          }}
          />
        </NotificacoesProvider>
      </body>
    </html>
  );
}