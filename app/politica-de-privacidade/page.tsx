"use client";

import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { PoliticaPrivacidadeDocumentContent } from "./components/PoliticaPrivacidadeDocumentContent";
import { PoliticaPrivacidadeFooter } from "./components/PoliticaPrivacidadeFooter";
import { PoliticaPrivacidadeOverview } from "./components/PoliticaPrivacidadeOverview";
import {
  traduzirTexto,
  type TextoTraduzido,
} from "./lib/politica-de-privacidade-content";
import {
  containerStyle,
  pageStyle,
  politicaPrivacidadeCss,
} from "./styles/politica-de-privacidade-styles";

export default function PoliticaDePrivacidadePage() {
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  function t(texto: TextoTraduzido) {
    return traduzirTexto(texto, language);
  }

  return (
    <main
      style={pageThemeStyle}
      data-historietas-privacidade-root="true"
    >
      <style>{`${historietasThemeCss}${politicaPrivacidadeCss}`}</style>

      <div style={containerStyle}>
        <PoliticaPrivacidadeOverview t={t} />
        <PoliticaPrivacidadeDocumentContent t={t} />
        <PoliticaPrivacidadeFooter t={t} />
      </div>
    </main>
  );
}
