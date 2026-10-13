import type { CSSProperties } from "react";
import { ProfileActionToast } from "./profile-action-toast";
import { ProfileOwnerActions } from "./profile-owner-actions";
import { ProfileVisitorSecondaryActions } from "./profile-visitor-secondary-actions";

type ProfileHeroActionsProps = {
  actionsStyle: CSSProperties;
  podeEditar: boolean;
  mostrarDestaquesAutor: boolean;
  onEdit: () => void;
  onShare: () => void;
  onToggleOwnerHighlights: () => void;
  existeBloqueio: boolean;
  onFollow: () => void;
  followDisabled: boolean;
  followAriaLabel: string;
  followTitle: string | undefined;
  followBaseStyle: CSSProperties;
  followOpacity: number;
  followCursor: string;
  followLabel: string;
  mostrarDestaquesVisitante: boolean;
  obrasVisiveis: boolean;
  onToggleVisitorHighlights: () => void;
  message: string;
};

export function ProfileHeroActions({
  actionsStyle,
  podeEditar,
  mostrarDestaquesAutor,
  onEdit,
  onShare,
  onToggleOwnerHighlights,
  existeBloqueio,
  onFollow,
  followDisabled,
  followAriaLabel,
  followTitle,
  followBaseStyle,
  followOpacity,
  followCursor,
  followLabel,
  mostrarDestaquesVisitante,
  obrasVisiveis,
  onToggleVisitorHighlights,
  message,
}: ProfileHeroActionsProps) {
  return (
    <>
      <div style={actionsStyle}>
        {podeEditar ? (
          <ProfileOwnerActions
            mostrarDestaques={mostrarDestaquesAutor}
            onEdit={onEdit}
            onShare={onShare}
            onToggleHighlights={onToggleOwnerHighlights}
          />
        ) : (
          <>
            {!existeBloqueio && (
              <button
                type="button"
                onClick={onFollow}
                disabled={followDisabled}
                aria-label={followAriaLabel}
                title={followTitle}
                style={{
                  ...followBaseStyle,
                  opacity: followOpacity,
                  cursor: followCursor,
                }}
              >
                {followLabel}
              </button>
            )}

            <ProfileVisitorSecondaryActions
              mostrarDestaques={mostrarDestaquesVisitante}
              obrasVisiveis={obrasVisiveis}
              onShare={onShare}
              onToggleHighlights={onToggleVisitorHighlights}
            />
          </>
        )}
      </div>

      <ProfileActionToast message={message} />
    </>
  );
}
