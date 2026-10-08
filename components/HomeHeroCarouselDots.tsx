import type { CSSProperties } from "react";

type HomeHeroCarouselDotsProps = {
  obras: Array<{ titulo: string }>;
  activeIndex: number;
  onSelect: (index: number) => void;
  isDesktop: boolean;
};

export default function HomeHeroCarouselDots({
  obras,
  activeIndex,
  onSelect,
  isDesktop,
}: HomeHeroCarouselDotsProps) {
  return (
    <div
      style={isDesktop ? desktopHeroDotsStyle : mobileHeroDotsStyle}
      aria-label="Obras em destaque"
    >
      {obras.map((obra, index) => (
        <button
          key={`${obra.titulo}-${index}`}
          type="button"
          onClick={() => onSelect(index)}
          aria-label={`Mostrar ${obra.titulo}`}
          style={
            index === activeIndex
              ? isDesktop
                ? desktopHeroDotActiveStyle
                : mobileHeroDotActiveStyle
              : isDesktop
                ? desktopHeroDotStyle
                : mobileHeroDotStyle
          }
        />
      ))}
    </div>
  );
}

const heroDotsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "4px",
  flexWrap: "wrap",
  maxWidth: "100%",
};

const heroDotStyle: CSSProperties = {
  width: "18px",
  height: "5px",
  borderRadius: "999px",
  border: "0",
  background: "color-mix(in srgb, var(--historietas-text-secondary, #FFFFFF) 24%, transparent)",
  cursor: "pointer",
};

const desktopHeroDotsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "7px",
  width: "auto",
  maxWidth: "100%",
  minWidth: 0,
  marginTop: 0,
  flexWrap: "nowrap",
};

const desktopHeroDotStyle: CSSProperties = {
  width: "28px",
  height: "4px",
  borderRadius: "999px",
  border: 0,
  padding: 0,
  background: "rgba(255,255,255,0.28)",
  cursor: "pointer",
};

const desktopHeroDotActiveStyle: CSSProperties = {
  ...desktopHeroDotStyle,
  width: "46px",
  background: "#FFFFFF",
};

const mobileHeroDotsStyle: CSSProperties = {
  ...heroDotsStyle,
  justifyContent: "flex-end",
  marginTop: 0,
  marginLeft: 0,
  gap: "6px",
};

const mobileHeroDotStyle: CSSProperties = {
  ...heroDotStyle,
  width: "16px",
};

const mobileHeroDotActiveStyle: CSSProperties = {
  ...mobileHeroDotStyle,
  width: "34px",
  background: "rgba(255,255,255,0.58)",
};
