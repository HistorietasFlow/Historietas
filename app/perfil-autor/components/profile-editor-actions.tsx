import {
  profileEditorCancelButtonStyle,
  profileEditorSaveButtonStyle,
  profileEditorSheetActionsStyle,
} from "../styles";

type ProfileEditorActionsProps = {
  disabled: boolean;
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
};

export function ProfileEditorActions({
  disabled,
  onCancel,
  onSave,
  saveLabel,
}: ProfileEditorActionsProps) {
  return (
    <div style={profileEditorSheetActionsStyle}>
      <button
        type="button"
        onClick={onCancel}
        disabled={disabled}
        style={profileEditorCancelButtonStyle}
      >
        Cancelar
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={disabled}
        style={profileEditorSaveButtonStyle}
      >
        {saveLabel}
      </button>
    </div>
  );
}
