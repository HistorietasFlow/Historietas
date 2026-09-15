import type { MenuPerfilIconeTipo } from "../types";

export function CadeadoAvaliacaoDiarioIcone() {
  return (
    <svg
      width="23"
      height="25"
      viewBox="0 0 24 26"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M7 9V6.75C7 3.57 9.24 1 12 1s5 2.57 5 5.75V9h-2.75V6.75c0-1.55-1-2.8-2.25-2.8S9.75 5.2 9.75 6.75V9H7Z"
      />
      <rect
        x="3"
        y="8"
        width="18"
        height="16"
        rx="3.2"
        fill="currentColor"
      />
      <circle cx="12" cy="15" r="1.65" fill="rgba(0,0,0,0.88)" />
      <rect
        x="11.15"
        y="15.7"
        width="1.7"
        height="4"
        rx="0.85"
        fill="rgba(0,0,0,0.88)"
      />
    </svg>
  );
}

export function MenuPerfilIcone({ tipo }: { tipo: MenuPerfilIconeTipo }) {
  const iconProps = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.1,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  } as const;

  if (tipo === "painel") {
    return (
      <svg {...iconProps}>
        <path d="M4 19V5" />
        <path d="M20 19H4" />
        <path d="M8 16V10" />
        <path d="M12 16V7" />
        <path d="M16 16v-4" />
      </svg>
    );
  }

  if (tipo === "notificacoes") {
    return (
      <svg {...iconProps}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    );
  }

  if (tipo === "configuracoes") {
    return (
      <svg {...iconProps}>
        <path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Z" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.4 1.08V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8.6 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.08-.4H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6A1.65 1.65 0 0 0 10.4 3V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15.4 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.42.18.72.56.72 1v4c0 .44-.3.82-.72 1Z" />
      </svg>
    );
  }

  if (tipo === "link") {
    return (
      <svg {...iconProps}>
        <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L10.9 5.03" />
        <path d="M14 11a5 5 0 0 0-7.07 0L4.81 13.12a5 5 0 0 0 7.07 7.07l1.22-1.22" />
      </svg>
    );
  }

  if (tipo === "sair") {
    return (
      <svg {...iconProps}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
    );
  }

  if (tipo === "comunidade") {
    return (
      <svg {...iconProps}>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
      </svg>
    );
  }

  if (tipo === "denunciar") {
    return (
      <svg {...iconProps}>
        <path d="M12 3 3 7v6c0 5 3.8 7.6 9 8 5.2-.4 9-3 9-8V7l-9-4Z" />
        <path d="M12 8v5" />
        <path d="M12 17h.01" />
      </svg>
    );
  }

  if (tipo === "bloquear") {
    return (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="m6.5 6.5 11 11" />
      </svg>
    );
  }

  return (
    <svg {...iconProps}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
