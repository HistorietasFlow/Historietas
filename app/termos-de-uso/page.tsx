"use client";

import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { TermosDeUsoDocumentContent } from "./components/TermosDeUsoDocumentContent";
import { TermosDeUsoFooter } from "./components/TermosDeUsoFooter";
import { TermosDeUsoOverview } from "./components/TermosDeUsoOverview";
import {
  traduzirTexto,
  type TextoTraduzido,
} from "./lib/termos-de-uso-content";
import {
  containerStyle,
  pageStyle,
  termosUsoCss,
} from "./styles/termos-de-uso-styles";

export default function TermosDeUsoPage() {
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  function t(texto: TextoTraduzido) {
    return traduzirTexto(texto, language);
  }

  return (
    <main
      style={pageThemeStyle}
      data-historietas-termos-uso-root="true"
    >
      <style>{`${historietasThemeCss}${termosUsoCss}`}</style>

      <div style={containerStyle}>
        <TermosDeUsoOverview t={t} />
        <TermosDeUsoDocumentContent t={t} />
        <TermosDeUsoFooter t={t} />
      </div>
    </main>
  );
}
