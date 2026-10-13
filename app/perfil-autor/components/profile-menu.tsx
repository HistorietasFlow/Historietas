import type { CSSProperties } from "react";
import { ProfileOwnMenuContent } from "./profile-own-menu-content";
import { ProfileVisitorMenuContent } from "./profile-visitor-menu-content";
import {
  menuCloseButtonStyle,
  menuHeaderStyle,
  menuListStyle,
  menuOverlayStyle,
  menuSubtitleStyle,
  menuTitleBlockStyle,
  menuTitleStyle,
} from "../styles";

type ProfileMenuProps = {
  ariaLabelNotificationBadge: string;
  ariaLabelNotifications: string;
  blockActionLabel: string;
  blockActionStyle: CSSProperties;
  blockSaving: boolean;
  communityHref: string;
  hasUnreadNotifications: boolean;
  isOwner: boolean;
  notificationsUnreadFormatted: string;
  onBlock: () => void;
  onClose: () => void;
  onCopyLink: () => void;
  onReport: () => void;
  onSignOut: () => void;
  profileName: string;
  sheetStyle: CSSProperties;
};

export function ProfileMenu({
  ariaLabelNotificationBadge,
  ariaLabelNotifications,
  blockActionLabel,
  blockActionStyle,
  blockSaving,
  communityHref,
  hasUnreadNotifications,
  isOwner,
  notificationsUnreadFormatted,
  onBlock,
  onClose,
  onCopyLink,
  onReport,
  onSignOut,
  profileName,
  sheetStyle,
}: ProfileMenuProps) {
  return (
    <div
      style={menuOverlayStyle}
      role="presentation"
      onClick={onClose}
    >
      <section
        style={sheetStyle}
        role="dialog"
        aria-label="Menu do perfil"
        onClick={(event) => event.stopPropagation()}
      >
        <div style={menuHeaderStyle}>
          <div style={menuTitleBlockStyle}>
            <strong data-historietas-user-content="true" style={menuTitleStyle}>
              {profileName}
            </strong>
            {!isOwner ? (
              <span style={menuSubtitleStyle}>Ações do perfil</span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={menuCloseButtonStyle}
            aria-label="Fechar menu"
          >
            ×
          </button>
        </div>

        <div style={menuListStyle}>
          {isOwner ? (
            <ProfileOwnMenuContent
              ariaLabelNotificationBadge={ariaLabelNotificationBadge}
              ariaLabelNotifications={ariaLabelNotifications}
              hasUnreadNotifications={hasUnreadNotifications}
              notificationsUnreadFormatted={notificationsUnreadFormatted}
              onClose={onClose}
              onCopyLink={onCopyLink}
              onSignOut={onSignOut}
            />
          ) : (
            <ProfileVisitorMenuContent
              blockActionLabel={blockActionLabel}
              blockActionStyle={blockActionStyle}
              blockSaving={blockSaving}
              communityHref={communityHref}
              onBlock={onBlock}
              onClose={onClose}
              onCopyLink={onCopyLink}
              onReport={onReport}
            />
          )}
        </div>
      </section>
    </div>
  );
}
