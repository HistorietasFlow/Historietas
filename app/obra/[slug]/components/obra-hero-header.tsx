import type { ReactNode } from "react";

import {
  classificationTriggerAdultStyle,
  classificationTriggerStyle,
  classificationTriggerTextLivreStyle,
  classificationTriggerTextStyle,
  desktopHeaderRightStyle,
  desktopHeroTopOverlayStyle,
  heroTopOverlayStyle,
} from "../lib/obra-style-utils";

type ObraHeroHeaderProps = {
  isDesktop: boolean;
  classificacaoIndicativa: string;
  classificacaoTexto: string;
  classificacaoLivre: boolean;
  classificacaoAdulto: boolean;
  rotuloAbrirClassificacao: string;
  resumoAvaliacao: ReactNode;
  onAbrirClassificacao: () => void;
};

export default function ObraHeroHeader({
  isDesktop,
  classificacaoIndicativa,
  classificacaoTexto,
  classificacaoLivre,
  classificacaoAdulto,
  rotuloAbrirClassificacao,
  resumoAvaliacao,
  onAbrirClassificacao,
}: ObraHeroHeaderProps) {
  return (
    <header
      style={isDesktop ? desktopHeroTopOverlayStyle : heroTopOverlayStyle}
    >
      <button
        type="button"
        onClick={onAbrirClassificacao}
        aria-label={`${rotuloAbrirClassificacao}: ${classificacaoIndicativa}`}
        title={`${rotuloAbrirClassificacao}: ${classificacaoIndicativa}`}
        style={{
          ...classificationTriggerStyle,
          ...(classificacaoAdulto
            ? classificationTriggerAdultStyle
            : {}),
        }}
      >
        <span
          data-historietas-i18n-ignore="true"
          style={
            classificacaoLivre
              ? classificationTriggerTextLivreStyle
              : classificationTriggerTextStyle
          }
        >
          {classificacaoTexto}
        </span>
      </button>

      {isDesktop ? (
        <div style={desktopHeaderRightStyle}>
          {resumoAvaliacao}
        </div>
      ) : (
        resumoAvaliacao
      )}
    </header>
  );
}
