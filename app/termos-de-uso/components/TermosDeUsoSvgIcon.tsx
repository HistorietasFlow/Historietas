import type { ReactNode } from "react";
import type { IconName } from "../lib/termos-de-uso-content";

export function TermosDeUsoSvgIcon({
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
    arrowRight: (
      <>
        <path {...common} d="M5 12h14" />
        <path {...common} d="m12 5 7 7-7 7" />
      </>
    ),
    file: (
      <>
        <path {...common} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path {...common} d="M14 2v6h6" />
        <path {...common} d="M8 13h8M8 17h6" />
      </>
    ),
    user: (
      <>
        <circle {...common} cx="12" cy="7" r="4" />
        <path {...common} d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    book: (
      <>
        <path {...common} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path {...common} d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z" />
      </>
    ),
    copyright: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M15 9.5a4 4 0 1 0 0 5" />
      </>
    ),
    shield: (
      <>
        <path {...common} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path {...common} d="m9 12 2 2 4-4" />
      </>
    ),
    comment: (
      <>
        <path {...common} d="M21 12a8 8 0 0 1-8 8H7l-4 3v-6a8 8 0 1 1 18-5Z" />
        <path {...common} d="M8 12h.01M12 12h.01M16 12h.01" />
      </>
    ),
    alert: (
      <>
        <path {...common} d="M10.3 3.8 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
        <path {...common} d="M12 9v4M12 17h.01" />
      </>
    ),
    settings: (
      <>
        <circle {...common} cx="12" cy="12" r="3" />
        <path {...common} d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3-.2-.1a1.7 1.7 0 0 0-2-.2 1.7 1.7 0 0 0-1 1.5V21h-3.4v-.3a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-2 .2l-.2.1-2-3 .1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.4-1H3v-4h.2a1.7 1.7 0 0 0 1.4-1 1.7 1.7 0 0 0-.3-1.9L4.2 7l2-3 .2.1a1.7 1.7 0 0 0 2 .2 1.7 1.7 0 0 0 1-1.5V2h3.4v.3a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 2-.2l.2-.1 2 3-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.4 1h.2v4h-.2a1.7 1.7 0 0 0-1.4 1Z" />
      </>
    ),
    ban: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="m5.6 5.6 12.8 12.8" />
      </>
    ),
    server: (
      <>
        <rect {...common} x="3" y="3" width="18" height="7" rx="2" />
        <rect {...common} x="3" y="14" width="18" height="7" rx="2" />
        <path {...common} d="M7 6.5h.01M7 17.5h.01" />
      </>
    ),
    scale: (
      <>
        <path {...common} d="M12 3v18M5 6h14M7 6l-4 7h8L7 6ZM17 6l-4 7h8l-4-7Z" />
        <path {...common} d="M8 21h8" />
      </>
    ),
    refresh: (
      <>
        <path {...common} d="M20 6v5h-5" />
        <path {...common} d="M4 18v-5h5" />
        <path {...common} d="M18.5 9A7 7 0 0 0 6 6.5L4 11M5.5 15A7 7 0 0 0 18 17.5l2-4.5" />
      </>
    ),
    help: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M9.6 9.1a2.7 2.7 0 0 1 5.1 1.2c0 2-2.7 2.3-2.7 4" />
        <path {...common} d="M12 18h.01" />
      </>
    ),
    check: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="m8 12 2.6 2.6L16 9" />
      </>
    ),
    info: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M12 11v5M12 8h.01" />
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
