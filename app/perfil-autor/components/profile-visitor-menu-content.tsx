import Link from "next/link";
import type { CSSProperties } from "react";
import { MenuPerfilIcone } from "./profile-icons";
import {
  menuChevronStyle,
  menuDangerItemStyle,
  menuDividerStyle,
  menuItemIconStyle,
  menuItemStyle,
  menuItemTextStyle,
  menuSectionTitleStyle,
} from "../styles";

type ProfileVisitorMenuContentProps = {
  blockActionLabel: string;
  blockActionStyle: CSSProperties;
  blockSaving: boolean;
  communityHref: string;
  onBlock: () => void;
  onClose: () => void;
  onCopyLink: () => void;
  onReport: () => void;
};

export function ProfileVisitorMenuContent({
  blockActionLabel,
  blockActionStyle,
  blockSaving,
  communityHref,
  onBlock,
  onClose,
  onCopyLink,
  onReport,
}: ProfileVisitorMenuContentProps) {
  return (
    <>
      <span style={menuSectionTitleStyle}>Perfil</span>

      <button
        type="button"
        onClick={onCopyLink}
        style={menuItemStyle}
      >
        <span style={menuItemIconStyle}><MenuPerfilIcone tipo="link" /></span>
        <strong style={menuItemTextStyle}>
          Copiar link do perfil
        </strong>
        <span style={menuChevronStyle}>›</span>
      </button>

      <Link
        href={communityHref}
        style={menuItemStyle}
        onClick={onClose}
      >
        <span style={menuItemIconStyle}><MenuPerfilIcone tipo="comunidade" /></span>
        <strong style={menuItemTextStyle}>
          Comunidade do autor
        </strong>
        <span style={menuChevronStyle}>›</span>
      </Link>

      <button
        type="button"
        onClick={onReport}
        style={menuDangerItemStyle}
      >
        <span style={menuItemIconStyle}>
          <MenuPerfilIcone tipo="denunciar" />
        </span>
        <strong style={menuItemTextStyle}>
          Denunciar perfil
        </strong>
        <span style={menuChevronStyle}>›</span>
      </button>

      <button
        type="button"
        onClick={onBlock}
        disabled={blockSaving}
        style={blockActionStyle}
      >
        <span style={menuItemIconStyle}>
          <MenuPerfilIcone tipo="bloquear" />
        </span>
        <strong style={menuItemTextStyle}>
          {blockActionLabel}
        </strong>
        <span style={menuChevronStyle}>›</span>
      </button>

      <div style={menuDividerStyle} />
      <span style={menuSectionTitleStyle}>Descoberta</span>

      <Link
        href="/explorar"
        style={menuItemStyle}
        onClick={onClose}
      >
        <span style={menuItemIconStyle}><MenuPerfilIcone tipo="explorar" /></span>
        <strong style={menuItemTextStyle}>
          Explorar outras obras
        </strong>
        <span style={menuChevronStyle}>›</span>
      </Link>
    </>
  );
}
