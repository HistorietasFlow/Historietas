import { historietasThemeCss } from "../../../lib/historietasTheme";
import { publicarPageCss } from "../lib/publicar-page-css";
import {
  desktopTopWaterFadeStyle,
  mobileTopWaterFadeStyle,
  pageDecorationLayerStyle,
} from "../lib/publicar-layout-styles";
import { criarDecoracaoPaginaStyle } from "../lib/publicar-page-decoration-style";

type PublicarPageBackdropProps = {
  isDesktop: boolean;
};

export function PublicarPageBackdrop({
  isDesktop,
}: PublicarPageBackdropProps) {
  return (
    <>
      <style>{`${historietasThemeCss}${publicarPageCss}`}</style>

      <div style={pageDecorationLayerStyle} aria-hidden="true">
        {["✦", "◇", "+"].map((decoracao, index) => (
          <span key={`${decoracao}-${index}`} style={criarDecoracaoPaginaStyle()}>
            {decoracao}
          </span>
        ))}
      </div>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
    </>
  );
}
