import {
  logoMarkButtonStyle,
  logoMarkStyle,
  logoTextButtonStyle,
  logoTextStyle,
} from "../styles";

type ProfileHeaderUsernameProps = {
  ariaLabelCopy: string;
  ariaLabelToggle: string;
  onCopy: () => void;
  onToggle: () => void;
  username: string;
  visible: boolean;
};

export function ProfileHeaderUsername({
  ariaLabelCopy,
  ariaLabelToggle,
  onCopy,
  onToggle,
  username,
  visible,
}: ProfileHeaderUsernameProps) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        style={logoMarkButtonStyle}
        aria-label={ariaLabelToggle}
        aria-expanded={visible}
      >
        <span style={logoMarkStyle} aria-hidden="true">
          @
        </span>
      </button>

      {visible ? (
        <button
          type="button"
          onClick={onCopy}
          style={logoTextButtonStyle}
          aria-label={ariaLabelCopy}
          title="Copiar username"
        >
          <span
            data-historietas-user-content="true"
            data-historietas-i18n-ignore="true"
            style={logoTextStyle}
          >
            {username}
          </span>
        </button>
      ) : null}
    </>
  );
}
