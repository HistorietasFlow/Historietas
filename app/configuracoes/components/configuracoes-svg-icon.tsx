import type { ReactNode } from "react";

export type IconName =
  | "user"
  | "mail"
  | "lock"
  | "shield"
  | "bell"
  | "book"
  | "bookmark"
  | "clock"
  | "star"
  | "trophy"
  | "palette"
  | "moon"
  | "download"
  | "copy"
  | "database"
  | "help"
  | "file"
  | "logout"
  | "trash"
  | "admin"
  | "chart"
  | "pen"
  | "comment"
  | "settings"
  | "search"
  | "arrowLeft"
  | "chevronRight"
  | "check"
  | "layers"
  | "spark";

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

  const paths: Record<IconName, ReactNode> = {
    user: (
      <>
        <path {...common} d="M20 21a8 8 0 0 0-16 0" />
        <circle {...common} cx="12" cy="7" r="4" />
      </>
    ),
    mail: (
      <>
        <rect {...common} x="3" y="5" width="18" height="14" rx="2" />
        <path {...common} d="m3 7 9 6 9-6" />
      </>
    ),
    lock: (
      <>
        <rect {...common} x="5" y="10" width="14" height="10" rx="2" />
        <path {...common} d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    shield: <path {...common} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
    bell: (
      <>
        <path {...common} d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path {...common} d="M10 21h4" />
      </>
    ),
    book: (
      <>
        <path {...common} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path {...common} d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
      </>
    ),
    bookmark: <path {...common} d="M6 3h12v18l-6-4-6 4V3Z" />,
    clock: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M12 7v5l3 3" />
      </>
    ),
    star: (
      <path
        {...common}
        d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.9-5.4 2.9 1-6-4.3-4.2 6-.9L12 3Z"
      />
    ),
    trophy: (
      <>
        <path {...common} d="M8 21h8" />
        <path {...common} d="M12 17v4" />
        <path {...common} d="M7 4h10v6a5 5 0 0 1-10 0V4Z" />
        <path {...common} d="M5 5H3v3a3 3 0 0 0 3 3h1" />
        <path {...common} d="M19 5h2v3a3 3 0 0 1-3 3h-1" />
      </>
    ),
    palette: (
      <>
        <circle {...common} cx="13.5" cy="6.5" r=".5" />
        <circle {...common} cx="17.5" cy="10.5" r=".5" />
        <circle {...common} cx="8.5" cy="7.5" r=".5" />
        <circle {...common} cx="6.5" cy="12.5" r=".5" />
        <path
          {...common}
          d="M12 3a9 9 0 0 0 0 18h1.4a2.6 2.6 0 0 0 2.2-4c-.5-.8.1-1.9 1-1.9H18a6 6 0 0 0 0-12h-6Z"
        />
      </>
    ),
    moon: <path {...common} d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
    download: (
      <>
        <path {...common} d="M12 3v12" />
        <path {...common} d="m7 10 5 5 5-5" />
        <path {...common} d="M5 21h14" />
      </>
    ),
    copy: (
      <>
        <rect {...common} x="9" y="9" width="12" height="12" rx="2" />
        <rect {...common} x="3" y="3" width="12" height="12" rx="2" />
      </>
    ),
    database: (
      <>
        <ellipse {...common} cx="12" cy="5" rx="8" ry="3" />
        <path {...common} d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
        <path {...common} d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
      </>
    ),
    help: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M9.5 9a2.7 2.7 0 0 1 5.1 1.3c0 2-2.6 2.2-2.6 4" />
        <path {...common} d="M12 18h.01" />
      </>
    ),
    file: (
      <>
        <path {...common} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path {...common} d="M14 2v6h6" />
      </>
    ),
    logout: (
      <>
        <path {...common} d="M10 17l5-5-5-5" />
        <path {...common} d="M15 12H3" />
        <path {...common} d="M21 3v18" />
      </>
    ),
    trash: (
      <>
        <path {...common} d="M3 6h18" />
        <path {...common} d="M8 6V4h8v2" />
        <path {...common} d="M19 6l-1 15H6L5 6" />
        <path {...common} d="M10 11v5" />
        <path {...common} d="M14 11v5" />
      </>
    ),
    admin: (
      <>
        <path {...common} d="M12 3 3 8l9 5 9-5-9-5Z" />
        <path {...common} d="m3 13 9 5 9-5" />
      </>
    ),
    chart: (
      <>
        <path {...common} d="M4 19V5" />
        <path {...common} d="M4 19h16" />
        <path {...common} d="M8 16v-5" />
        <path {...common} d="M12 16V8" />
        <path {...common} d="M16 16v-3" />
      </>
    ),
    pen: (
      <>
        <path {...common} d="M12 20h9" />
        <path {...common} d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),
    comment: (
      <>
        <path {...common} d="M21 12a8 8 0 0 1-8 8H7l-4 3v-6a8 8 0 1 1 18-5Z" />
      </>
    ),
    settings: (
      <>
        <circle {...common} cx="12" cy="12" r="3" />
        <path
          {...common}
          d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3-.2-.1a1.7 1.7 0 0 0-2-.2 1.7 1.7 0 0 0-1 1.5V21h-3.4v-.3a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-2 .2l-.2.1-2-3 .1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.4-1H3v-4h.2a1.7 1.7 0 0 0 1.4-1 1.7 1.7 0 0 0-.3-1.9L4.2 7l2-3 .2.1a1.7 1.7 0 0 0 2 .2 1.7 1.7 0 0 0 1-1.5V2h3.4v.3a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 2-.2l.2-.1 2 3-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.4 1h.2v4h-.2a1.7 1.7 0 0 0-1.4 1Z"
        />
      </>
    ),
    search: (
      <>
        <circle {...common} cx="11" cy="11" r="7" />
        <path {...common} d="m20 20-3.5-3.5" />
      </>
    ),
    arrowLeft: (
      <>
        <path {...common} d="M19 12H5" />
        <path {...common} d="m12 19-7-7 7-7" />
      </>
    ),
    chevronRight: <path {...common} d="m9 18 6-6-6-6" />,
    check: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="m8 12 2.6 2.6L16 9" />
      </>
    ),
    layers: (
      <>
        <path {...common} d="m12 2 9 5-9 5-9-5 9-5Z" />
        <path {...common} d="m3 12 9 5 9-5" />
        <path {...common} d="m3 17 9 5 9-5" />
      </>
    ),
    spark: (
      <>
        <path {...common} d="M12 2v5" />
        <path {...common} d="M12 17v5" />
        <path {...common} d="M4.9 4.9 8.4 8.4" />
        <path {...common} d="m15.6 15.6 3.5 3.5" />
        <path {...common} d="M2 12h5" />
        <path {...common} d="M17 12h5" />
        <path {...common} d="m4.9 19.1 3.5-3.5" />
        <path {...common} d="m15.6 8.4 3.5-3.5" />
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
      {paths[name]}
    </svg>
  );
}
