import {
  authorTextBlockStyle,
  descriptionStyle,
  desktopDescriptionStyle,
  profileAddBioButtonStyle,
} from "../styles";

type ProfileBioProps = {
  bioFallback: string;
  bioPersonalizada: string;
  isDesktop: boolean;
  onEdit: () => void;
  podeEditar: boolean;
};

export function ProfileBio({
  bioFallback,
  bioPersonalizada,
  isDesktop,
  onEdit,
  podeEditar,
}: ProfileBioProps) {
  const descriptionStyleAtual = isDesktop
    ? desktopDescriptionStyle
    : descriptionStyle;

  return (
    <div style={authorTextBlockStyle}>
      {bioPersonalizada ? (
        <p
          data-historietas-user-content="true"
          style={descriptionStyleAtual}
        >
          {bioPersonalizada}
        </p>
      ) : podeEditar ? (
        <button
          type="button"
          onClick={onEdit}
          style={profileAddBioButtonStyle}
        >
          + Adicionar biografia
        </button>
      ) : (
        <p style={descriptionStyleAtual}>{bioFallback}</p>
      )}
    </div>
  );
}
