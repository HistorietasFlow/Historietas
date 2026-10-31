"use client";

import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { DiretrizesComunidadeDocumentContent } from "./components/DiretrizesComunidadeDocumentContent";
import { DiretrizesComunidadeFooter } from "./components/DiretrizesComunidadeFooter";
import { DiretrizesComunidadeOverview } from "./components/DiretrizesComunidadeOverview";
import {
  traduzirTexto,
  type TextoTraduzido,
} from "./lib/diretrizes-da-comunidade-content";
import {
  containerStyle,
  diretrizesCss,
  pageStyle,
} from "./styles/diretrizes-da-comunidade-styles";

export default function DiretrizesDaComunidadePage() {
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  function t(texto: TextoTraduzido) {
    return traduzirTexto(texto, language);
  }

  return (
    <main
      style={pageThemeStyle}
      data-historietas-diretrizes-root="true"
    >
      <style>{`${historietasThemeCss}${diretrizesCss}`}</style>

      <div style={containerStyle}>
        <DiretrizesComunidadeOverview t={t} />
        <DiretrizesComunidadeDocumentContent t={t} />
        <DiretrizesComunidadeFooter t={t} />
      </div>
    </main>
  );
}
