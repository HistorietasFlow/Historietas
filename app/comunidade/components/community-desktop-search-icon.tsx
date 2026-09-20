import type { CSSProperties } from "react";

export function CommunityDesktopSearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={desktopSearchIconStyle}
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
  );
}

const desktopSearchIconStyle: CSSProperties = {
  position: "absolute",
  left: "13px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "rgba(255,255,255,0.56)",
  pointerEvents: "none",
};
