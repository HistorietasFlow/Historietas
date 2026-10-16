import {
  criarDecoracaoPaginaStyle,
  desktopTopWaterFadeStyle,
  mobileTopWaterFadeStyle,
  pageDecorationLayerStyle,
} from "../lib/em-alta-ranking-visual-style-utils";

type EmAltaPageDecorationsProps = {
  isDesktop: boolean;
};

export function EmAltaPageDecorations({
  isDesktop,
}: EmAltaPageDecorationsProps) {
  return (
    <>
      <div style={pageDecorationLayerStyle} aria-hidden="true">
        {["#", "★"].map((decoracao, index) => (
          <span
            key={`${decoracao}-${index}`}
            style={criarDecoracaoPaginaStyle(index)}
          >
            {decoracao}
          </span>
        ))}
      </div>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}

      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
    </>
  );
}
