import type { Metadata, Viewport } from "next";
import Link from "next/link";
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
  themeColor: "#0B0614",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <div className="historietas-app-shell">{children}</div>

        <nav className="historietas-bottom-nav" aria-label="Navegação inferior">
          <Link href="/" className="historietas-bottom-nav-item">
            <span className="historietas-bottom-nav-icon">⌂</span>
            <span className="historietas-bottom-nav-label">Home</span>
          </Link>

          <Link href="/explorar" className="historietas-bottom-nav-item">
            <span className="historietas-bottom-nav-icon">◇</span>
            <span className="historietas-bottom-nav-label">Explorar</span>
          </Link>

          <Link
            href="/publicar"
            className="historietas-bottom-nav-item historietas-bottom-nav-main"
          >
            <span className="historietas-bottom-nav-icon">＋</span>
            <span className="historietas-bottom-nav-label">Publicar</span>
          </Link>

          <Link href="/biblioteca" className="historietas-bottom-nav-item">
            <span className="historietas-bottom-nav-icon">▣</span>
            <span className="historietas-bottom-nav-label">Biblioteca</span>
          </Link>

          <Link href="/painel-autor" className="historietas-bottom-nav-item">
            <span className="historietas-bottom-nav-icon">◉</span>
            <span className="historietas-bottom-nav-label">Painel</span>
          </Link>
        </nav>

        <style
          dangerouslySetInnerHTML={{
            __html: `
              .historietas-app-shell {
                width: 100%;
                max-width: 100%;
                min-height: 100vh;
                overflow-x: hidden;
              }

              .historietas-bottom-nav {
                position: fixed;
                left: 50%;
                bottom: max(10px, env(safe-area-inset-bottom));
                z-index: 80;
                width: min(430px, calc(100% - 18px));
                min-height: 66px;
                transform: translateX(-50%);
                display: none;
                align-items: center;
                justify-content: space-between;
                gap: 5px;
                padding: 7px;
                border-radius: 24px;
                border: 1px solid rgba(255, 255, 255, 0.12);
                background:
                  radial-gradient(circle at 16% 0%, rgba(249, 115, 22, 0.18), transparent 34%),
                  radial-gradient(circle at 84% 0%, rgba(124, 58, 237, 0.24), transparent 38%),
                  linear-gradient(180deg, rgba(18, 8, 31, 0.98) 0%, rgba(11, 6, 20, 0.98) 100%);
                box-shadow:
                  0 14px 34px rgba(0, 0, 0, 0.42),
                  0 0 24px rgba(124, 58, 237, 0.13),
                  inset 0 1px 0 rgba(255, 255, 255, 0.07);
                overflow: hidden;
              }

              .historietas-bottom-nav::before {
                content: "";
                position: absolute;
                inset: 0;
                pointer-events: none;
                background: linear-gradient(
                  90deg,
                  transparent 0%,
                  rgba(255, 255, 255, 0.05) 50%,
                  transparent 100%
                );
              }

              .historietas-bottom-nav-item {
                position: relative;
                z-index: 1;
                min-width: 0;
                flex: 1 1 0;
                min-height: 50px;
                padding: 6px 3px;
                border-radius: 18px;
                display: inline-flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 4px;
                color: #d4d4d8;
                text-decoration: none;
                font-family: var(--font-geist-sans), Arial, Helvetica, sans-serif;
                border: 1px solid transparent;
                background: transparent;
                -webkit-tap-highlight-color: transparent;
                transition:
                  transform 120ms ease,
                  background 120ms ease,
                  border-color 120ms ease,
                  color 120ms ease;
              }

              .historietas-bottom-nav-item:active {
                transform: scale(0.96);
              }

              .historietas-bottom-nav-item:hover {
                color: #ffffff;
                border-color: rgba(255, 255, 255, 0.10);
                background: rgba(255, 255, 255, 0.055);
              }

              .historietas-bottom-nav-main {
                color: #ffffff;
                border-color: rgba(249, 115, 22, 0.55);
                background:
                  radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.12), transparent 54%),
                  linear-gradient(135deg, rgba(249, 115, 22, 0.78) 0%, rgba(124, 58, 237, 0.72) 100%);
                box-shadow:
                  0 10px 22px rgba(249, 115, 22, 0.20),
                  0 0 18px rgba(124, 58, 237, 0.18);
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
                color: #f97316;
                background: rgba(255, 255, 255, 0.045);
                border: 1px solid rgba(255, 255, 255, 0.055);
              }

              .historietas-bottom-nav-main .historietas-bottom-nav-icon {
                color: #ffffff;
                background: rgba(255, 255, 255, 0.16);
                border-color: rgba(255, 255, 255, 0.18);
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
                  width: min(430px, calc(100% - 12px));
                  bottom: max(6px, env(safe-area-inset-bottom));
                  padding: 6px;
                  border-radius: 22px;
                  gap: 3px;
                }

                .historietas-bottom-nav-item {
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
      </body>
    </html>
  );
}