import type { ReactNode } from "react";
import type { IconName } from "../lib/ajuda-content";

export function SvgIcon({
  name,
  size = 24,
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const icons: Record<IconName, ReactNode> = {
    arrowLeft: (
      <>
        <path {...common} d="M19 12H5" />
        <path {...common} d="m12 19-7-7 7-7" />
      </>
    ),
    search: (
      <>
        <circle {...common} cx="11" cy="11" r="7" />
        <path {...common} d="m20 20-3.4-3.4" />
      </>
    ),
    help: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M9.6 9.1a2.7 2.7 0 0 1 5.1 1.2c0 2-2.7 2.3-2.7 4" />
        <path {...common} d="M12 18h.01" />
      </>
    ),
    user: (
      <>
        <circle {...common} cx="12" cy="7" r="4" />
        <path {...common} d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    pen: (
      <>
        <path {...common} d="M12 20h9" />
        <path {...common} d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),
    book: (
      <>
        <path {...common} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path {...common} d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z" />
      </>
    ),
    message: (
      <>
        <path {...common} d="M21 12a8 8 0 0 1-8 8H7l-4 3v-6a8 8 0 1 1 18-5Z" />
        <path {...common} d="M8 10h8M8 14h5" />
      </>
    ),
    shield: <path {...common} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
    settings: (
      <>
        <circle {...common} cx="12" cy="12" r="3" />
        <path {...common} d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3-.2-.1a1.7 1.7 0 0 0-2-.2 1.7 1.7 0 0 0-1 1.5V21h-3.4v-.3a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-2 .2l-.2.1-2-3 .1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.4-1H3v-4h.2a1.7 1.7 0 0 0 1.4-1 1.7 1.7 0 0 0-.3-1.9L4.2 7l2-3 .2.1a1.7 1.7 0 0 0 2 .2 1.7 1.7 0 0 0 1-1.5V2h3.4v.3a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 2-.2l.2-.1 2 3-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.4 1h.2v4h-.2a1.7 1.7 0 0 0-1.4 1Z" />
      </>
    ),
    bell: (
      <>
        <path {...common} d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path {...common} d="M10 21h4" />
      </>
    ),
    chevronDown: <path {...common} d="m6 9 6 6 6-6" />,
    arrowRight: (
      <>
        <path {...common} d="M5 12h14" />
        <path {...common} d="m12 5 7 7-7 7" />
      </>
    ),
    spark: (
      <>
        <path {...common} d="M12 2v5M12 17v5M4.9 4.9l3.5 3.5M15.6 15.6l3.5 3.5" />
        <path {...common} d="M2 12h5M17 12h5M4.9 19.1l3.5-3.5M15.6 8.4l3.5-3.5" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {icons[name]}
    </svg>
  );
}
