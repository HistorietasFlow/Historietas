import type { CSSProperties } from "react";
import {
  profileHeaderLogoStyle,
  profileMenuButtonStyle,
  profileMenuIconLineStyle,
  profileMenuIconStyle,
} from "../styles";
import { ProfileHeaderUsername } from "./profile-header-username";

type ProfileHeaderProps = {
  ariaLabelCopyUsername: string;
  ariaLabelToggleUsername: string;
  headerStyle: CSSProperties;
  menuOpen: boolean;
  onCopyUsername: () => void;
  onOpenMenu: () => void;
  onToggleUsername: () => void;
  username: string;
  usernameVisible: boolean;
};

export function ProfileHeader({
  ariaLabelCopyUsername,
  ariaLabelToggleUsername,
  headerStyle,
  menuOpen,
  onCopyUsername,
  onOpenMenu,
  onToggleUsername,
  username,
  usernameVisible,
}: ProfileHeaderProps) {
  return (
    <header style={headerStyle}>
      <div style={profileHeaderLogoStyle}>
        <ProfileHeaderUsername
          ariaLabelCopy={ariaLabelCopyUsername}
          ariaLabelToggle={ariaLabelToggleUsername}
          onCopy={onCopyUsername}
          onToggle={onToggleUsername}
          username={username}
          visible={usernameVisible}
        />
      </div>

      <button
        type="button"
        onClick={onOpenMenu}
        style={profileMenuButtonStyle}
        aria-label="Abrir menu do perfil"
        aria-expanded={menuOpen}
      >
        <span style={profileMenuIconStyle} aria-hidden="true">
          <span style={profileMenuIconLineStyle} />
          <span style={profileMenuIconLineStyle} />
          <span style={profileMenuIconLineStyle} />
        </span>
      </button>
    </header>
  );
}
