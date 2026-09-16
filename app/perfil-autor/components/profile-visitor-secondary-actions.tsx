import { profileSecondaryButtonStyle } from "../styles";

type ProfileVisitorSecondaryActionsProps = {
  mostrarDestaques: boolean;
  obrasVisiveis: boolean;
  onShare: () => void;
  onToggleHighlights: () => void;
};

export function ProfileVisitorSecondaryActions({
  mostrarDestaques,
  obrasVisiveis,
  onShare,
  onToggleHighlights,
}: ProfileVisitorSecondaryActionsProps) {
  return (
    <>
      <button
        type="button"
        onClick={onShare}
        style={profileSecondaryButtonStyle}
      >
        Compartilhar
      </button>

      {obrasVisiveis && (
        <button
          type="button"
          onClick={onToggleHighlights}
          style={profileSecondaryButtonStyle}
        >
          {mostrarDestaques ? "Ocultar destaque" : "Mostrar destaque"}
        </button>
      )}
    </>
  );
}
