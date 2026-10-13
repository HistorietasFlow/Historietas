import {
  menuCloseButtonStyle,
  menuHeaderStyle,
  menuSubtitleStyle,
  menuTitleBlockStyle,
  menuTitleStyle,
} from "../styles";

type ProfileEditorHeaderProps = {
  disabled: boolean;
  onClose: () => void;
};

export function ProfileEditorHeader({
  disabled,
  onClose,
}: ProfileEditorHeaderProps) {
  return (
    <div style={menuHeaderStyle}>
      <div style={menuTitleBlockStyle}>
        <strong style={menuTitleStyle}>Editar perfil</strong>
        <span style={menuSubtitleStyle}>
          Atualize suas informações públicas
        </span>
      </div>

      <button
        type="button"
        onClick={onClose}
        disabled={disabled}
        style={menuCloseButtonStyle}
        aria-label="Fechar edição do perfil"
      >
        ×
      </button>
    </div>
  );
}
