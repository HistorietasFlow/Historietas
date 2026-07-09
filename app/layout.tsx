import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Script from "next/script";
import AdminBottomNavItem from "../components/AdminBottomNavItem";
import { NotificacoesProvider } from "../components/NotificacoesProvider";
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

const SITE_URL = "https://historietas.com.br";
const SITE_NAME = "Historietas";
const SITE_DESCRIPTION =
  "Plataforma para descobrir, ler e publicar webnovels, fanfics, mangás e histórias originais.";
const DEFAULT_OG_IMAGE = "/favicon.ico";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
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
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable}`}
      data-scroll-behavior="smooth"
      data-historietas-bottom-nav-oculto="false"
      suppressHydrationWarning
    >
      <body>
        <Script
          id="historietas-bottom-nav-visibility"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                function normalizarCaminhoBottomNav(pathname) {
                  const caminho = pathname || window.location.pathname || "/";

                  if (caminho.length > 1 && caminho.endsWith("/")) {
                    return caminho.slice(0, -1);
                  }

                  return caminho;
                }

                function deveOcultarBottomNav(pathname) {
                  const caminho = normalizarCaminhoBottomNav(pathname);

                  return caminho === "/login" || caminho.startsWith("/login/");
                }

                function aplicarVisibilidadeBottomNav() {
                  document.documentElement.setAttribute(
                    "data-historietas-bottom-nav-oculto",
                    deveOcultarBottomNav(window.location.pathname) ? "true" : "false"
                  );
                }

                aplicarVisibilidadeBottomNav();

                const pushStateOriginalBottomNav = window.history.pushState;
                const replaceStateOriginalBottomNav = window.history.replaceState;

                window.history.pushState = function historietasBottomNavPushState() {
                  const resultado = pushStateOriginalBottomNav.apply(this, arguments);
                  window.setTimeout(aplicarVisibilidadeBottomNav, 0);
                  window.setTimeout(aplicarVisibilidadeBottomNav, 120);
                  return resultado;
                };

                window.history.replaceState = function historietasBottomNavReplaceState() {
                  const resultado = replaceStateOriginalBottomNav.apply(this, arguments);
                  window.setTimeout(aplicarVisibilidadeBottomNav, 0);
                  window.setTimeout(aplicarVisibilidadeBottomNav, 120);
                  return resultado;
                };

                window.addEventListener("popstate", aplicarVisibilidadeBottomNav);
                window.addEventListener("pageshow", aplicarVisibilidadeBottomNav);
              })();
            `,
          }}
        />

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
              aria-label="Home"
            >
              <span className="historietas-bottom-nav-icon" aria-hidden="true">
                <svg
                  className="historietas-bottom-nav-svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.75 10.75L12 3.75L20.25 10.75V19.25C20.25 19.8 19.8 20.25 19.25 20.25H14.75V14.35C14.75 13.8 14.3 13.35 13.75 13.35H10.25C9.7 13.35 9.25 13.8 9.25 14.35V20.25H4.75C4.2 20.25 3.75 19.8 3.75 19.25V10.75Z"
                    stroke="currentColor"
                    strokeWidth="2.15"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="historietas-bottom-nav-label">Home</span>
            </Link>

            <Link href="/explorar" className="historietas-bottom-nav-item" aria-label="Explorar">
              <span className="historietas-bottom-nav-icon" aria-hidden="true">
                <svg
                  className="historietas-bottom-nav-svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
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
              </span>
              <span className="historietas-bottom-nav-label">Explorar</span>
            </Link>

            <Link href="/publicar" className="historietas-bottom-nav-item" aria-label="Publicar">
              <span className="historietas-bottom-nav-icon historietas-bottom-nav-publish-icon" aria-hidden="true">
                <svg
                  className="historietas-bottom-nav-svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 5V19M5 12H19"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="historietas-bottom-nav-label">Publicar</span>
            </Link>

            <Link href="/comunidade" className="historietas-bottom-nav-item" aria-label="Comunidade">
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
                    strokeWidth="2.05"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="historietas-bottom-nav-label">Comunidade</span>
            </Link>


            <Link href="/perfil-autor" className="historietas-bottom-nav-item" aria-label="Perfil">
              <span
                className="historietas-bottom-nav-profile-avatar"
                data-bottom-profile-avatar="true"
                aria-hidden="true"
              >
                <span className="historietas-bottom-nav-profile-fallback">H</span>
              </span>
              <span className="historietas-bottom-nav-label">Perfil</span>
            </Link>

            <AdminBottomNavItem />
          </nav>


          <Script
            id="historietas-corrigir-texto-quebrado"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (() => {
                  const padraoTextoQuebrado = /[ÃÂâð�]/;
                  const atributosParaCorrigir = ["aria-label", "title", "placeholder", "alt"];

                  function corrigirTextoQuebrado(texto) {
                    let textoCorrigido = texto;

                    for (let tentativa = 0; tentativa < 2; tentativa += 1) {
                      if (!padraoTextoQuebrado.test(textoCorrigido)) {
                        break;
                      }

                      try {
                        const bytes = new Uint8Array(
                          Array.from(textoCorrigido, (caractere) => caractere.charCodeAt(0) & 255)
                        );
                        const decodificado = new TextDecoder("utf-8", { fatal: true }).decode(bytes);

                        if (!decodificado || decodificado === textoCorrigido) {
                          break;
                        }

                        textoCorrigido = decodificado;
                      } catch {
                        break;
                      }
                    }

                    return textoCorrigido.replace(/\uFFFD/g, "");
                  }

                  function podeCorrigirNoElemento(elemento) {
                    if (!elemento || !elemento.tagName) {
                      return true;
                    }

                    const tag = elemento.tagName.toLowerCase();

                    return tag !== "script" && tag !== "style" && tag !== "textarea" && tag !== "input";
                  }

                  function corrigirNoElemento(elemento) {
                    if (!elemento || !podeCorrigirNoElemento(elemento)) {
                      return;
                    }

                    atributosParaCorrigir.forEach((atributo) => {
                      const valor = elemento.getAttribute?.(atributo);

                      if (valor && padraoTextoQuebrado.test(valor)) {
                        const valorCorrigido = corrigirTextoQuebrado(valor);

                        if (valorCorrigido !== valor) {
                          elemento.setAttribute(atributo, valorCorrigido);
                        }
                      }
                    });
                  }

                  function corrigirTextos(root = document.body) {
                    if (!root) {
                      return;
                    }

                    if (root.nodeType === Node.ELEMENT_NODE) {
                      corrigirNoElemento(root);
                    }

                    if (root.nodeType === Node.TEXT_NODE) {
                      const texto = root.nodeValue || "";

                      if (padraoTextoQuebrado.test(texto) && podeCorrigirNoElemento(root.parentElement)) {
                        const textoCorrigido = corrigirTextoQuebrado(texto);

                        if (textoCorrigido !== texto) {
                          root.nodeValue = textoCorrigido;
                        }
                      }

                      return;
                    }

                    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
                    const textos = [];

                    while (walker.nextNode()) {
                      textos.push(walker.currentNode);
                    }

                    textos.forEach((node) => {
                      const texto = node.nodeValue || "";

                      if (!padraoTextoQuebrado.test(texto) || !podeCorrigirNoElemento(node.parentElement)) {
                        return;
                      }

                      const textoCorrigido = corrigirTextoQuebrado(texto);

                      if (textoCorrigido !== texto) {
                        node.nodeValue = textoCorrigido;
                      }
                    });

                    if (root.querySelectorAll) {
                      root.querySelectorAll("*").forEach(corrigirNoElemento);
                    }
                  }

                  corrigirTextos();

                  const observer = new MutationObserver((mutacoes) => {
                    mutacoes.forEach((mutacao) => {
                      mutacao.addedNodes.forEach((node) => corrigirTextos(node));

                      if (mutacao.type === "characterData") {
                        corrigirTextos(mutacao.target);
                      }

                      if (mutacao.type === "attributes") {
                        corrigirTextos(mutacao.target);
                      }
                    });
                  });

                  observer.observe(document.body, {
                    childList: true,
                    characterData: true,
                    attributes: true,
                    subtree: true,
                  });

                  window.addEventListener("historietas:notificacoes-atualizadas", () => {
                    window.setTimeout(() => corrigirTextos(), 30);
                  });
                })();
              `,
            }}
          />

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
                  if (caminho === "/publicar" || caminho.startsWith("/publicar/")) return "/publicar";
                  if (caminho === "/seguindo" || caminho.startsWith("/seguindo/")) return "/perfil-autor";
                  if (caminho === "/comunidade" || caminho.startsWith("/comunidade/")) return "/comunidade";
                  if (caminho === "/perfil-autor" || caminho.startsWith("/perfil-autor/")) return "/perfil-autor";
                  if (caminho === "/admin/comunidade" || caminho.startsWith("/admin/comunidade/")) return "/admin/comunidade";
                  if (caminho === "/notificacoes" || caminho.startsWith("/notificacoes/")) return "/perfil-autor";
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
                --historietas-bottom-nav-bg: rgba(7, 2, 18, 0.98);
                --historietas-bottom-nav-border: rgba(7, 2, 18, 0.98);
                --historietas-bottom-nav-text: rgba(173, 149, 234, 0.82);
                --historietas-bottom-nav-active-text: #FFFFFF;
                --historietas-bottom-nav-muted-text: rgba(173, 149, 234, 0.52);
                --historietas-bottom-nav-publish-bg: rgba(59, 7, 100, 0.68);
                --historietas-bottom-nav-publish-border: rgba(167, 139, 250, 0.30);
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
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 80;
                width: 100%;
                max-width: 100vw;
                min-height: 54px;
                transform: none;
                display: none;
                align-items: center;
                justify-content: flex-start;
                gap: 0;
                padding: 3px 0 max(3px, env(safe-area-inset-bottom));
                border-top: 1px solid var(--historietas-bottom-nav-bg, rgba(7, 2, 18, 0.98));
                border-right: 0;
                border-bottom: 0;
                border-left: 0;
                border-radius: 0;
                background:
                  linear-gradient(180deg, rgba(11, 3, 24, 0.96) 0%, var(--historietas-bottom-nav-bg, rgba(7, 2, 18, 0.98)) 100%);
                box-shadow: none;
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
                content: none;
              }

              .historietas-bottom-nav-item,
              .historietas-bottom-nav-main {
                position: relative;
                z-index: 1;
                min-width: 20% !important;
                flex: 0 0 20% !important;
                min-height: 44px;
                scroll-snap-align: center;
                padding: 2px 0;
                border-radius: 0;
                display: inline-flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 0;
                color: var(--historietas-bottom-nav-text, rgba(173, 149, 234, 0.82)) !important;
                text-decoration: none;
                font-family: var(--font-geist-sans), Arial, Helvetica, sans-serif;
                border: 0 !important;
                background: transparent !important;
                box-shadow: none !important;
                outline: none !important;
                -webkit-tap-highlight-color: transparent !important;
                transition: color 80ms ease, opacity 80ms ease;
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
                color: var(--historietas-bottom-nav-text, rgba(173, 149, 234, 0.82)) !important;
                border-color: transparent !important;
                background: transparent !important;
                box-shadow: none !important;
              }

              @media (hover: hover) and (pointer: fine) {
                .historietas-bottom-nav-item:hover {
                  color: var(--historietas-bottom-nav-active-text, #FFFFFF) !important;
                }
              }

              .historietas-bottom-nav-item[aria-current="page"],
              .historietas-bottom-nav-item-active {
                color: var(--historietas-bottom-nav-active-text, #FFFFFF) !important;
                border-color: transparent !important;
                background: transparent !important;
                box-shadow: none !important;
              }

              .historietas-bottom-nav-item[aria-current="page"]::after,
              .historietas-bottom-nav-item-active::after {
                content: "";
                position: absolute;
                left: 50%;
                bottom: 1px;
                width: 4px;
                height: 4px;
                border-radius: 999px;
                transform: translateX(-50%);
                background: #A78BFA;
                opacity: 0.95;
              }

              .historietas-bottom-nav-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                border-radius: 0;
                font-size: 0;
                line-height: 1;
                font-weight: 950;
                color: currentColor !important;
                background: transparent !important;
                border: 0 !important;
              }

              .historietas-bottom-nav-item[aria-current="page"] .historietas-bottom-nav-icon,
              .historietas-bottom-nav-item-active .historietas-bottom-nav-icon {
                color: currentColor !important;
                background: transparent !important;
                border-color: transparent !important;
              }
              .historietas-bottom-nav-item .historietas-bottom-nav-icon:not(.historietas-bottom-nav-publish-icon) {
                background: transparent !important;
                border: 0 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
              }


              .historietas-bottom-nav-publish-icon {
                width: 36px !important;
                height: 36px !important;
                border-radius: 999px !important;
                color: #FFFFFF !important;
                background: var(--historietas-bottom-nav-publish-bg, rgba(59, 7, 100, 0.72)) !important;
                border: 1px solid var(--historietas-bottom-nav-publish-border, rgba(167, 139, 250, 0.34)) !important;
              }

              .historietas-bottom-nav-item[href="/publicar"][aria-current="page"] .historietas-bottom-nav-publish-icon,
              .historietas-bottom-nav-item[href="/publicar"].historietas-bottom-nav-item-active .historietas-bottom-nav-publish-icon {
                background: linear-gradient(135deg, #3B0764 0%, #581C87 100%) !important;
                border-color: rgba(216, 180, 254, 0.5) !important;
              }

              .historietas-bottom-nav-label {
                display: none !important;
              }

              .historietas-bottom-nav-svg {
                width: 24px;
                height: 24px;
                display: block;
                flex: 0 0 auto;
              }

              .historietas-bottom-nav-publish-icon .historietas-bottom-nav-svg {
                width: 23px;
                height: 23px;
              }

              .historietas-bottom-nav-profile-avatar {
                width: 28px;
                height: 28px;
                border-radius: 999px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                color: #FFFFFF;
                background:
                  radial-gradient(circle at 28% 24%, rgba(167, 139, 250, 0.56), transparent 34%),
                  linear-gradient(135deg, #1B0632 0%, #070212 100%);
                background-size: cover;
                background-position: center;
                border: 1.5px solid rgba(173, 149, 234, 0.86);
                font-size: 13px;
                line-height: 1;
                font-weight: 950;
              }

              .historietas-bottom-nav-profile-avatar-has-image {
                background-color: #08030F;
                background-repeat: no-repeat;
                background-size: cover;
                background-position: center;
              }

              .historietas-bottom-nav-profile-fallback {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
              }

              .historietas-bottom-nav-item[aria-current="page"] .historietas-bottom-nav-profile-avatar,
              .historietas-bottom-nav-item-active .historietas-bottom-nav-profile-avatar {
                border-color: #FFFFFF;
              }

              .historietas-bottom-nav-item[href^="/admin"] .historietas-bottom-nav-icon,
              .historietas-bottom-nav-item[href*="/admin/"] .historietas-bottom-nav-icon {
                font-size: 0;
              }

              .historietas-bottom-nav-item[href^="/admin"] .historietas-bottom-nav-icon::before,
              .historietas-bottom-nav-item[href*="/admin/"] .historietas-bottom-nav-icon::before {
                content: "";
                width: 24px;
                height: 24px;
                display: block;
                background: currentColor;
                -webkit-mask: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5.5 20V5.4C5.5 4.85 5.95 4.4 6.5 4.4H18.1C18.91 4.4 19.38 5.32 18.9 5.97L16.95 8.55C16.69 8.9 16.69 9.38 16.95 9.73L18.9 12.31C19.38 12.96 18.91 13.88 18.1 13.88H6.25M5.5 20H8.25' stroke='black' stroke-width='2.05' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / contain no-repeat;
                mask: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5.5 20V5.4C5.5 4.85 5.95 4.4 6.5 4.4H18.1C18.91 4.4 19.38 5.32 18.9 5.97L16.95 8.55C16.69 8.9 16.69 9.38 16.95 9.73L18.9 12.31C19.38 12.96 18.91 13.88 18.1 13.88H6.25M5.5 20H8.25' stroke='black' stroke-width='2.05' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / contain no-repeat;
              }

              html[data-historietas-tema-visual] nav.historietas-bottom-nav a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
              html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active),
              html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) {
                min-width: 20% !important;
                flex: 0 0 20% !important;
                color: var(--historietas-bottom-nav-text, rgba(173, 149, 234, 0.82)) !important;
                border-color: transparent !important;
                background: transparent !important;
                box-shadow: none !important;
              }

              html[data-historietas-tema-visual] nav.historietas-bottom-nav a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) .historietas-bottom-nav-icon,
              html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) .historietas-bottom-nav-icon,
              html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"]:not([aria-current="page"]):not(.historietas-bottom-nav-item-active) .historietas-bottom-nav-icon {
                color: #FFFFFF !important;
                background: var(--historietas-bottom-nav-publish-bg, rgba(59, 7, 100, 0.72)) !important;
                border-color: var(--historietas-bottom-nav-publish-border, rgba(167, 139, 250, 0.34)) !important;
              }

              .historietas-bottom-nav-item:not([href="/publicar"]) .historietas-bottom-nav-icon,
              .historietas-bottom-nav-item:not([href="/publicar"])[aria-current="page"] .historietas-bottom-nav-icon,
              .historietas-bottom-nav-item:not([href="/publicar"]).historietas-bottom-nav-item-active .historietas-bottom-nav-icon {
                background: transparent !important;
                border: 0 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
              }

              .historietas-bottom-nav-item:not([href="/publicar"]) {
                background: transparent !important;
                border: 0 !important;
                box-shadow: none !important;
              }

              @media (max-width: 767px) {
                .historietas-app-shell {
                  padding-bottom: calc(58px + env(safe-area-inset-bottom));
                }

                .historietas-bottom-nav {
                  display: flex;
                }
              }

              @media (max-width: 360px) {
                .historietas-bottom-nav {
                  min-height: 52px;
                  padding-top: 3px;
                  padding-bottom: max(3px, env(safe-area-inset-bottom));
                }

                .historietas-bottom-nav-item,
                .historietas-bottom-nav-main {
                  min-height: 42px;
                }

                .historietas-bottom-nav-icon {
                  width: 27px;
                  height: 27px;
                }

                .historietas-bottom-nav-svg {
                  width: 23px;
                  height: 23px;
                }

                .historietas-bottom-nav-publish-icon {
                  width: 34px !important;
                  height: 34px !important;
                }

                .historietas-bottom-nav-profile-avatar {
                  width: 26px;
                  height: 26px;
                }
              }



              /* RESET FINAL DO NAVBOTTOM: remove qualquer quadrado, blur, fundo roxo ou efeito de clique dos ícones */
              nav.historietas-bottom-nav,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav,
              html[data-historietas-tema-visual] [data-bottom-nav],
              html[data-historietas-tema-visual] [data-mobile-nav] {
                border-top-color: var(--historietas-bottom-nav-bg, rgba(7, 2, 18, 0.98)) !important;
                box-shadow: none !important;
                filter: none !important;
                backdrop-filter: none !important;
              }

              nav.historietas-bottom-nav .historietas-bottom-nav-item,
              nav.historietas-bottom-nav .historietas-bottom-nav-item:hover,
              nav.historietas-bottom-nav .historietas-bottom-nav-item:active,
              nav.historietas-bottom-nav .historietas-bottom-nav-item:focus,
              nav.historietas-bottom-nav .historietas-bottom-nav-item:focus-visible,
              nav.historietas-bottom-nav .historietas-bottom-nav-item[aria-current="page"],
              nav.historietas-bottom-nav .historietas-bottom-nav-item-active,
              html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-item,
              html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-item:hover,
              html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-item:active,
              html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-item:focus,
              html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-item:focus-visible,
              html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-item[aria-current="page"],
              html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-item-active,
              html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-item,
              html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-item:hover,
              html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-item:active,
              html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-item:focus,
              html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-item:focus-visible,
              html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-item[aria-current="page"],
              html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-item-active {
                background: transparent !important;
                border: 0 !important;
                box-shadow: none !important;
                outline: none !important;
                filter: none !important;
                backdrop-filter: none !important;
                transform: none !important;
              }

              nav.historietas-bottom-nav .historietas-bottom-nav-item::before,
              nav.historietas-bottom-nav .historietas-bottom-nav-item::after,
              html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-item::before,
              html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-item::after,
              html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-item::before,
              html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-item::after {
                content: none !important;
                display: none !important;
                background: transparent !important;
                box-shadow: none !important;
                filter: none !important;
                backdrop-filter: none !important;
              }

              nav.historietas-bottom-nav .historietas-bottom-nav-icon,
              nav.historietas-bottom-nav .historietas-bottom-nav-item:hover .historietas-bottom-nav-icon,
              nav.historietas-bottom-nav .historietas-bottom-nav-item:active .historietas-bottom-nav-icon,
              nav.historietas-bottom-nav .historietas-bottom-nav-item:focus .historietas-bottom-nav-icon,
              nav.historietas-bottom-nav .historietas-bottom-nav-item:focus-visible .historietas-bottom-nav-icon,
              nav.historietas-bottom-nav .historietas-bottom-nav-item[aria-current="page"] .historietas-bottom-nav-icon,
              nav.historietas-bottom-nav .historietas-bottom-nav-item-active .historietas-bottom-nav-icon,
              html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-icon,
              html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-item:hover .historietas-bottom-nav-icon,
              html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-item:active .historietas-bottom-nav-icon,
              html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-item:focus .historietas-bottom-nav-icon,
              html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-item:focus-visible .historietas-bottom-nav-icon,
              html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-item[aria-current="page"] .historietas-bottom-nav-icon,
              html[data-historietas-tema-visual] [data-bottom-nav] .historietas-bottom-nav-item-active .historietas-bottom-nav-icon,
              html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-icon,
              html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-item:hover .historietas-bottom-nav-icon,
              html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-item:active .historietas-bottom-nav-icon,
              html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-item:focus .historietas-bottom-nav-icon,
              html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-item:focus-visible .historietas-bottom-nav-icon,
              html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-item[aria-current="page"] .historietas-bottom-nav-icon,
              html[data-historietas-tema-visual] [data-mobile-nav] .historietas-bottom-nav-item-active .historietas-bottom-nav-icon {
                background: transparent !important;
                border: 0 !important;
                box-shadow: none !important;
                filter: none !important;
                backdrop-filter: none !important;
              }

              nav.historietas-bottom-nav .historietas-bottom-nav-publish-icon,
              nav.historietas-bottom-nav .historietas-bottom-nav-item[href="/publicar"] .historietas-bottom-nav-publish-icon,
              nav.historietas-bottom-nav .historietas-bottom-nav-item[href="/publicar"]:hover .historietas-bottom-nav-publish-icon,
              nav.historietas-bottom-nav .historietas-bottom-nav-item[href="/publicar"]:active .historietas-bottom-nav-publish-icon,
              nav.historietas-bottom-nav .historietas-bottom-nav-item[href="/publicar"]:focus .historietas-bottom-nav-publish-icon,
              nav.historietas-bottom-nav .historietas-bottom-nav-item[href="/publicar"]:focus-visible .historietas-bottom-nav-publish-icon,
              nav.historietas-bottom-nav .historietas-bottom-nav-item[href="/publicar"][aria-current="page"] .historietas-bottom-nav-publish-icon,
              nav.historietas-bottom-nav .historietas-bottom-nav-item[href="/publicar"].historietas-bottom-nav-item-active .historietas-bottom-nav-publish-icon,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav a[href="/publicar"] .historietas-bottom-nav-publish-icon,
              html[data-historietas-tema-visual] [data-bottom-nav] a[href="/publicar"] .historietas-bottom-nav-publish-icon,
              html[data-historietas-tema-visual] [data-mobile-nav] a[href="/publicar"] .historietas-bottom-nav-publish-icon {
                background: #17131D !important;
                border: 0 !important;
                box-shadow: none !important;
                filter: none !important;
                backdrop-filter: none !important;
              }

              nav.historietas-bottom-nav .historietas-bottom-nav-profile-avatar,
              nav.historietas-bottom-nav .historietas-bottom-nav-item[aria-current="page"] .historietas-bottom-nav-profile-avatar,
              nav.historietas-bottom-nav .historietas-bottom-nav-item-active .historietas-bottom-nav-profile-avatar {
                box-shadow: none !important;
                filter: none !important;
                backdrop-filter: none !important;
              }



              /* CORES FIXAS DO NAVBOTTOM: impede tema da página de virar laranja/vermelho */
              nav.historietas-bottom-nav .historietas-bottom-nav-item,
              nav.historietas-bottom-nav .historietas-bottom-nav-item:visited,
              nav.historietas-bottom-nav .historietas-bottom-nav-item:hover,
              nav.historietas-bottom-nav .historietas-bottom-nav-item:active,
              nav.historietas-bottom-nav .historietas-bottom-nav-item:focus,
              nav.historietas-bottom-nav .historietas-bottom-nav-item:focus-visible,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item:visited,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item:hover,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item:active,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item:focus,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item:focus-visible {
                color: #AD95EA !important;
                -webkit-text-fill-color: #AD95EA !important;
              }

              nav.historietas-bottom-nav .historietas-bottom-nav-item[aria-current="page"],
              nav.historietas-bottom-nav .historietas-bottom-nav-item-active,
              nav.historietas-bottom-nav .historietas-bottom-nav-item[aria-current="page"]:visited,
              nav.historietas-bottom-nav .historietas-bottom-nav-item-active:visited,
              nav.historietas-bottom-nav .historietas-bottom-nav-item[aria-current="page"]:hover,
              nav.historietas-bottom-nav .historietas-bottom-nav-item-active:hover,
              nav.historietas-bottom-nav .historietas-bottom-nav-item[aria-current="page"]:active,
              nav.historietas-bottom-nav .historietas-bottom-nav-item-active:active,
              nav.historietas-bottom-nav .historietas-bottom-nav-item[aria-current="page"]:focus,
              nav.historietas-bottom-nav .historietas-bottom-nav-item-active:focus,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item[aria-current="page"],
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item-active,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item[aria-current="page"]:visited,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item-active:visited,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item[aria-current="page"]:hover,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item-active:hover,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item[aria-current="page"]:active,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item-active:active,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item[aria-current="page"]:focus,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item-active:focus {
                color: #FFFFFF !important;
                -webkit-text-fill-color: #FFFFFF !important;
              }

              nav.historietas-bottom-nav .historietas-bottom-nav-icon,
              nav.historietas-bottom-nav .historietas-bottom-nav-svg,
              nav.historietas-bottom-nav .historietas-bottom-nav-svg *,
              nav.historietas-bottom-nav .historietas-bottom-nav-icon::before,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-icon,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-svg,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-svg *,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-icon::before {
                color: currentColor !important;
                stroke: currentColor !important;
                fill: none;
              }

              nav.historietas-bottom-nav .historietas-bottom-nav-item[href="/publicar"],
              nav.historietas-bottom-nav .historietas-bottom-nav-item[href="/publicar"]:visited,
              nav.historietas-bottom-nav .historietas-bottom-nav-item[href="/publicar"]:hover,
              nav.historietas-bottom-nav .historietas-bottom-nav-item[href="/publicar"]:active,
              nav.historietas-bottom-nav .historietas-bottom-nav-item[href="/publicar"]:focus,
              nav.historietas-bottom-nav .historietas-bottom-nav-item[href="/publicar"]:focus-visible,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item[href="/publicar"],
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item[href="/publicar"]:visited,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item[href="/publicar"]:hover,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item[href="/publicar"]:active,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item[href="/publicar"]:focus,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-item[href="/publicar"]:focus-visible {
                color: #FFFFFF !important;
                -webkit-text-fill-color: #FFFFFF !important;
              }

              nav.historietas-bottom-nav .historietas-bottom-nav-profile-avatar,
              html[data-historietas-tema-visual] nav.historietas-bottom-nav .historietas-bottom-nav-profile-avatar {
                color: #FFFFFF !important;
                -webkit-text-fill-color: #FFFFFF !important;
                border-color: rgba(173, 149, 234, 0.86) !important;
              }



              /* Mantém o Bottom Nav como carrossel: 5 botões visíveis e o Admin aparece ao deslizar. */
              html[data-historietas-bottom-nav-oculto="true"] .historietas-app-shell,
              html[data-historietas-bottom-nav-oculto="true"] body .historietas-app-shell {
                padding-bottom: 0 !important;
              }

              html[data-historietas-bottom-nav-oculto="true"] .historietas-bottom-nav,
              html[data-historietas-bottom-nav-oculto="true"] body .historietas-bottom-nav,
              html[data-historietas-bottom-nav-oculto="true"] [data-bottom-nav],
              html[data-historietas-bottom-nav-oculto="true"] [data-mobile-nav] {
                display: none !important;
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