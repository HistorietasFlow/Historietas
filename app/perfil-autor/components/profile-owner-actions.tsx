import { profilePrimaryButtonStyle } from "../styles";

type ProfileOwnerActionsProps = {
  mostrarDestaques: boolean;
  onEdit: () => void;
  onShare: () => void;
  onToggleHighlights: () => void;
};

export function ProfileOwnerActions({
  mostrarDestaques,
  onEdit,
  onShare,
  onToggleHighlights,
}: ProfileOwnerActionsProps) {
  return (
    <>
      <button
        type="button"
        onClick={onEdit}
        style={profilePrimaryButtonStyle}
      >
        Editar perfil
      </button>

      <button
        type="button"
        onClick={onShare}
        style={profilePrimaryButtonStyle}
      >
        Compartilhar
      </button>

      <button
        type="button"
        onClick={onToggleHighlights}
        style={profilePrimaryButtonStyle}
      >
        {mostrarDestaques ? "Ocultar destaques" : "Mostrar destaques"}
      </button>
    </>
  );
}
