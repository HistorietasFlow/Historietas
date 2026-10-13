import {
  bioCounterStyle,
  profileEditorSheetFieldStyle,
  profileEditorSheetInputStyle,
  profileEditorSheetLabelStyle,
  profileEditorSheetTextareaStyle,
} from "../styles";

type ProfileEditorFieldsProps = {
  bio: string;
  bioPlaceholder: string;
  disabled: boolean;
  maxBioLength: number;
  name: string;
  onBioChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSave: () => void;
  onUsernameChange: (value: string) => void;
  remainingBioCharacters: number;
  username: string;
};

export function ProfileEditorFields({
  bio,
  bioPlaceholder,
  disabled,
  maxBioLength,
  name,
  onBioChange,
  onNameChange,
  onSave,
  onUsernameChange,
  remainingBioCharacters,
  username,
}: ProfileEditorFieldsProps) {
  return (
    <>
      <label style={profileEditorSheetFieldStyle}>
        <span style={profileEditorSheetLabelStyle}>Nome de usuário</span>

        <input
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSave();
            }
          }}
          placeholder="Digite seu nome"
          maxLength={80}
          disabled={disabled}
          style={profileEditorSheetInputStyle}
          type="text"
        />
      </label>

      <label style={profileEditorSheetFieldStyle}>
        <span style={profileEditorSheetLabelStyle}>@username público</span>

        <input
          value={username}
          onChange={(event) => onUsernameChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSave();
            }
          }}
          placeholder="Digite seu username"
          maxLength={30}
          disabled={disabled}
          style={profileEditorSheetInputStyle}
          type="text"
        />
      </label>

      <label style={profileEditorSheetFieldStyle}>
        <span style={profileEditorSheetLabelStyle}>Biografia</span>

        <textarea
          value={bio}
          onChange={(event) => onBioChange(event.target.value)}
          placeholder={bioPlaceholder}
          maxLength={maxBioLength}
          disabled={disabled}
          style={profileEditorSheetTextareaStyle}
        />
      </label>

      <span style={bioCounterStyle}>
        {remainingBioCharacters} caracteres
      </span>
    </>
  );
}
