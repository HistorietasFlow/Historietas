"use client";

import Link from "next/link";
import { Children, useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import {
  autoresExplorarCarouselStyle,
  desktopAutoresExplorarCarouselStyle,
  desktopObrasExplorarCarouselStyle,
  desktopSectionHeaderStyle,
  desktopSectionMoreLinkStyle,
  desktopSectionTitleStyle,
  explorarCarouselArrowLeftIconStyle,
  explorarCarouselArrowLeftStyle,
  explorarCarouselArrowRightIconStyle,
  explorarCarouselArrowRightStyle,
  explorarCarouselShellStyle,
  obrasExplorarCarouselStyle,
  sectionHeaderSpacerStyle,
  sectionHeaderStyle,
  sectionMoreChevronStyle,
  sectionMoreLinkStyle,
  sectionTitleStyle,
} from "../lib/explorar-content-styles";
import { traduzirTextoExplorar } from "../lib/explorar-translations";

export type ModoConteudoExplorar = "obras" | "autores";

export type TemaCategoriaExplorar = {
  accent: string;
  secondary: string;
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  glowPrimary: string;
  glowSecondary: string;
  titleTo: string;
  activeSurface: string;
  secondarySurface: string;
  secondaryButtonText: string;
  pageBackground: string;
  heroBackground: string;
  activeBackground: string;
};

export function EstadoVazioExplorar({
  possuiObrasPublicadas,
  modoConteudo,
}: {
  possuiObrasPublicadas: boolean;
  modoConteudo: ModoConteudoExplorar;
}) {
  const { language } = useHistorietasLanguage();
  const titulo =
    modoConteudo === "autores"
      ? "Nenhum autor encontrado"
      : possuiObrasPublicadas
        ? "Nenhuma obra encontrada"
        : "PUBLIQUE SUA HISTÓRIA";

  return (
    <p
      style={{
        margin: "10px 0 0",
        color: "#FFFFFF",
        fontSize: "12px",
        fontWeight: 800,
        textAlign: "center",
      }}
    >
      {traduzirTextoExplorar(titulo, language)}
    </p>
  );
}

export function SectionHeader({
  title,
  tema,
  isDesktop,
  href,
}: {
  title: string;
  tema: TemaCategoriaExplorar;
  isDesktop?: boolean;
  href?: string;
}) {
  const { language } = useHistorietasLanguage();
  const tituloTraduzido = traduzirTextoExplorar(title, language);
  const titleStyleTema: CSSProperties = {
    ...(isDesktop ? desktopSectionTitleStyle : sectionTitleStyle),
    background: "none",
    color: "#FFFFFF",
    textAlign: "center",
  };
  const ariaLabelMais =
    language === "en"
      ? `View all in ${tituloTraduzido}`
      : language === "es"
        ? `Ver todo en ${tituloTraduzido}`
        : `Ver tudo em ${tituloTraduzido}`;

  void tema;

  return (
    <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
      <span style={sectionHeaderSpacerStyle} aria-hidden="true" />

      <h2 style={titleStyleTema}>{tituloTraduzido}</h2>

      {href ? (
        <Link
          href={href}
          style={isDesktop ? desktopSectionMoreLinkStyle : sectionMoreLinkStyle}
          aria-label={ariaLabelMais}
          title={ariaLabelMais}
        >
          <span style={sectionMoreChevronStyle} aria-hidden="true">
            ›
          </span>
        </Link>
      ) : (
        <span style={sectionHeaderSpacerStyle} aria-hidden="true" />
      )}
    </div>
  );
}

export function ExplorarCarouselRow({
  children,
  isDesktop,
  variant,
}: {
  children: ReactNode;
  isDesktop: boolean;
  variant: "obra" | "autor";
}) {
  const { language } = useHistorietasLanguage();
  const rowRef = useRef<HTMLDivElement | null>(null);
  const totalItems = Children.count(children);
  const precisaSetas = isDesktop && totalItems > 3;
  const listStyle = isDesktop
    ? variant === "autor"
      ? desktopAutoresExplorarCarouselStyle
      : desktopObrasExplorarCarouselStyle
    : variant === "autor"
      ? autoresExplorarCarouselStyle
      : obrasExplorarCarouselStyle;

  useEffect(() => {
    const row = rowRef.current;

    if (!row) {
      return;
    }

    row.scrollLeft = 0;
  }, [isDesktop, totalItems, variant]);

  function rolar(direcao: -1 | 1) {
    rowRef.current?.scrollBy({
      left: direcao * 460,
      behavior: "smooth",
    });
  }

  if (!precisaSetas) {
    return (
      <div ref={rowRef} style={listStyle}>
        {children}
      </div>
    );
  }

  return (
    <div style={explorarCarouselShellStyle}>
      <button
        type="button"
        onClick={() => rolar(-1)}
        style={explorarCarouselArrowLeftStyle}
        aria-label={traduzirTextoExplorar("Rolar carrossel para a esquerda", language)}
      >
        <span
          aria-hidden="true"
          style={explorarCarouselArrowLeftIconStyle}
        />
      </button>

      <div ref={rowRef} style={listStyle}>
        {children}
      </div>

      <button
        type="button"
        onClick={() => rolar(1)}
        style={explorarCarouselArrowRightStyle}
        aria-label={traduzirTextoExplorar("Rolar carrossel para a direita", language)}
      >
        <span
          aria-hidden="true"
          style={explorarCarouselArrowRightIconStyle}
        />
      </button>
    </div>
  );
}
