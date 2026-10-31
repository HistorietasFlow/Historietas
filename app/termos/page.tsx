"use client";

import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { TermosDocumentosSection } from "./components/TermosDocumentosSection";
import { TermosHeaderHero } from "./components/TermosHeaderHero";
import { TermosSupportingSections } from "./components/TermosSupportingSections";
import { traduzirTexto, type TextoTraduzido } from "./lib/termos-content";
import {
  containerStyle,
  pageStyle,
  termosPageCss,
} from "./styles/termos-page-styles";

export default function TermosPage() {
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  function t(texto: TextoTraduzido) {
    return traduzirTexto(texto, language);
  }

  return (
    <main
      style={pageThemeStyle}
      data-historietas-termos-root="true"
    >
      <style>{`${historietasThemeCss}${termosPageCss}`}</style>

      <div style={containerStyle}>
        <TermosHeaderHero t={t} />
        <TermosDocumentosSection t={t} />
        <TermosSupportingSections t={t} />
      </div>
    </main>
  );
}
