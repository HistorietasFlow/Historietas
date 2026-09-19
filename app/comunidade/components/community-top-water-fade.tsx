import type { CSSProperties } from "react";

type CommunityTopWaterFadeProps = {
  isDesktop: boolean;
};

export function CommunityTopWaterFade({
  isDesktop,
}: CommunityTopWaterFadeProps) {
  return (
    <div
      style={isDesktop ? desktopTopWaterFadeStyle : mobileTopWaterFadeStyle}
      aria-hidden="true"
    />
  );
}

const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(520px, 72vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  opacity: 0,
};

const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  opacity: 0,
};
