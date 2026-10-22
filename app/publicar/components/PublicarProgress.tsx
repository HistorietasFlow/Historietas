import {
  desktopProgressBoxStyle,
  progressBoxStyle,
  progressFillStyle,
  progressLabelStyle,
  progressNumberStyle,
  progressTopStyle,
  progressTrackStyle,
} from "../lib/publicar-layout-styles";

type PublicarProgressProps = {
  isDesktop: boolean;
  progresso: number;
  rotulo: string;
};

export function PublicarProgress({
  isDesktop,
  progresso,
  rotulo,
}: PublicarProgressProps) {
  return (
    <div
      style={
        isDesktop
          ? { ...desktopProgressBoxStyle, width: "100%" }
          : { ...progressBoxStyle, width: "100%" }
      }
    >
      <div style={progressTopStyle}>
        <span style={progressLabelStyle}>{rotulo}</span>
        <strong style={progressNumberStyle}>{progresso}%</strong>
      </div>

      <div style={progressTrackStyle}>
        <div style={{ ...progressFillStyle, width: `${progresso}%` }} />
      </div>
    </div>
  );
}
