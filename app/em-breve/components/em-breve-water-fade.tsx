import {
  desktopTopWaterFadeStyle,
  mobileTopWaterFadeStyle,
} from "../lib/em-breve-styles";

export function EmBreveWaterFade({
  desktopLayout,
}: {
  desktopLayout: boolean;
}) {
  return (
    <>
      {desktopLayout && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!desktopLayout && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
    </>
  );
}
