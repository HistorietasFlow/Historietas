import {
  authorHighlightsLikeButtonActiveStyle,
  authorHighlightsLikeButtonStyle,
  authorHighlightsLikeCountStyle,
  authorHighlightsLikeHeartIconStyle,
} from "../styles";

type ProfileHighlightsLikeButtonProps = {
  ariaLabel: string;
  curtido: boolean;
  onClick: () => void;
  salvando: boolean;
  totalFormatado: string;
};

export function ProfileHighlightsLikeButton({
  ariaLabel,
  curtido,
  onClick,
  salvando,
  totalFormatado,
}: ProfileHighlightsLikeButtonProps) {
  return (
    <button
      type="button"
      data-historietas-top-five-like="true"
      onClick={onClick}
      disabled={salvando}
      style={{
        ...(curtido
          ? authorHighlightsLikeButtonActiveStyle
          : authorHighlightsLikeButtonStyle),
        opacity: salvando ? 0.58 : 1,
        cursor: salvando ? "not-allowed" : "pointer",
      }}
      aria-pressed={curtido}
      aria-label={ariaLabel}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{
          ...authorHighlightsLikeHeartIconStyle,
          animation: curtido
            ? "historietas-perfil-heart-pop 260ms ease-out"
            : "none",
        }}
      >
        <path
          d="M20.7 5.3c-1.8-1.9-4.7-1.9-6.5 0L12 7.6 9.8 5.3c-1.8-1.9-4.7-1.9-6.5 0-1.8 1.9-1.8 5 0 6.9L12 21l8.7-8.8c1.8-1.9 1.8-5 0-6.9Z"
          fill={curtido ? "var(--historietas-perfil-danger, #FFFFFF)" : "none"}
          stroke={
            curtido ? "var(--historietas-perfil-danger, #FFFFFF)" : "#FFFFFF"
          }
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span style={authorHighlightsLikeCountStyle}>{totalFormatado}</span>
    </button>
  );
}
