import type { CSSProperties } from "react";

import { ProfileWorkCard } from "./profile-work-card";
import { ProfileWorkCoverCommentIcon } from "./profile-work-cover-comment-icon";
import { ProfileWorkCoverLikeIcon } from "./profile-work-cover-like-icon";
import { ProfileWorkCoverLink } from "./profile-work-cover-link";
import { ProfileWorkCoverMetrics } from "./profile-work-cover-metrics";
import { ProfileWorkCoverOverlay } from "./profile-work-cover-overlay";
import { ProfileWorkCoverTitle } from "./profile-work-cover-title";
import { ProfileWorkMenuAnchor } from "./profile-work-menu-anchor";
import { ProfileWorkOptionsButton } from "./profile-work-options-button";

type ProfileWorkGridItemProps = {
  ariaLabelOpcoes: string;
  capaStyle: CSSProperties;
  href: string;
  menuAberto: boolean;
  titulo: string;
  totalComentarios: number;
  totalCurtidas: number;
  visualizacoes: string;
  onToggleMenu: () => void;
};

export function ProfileWorkGridItem({
  ariaLabelOpcoes,
  capaStyle,
  href,
  menuAberto,
  titulo,
  totalComentarios,
  totalCurtidas,
  visualizacoes,
  onToggleMenu,
}: ProfileWorkGridItemProps) {
  return (
    <ProfileWorkCard>
      <ProfileWorkCoverLink href={href}>
        <div style={capaStyle}>
          <ProfileWorkCoverOverlay>
            <ProfileWorkCoverTitle>{titulo}</ProfileWorkCoverTitle>

            <ProfileWorkCoverMetrics>
              <span>👁 {visualizacoes}</span>
              <span>
                <ProfileWorkCoverLikeIcon />{" "}
                {totalCurtidas}
              </span>
              <span>
                <ProfileWorkCoverCommentIcon />{" "}
                {totalComentarios}
              </span>
            </ProfileWorkCoverMetrics>
          </ProfileWorkCoverOverlay>
        </div>
      </ProfileWorkCoverLink>

      <ProfileWorkMenuAnchor>
        <ProfileWorkOptionsButton
          onClick={onToggleMenu}
          ariaLabel={ariaLabelOpcoes}
          expanded={menuAberto}
        />
      </ProfileWorkMenuAnchor>
    </ProfileWorkCard>
  );
}
