"use client";

import { Children, useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

type HomeCarouselRowProps = {
  children: ReactNode;
  isDesktop: boolean;
  variant?: "obra" | "autor";
};

export default function HomeCarouselRow({
  children,
  isDesktop,
  variant = "obra",
}: HomeCarouselRowProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const totalItems = Children.count(children);
  const precisaDeCarrossel = isDesktop && totalItems > 3;

  const listStyle = !isDesktop
    ? variant === "autor"
      ? authorListStyle
      : storyListStyle
    : precisaDeCarrossel
      ? variant === "autor"
        ? desktopAuthorListStyle
        : desktopStoryListStyle
      : variant === "autor"
        ? desktopStaticAuthorListStyle
        : desktopStaticStoryListStyle;

  useEffect(() => {
    const row = rowRef.current;

    if (!row) {
      return;
    }

    const voltarParaInicio = () => {
      row.scrollLeft = 0;
    };

    voltarParaInicio();

    const frame = window.requestAnimationFrame(voltarParaInicio);
    const timer = window.setTimeout(voltarParaInicio, 90);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [isDesktop, precisaDeCarrossel, totalItems, variant]);

  function rolarCarrossel(direcao: -1 | 1) {
    rowRef.current?.scrollBy({
      left: direcao * 450,
      behavior: "smooth",
    });
  }

  if (!isDesktop || !precisaDeCarrossel) {
    return (
      <div ref={rowRef} style={listStyle}>
        {children}
      </div>
    );
  }

  return (
    <div style={desktopCarouselShellStyle}>
      <button
        type="button"
        onClick={() => rolarCarrossel(-1)}
        style={desktopCarouselArrowLeftStyle}
        aria-label="Rolar carrossel para a esquerda"
      >
        <span
          aria-hidden="true"
          style={desktopCarouselArrowLeftIconStyle}
        />
      </button>

      <div ref={rowRef} style={listStyle}>
        {children}
      </div>

      <button
        type="button"
        onClick={() => rolarCarrossel(1)}
        style={desktopCarouselArrowRightStyle}
        aria-label="Rolar carrossel para a direita"
      >
        <span
          aria-hidden="true"
          style={desktopCarouselArrowRightIconStyle}
        />
      </button>
    </div>
  );
}

const storyListStyle: CSSProperties = {
  display: "flex",
  gap: "14px",
  width: "calc(100% + 24px)",
  maxWidth: "calc(100% + 24px)",
  minWidth: 0,
  boxSizing: "border-box",
  overflowX: "auto",
  overflowY: "hidden",
  padding: "2px 12px 8px",
  margin: "0 -12px",
  scrollSnapType: "x mandatory",
  scrollPaddingLeft: "12px",
  scrollPaddingRight: "12px",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};

const desktopCarouselShellStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: "100%",
  overflow: "visible",
  boxSizing: "border-box",
};

const desktopStoryListStyle: CSSProperties = {
  ...storyListStyle,
  gap: "18px",
  width: "100vw",
  maxWidth: "100vw",
  marginLeft: "calc(50% - 50vw)",
  marginRight: "calc(50% - 50vw)",
  padding:
    "6px max(24px, calc((100vw - 1760px) / 2)) 20px",
  scrollPaddingLeft: "max(24px, calc((100vw - 1760px) / 2))",
  scrollPaddingRight: "max(24px, calc((100vw - 1760px) / 2))",
};

const desktopStaticStoryListStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, 360px)",
  justifyContent: "space-between",
  gap: "18px",
  width: "100%",
  maxWidth: "100%",
  padding: "6px 0 10px",
  margin: 0,
  boxSizing: "border-box",
  overflow: "visible",
};

const desktopCarouselArrowBaseStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 4,
  width: "52px",
  height: "96px",
  padding: 0,
  borderRadius: 0,
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "none",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
};

const desktopCarouselArrowLeftStyle: CSSProperties = {
  ...desktopCarouselArrowBaseStyle,
  left: "-10px",
};

const desktopCarouselArrowRightStyle: CSSProperties = {
  ...desktopCarouselArrowBaseStyle,
  right: "-10px",
};

const desktopCarouselArrowIconBaseStyle: CSSProperties = {
  display: "block",
  width: "18px",
  height: "18px",
  borderTop: "4px solid #FFFFFF",
  borderRight: "4px solid #FFFFFF",
  filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.92))",
  pointerEvents: "none",
  boxSizing: "border-box",
};

const desktopCarouselArrowLeftIconStyle: CSSProperties = {
  ...desktopCarouselArrowIconBaseStyle,
  transform: "rotate(-135deg)",
};

const desktopCarouselArrowRightIconStyle: CSSProperties = {
  ...desktopCarouselArrowIconBaseStyle,
  transform: "rotate(45deg)",
};

const authorListStyle: CSSProperties = {
  ...storyListStyle,
  gap: "12px",
  padding: "2px 12px 8px",
};

const desktopAuthorListStyle: CSSProperties = {
  ...authorListStyle,
  gap: "16px",
  width: "100vw",
  maxWidth: "100vw",
  marginLeft: "calc(50% - 50vw)",
  marginRight: "calc(50% - 50vw)",
  padding:
    "6px max(24px, calc((100vw - 1760px) / 2)) 18px",
  scrollPaddingLeft: "max(24px, calc((100vw - 1760px) / 2))",
  scrollPaddingRight: "max(24px, calc((100vw - 1760px) / 2))",
};

const desktopStaticAuthorListStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
  gap: "16px",
  width: "100%",
  maxWidth: "100%",
  padding: "6px 0 8px",
  margin: 0,
  boxSizing: "border-box",
  overflow: "visible",
};
