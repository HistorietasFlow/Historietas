import Link from "next/link";
import { MenuPerfilIcone } from "./profile-icons";
import {
  menuChevronStyle,
  menuDangerItemStyle,
  menuItemIconStyle,
  menuItemStyle,
  menuItemTextStyle,
  menuNotificationBadgeStyle,
  menuNotificationLabelStyle,
  menuNotificationRightStyle,
  menuSectionTitleStyle,
} from "../styles";

type ProfileOwnMenuContentProps = {
  ariaLabelNotificationBadge: string;
  ariaLabelNotifications: string;
  hasUnreadNotifications: boolean;
  notificationsUnreadFormatted: string;
  onClose: () => void;
  onCopyLink: () => void;
  onSignOut: () => void;
};

export function ProfileOwnMenuContent({
  ariaLabelNotificationBadge,
  ariaLabelNotifications,
  hasUnreadNotifications,
  notificationsUnreadFormatted,
  onClose,
  onCopyLink,
  onSignOut,
}: ProfileOwnMenuContentProps) {
  return (
    <>
      <span style={menuSectionTitleStyle}>Conta e sistema</span>

      <Link
        href="/painel-autor"
        style={menuItemStyle}
        onClick={onClose}
      >
        <span style={menuItemIconStyle}>
          <MenuPerfilIcone tipo="painel" />
        </span>
        <strong style={menuItemTextStyle}>Painel do Autor</strong>
        <span style={menuChevronStyle}>›</span>
      </Link>

      <Link
        href="/notificacoes"
        style={menuItemStyle}
        onClick={onClose}
        aria-label={ariaLabelNotifications}
      >
        <span style={menuItemIconStyle}>
          <MenuPerfilIcone tipo="notificacoes" />
        </span>
        <span style={menuNotificationLabelStyle}>
          <strong style={menuItemTextStyle}>Notificações</strong>

          {hasUnreadNotifications ? (
            <span
              style={menuNotificationBadgeStyle}
              aria-label={ariaLabelNotificationBadge}
            >
              {notificationsUnreadFormatted}
            </span>
          ) : null}
        </span>

        <span style={menuNotificationRightStyle}>
          <span style={menuChevronStyle}>›</span>
        </span>
      </Link>

      <Link
        href="/configuracoes"
        style={menuItemStyle}
        onClick={onClose}
      >
        <span style={menuItemIconStyle}>
          <MenuPerfilIcone tipo="configuracoes" />
        </span>
        <strong style={menuItemTextStyle}>
          Configurações e atividade
        </strong>
        <span style={menuChevronStyle}>›</span>
      </Link>

      <button
        type="button"
        onClick={onCopyLink}
        style={menuItemStyle}
      >
        <span style={menuItemIconStyle}>
          <MenuPerfilIcone tipo="link" />
        </span>
        <strong style={menuItemTextStyle}>
          Copiar link do perfil
        </strong>
        <span style={menuChevronStyle}>›</span>
      </button>

      <button
        type="button"
        onClick={onSignOut}
        style={menuDangerItemStyle}
      >
        <span style={menuItemIconStyle}>
          <MenuPerfilIcone tipo="sair" />
        </span>
        <strong style={menuItemTextStyle}>Sair da conta</strong>
        <span style={menuChevronStyle}>›</span>
      </button>
    </>
  );
}
