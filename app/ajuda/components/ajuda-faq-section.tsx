import type {
  HistorietasLanguage,
} from "../../../lib/i18n";

import {
  SvgIcon,
} from "./ajuda-svg-icon";
import {
  CATEGORIAS_AJUDA,
  type CategoriaAjuda,
  type PerguntaAjuda,
} from "../lib/ajuda-content";
import {
  traduzirTexto,
} from "../lib/ajuda-display-utils";
import {
  emptyDescriptionStyle,
  emptyIconStyle,
  emptyStateStyle,
  emptyTitleStyle,
  faqListStyle,
  resultsCountStyle,
  sectionHeadingStyle,
  sectionKickerStyle,
  sectionStyle,
  sectionTitleStyle,
} from "../lib/ajuda-layout-styles";

type AjudaFaqSectionProps = {
  perguntas: PerguntaAjuda[];
  categoriaSelecionada: CategoriaAjuda;
  language: HistorietasLanguage;
  onReset: () => void;
};

export function AjudaFaqSection({
  perguntas,
  categoriaSelecionada,
  language,
  onReset,
}: AjudaFaqSectionProps) {
  function t(texto: {
    pt: string;
    en: string;
    es: string;
  }) {
    return traduzirTexto(texto, language);
  }

  return (
    <section style={sectionStyle} aria-labelledby="perguntas-ajuda-titulo">
      <div style={sectionHeadingStyle}>
        <div>
          <span style={sectionKickerStyle}>
            {t({
              pt: "PERGUNTAS FREQUENTES",
              en: "FREQUENTLY ASKED QUESTIONS",
              es: "PREGUNTAS FRECUENTES",
            })}
          </span>
          <h2 id="perguntas-ajuda-titulo" style={sectionTitleStyle}>
            {t(categoriaSelecionada.titulo)}
          </h2>
        </div>

        <span style={resultsCountStyle}>
          {perguntas.length}{" "}
          {perguntas.length === 1
            ? t({ pt: "resposta", en: "answer", es: "respuesta" })
            : t({ pt: "respostas", en: "answers", es: "respuestas" })}
        </span>
      </div>

      {perguntas.length > 0 ? (
        <div style={faqListStyle}>
          {perguntas.map((item) => {
            const categoria = CATEGORIAS_AJUDA.find(
              (entrada) => entrada.id === item.categoria,
            );

            return (
              <details key={item.id} className="ajuda-faq-details">
                <summary className="ajuda-faq-summary">
                  <span className="ajuda-faq-icon">
                    <SvgIcon
                      name={categoria?.icon || "help"}
                      size={21}
                      strokeWidth={2.1}
                    />
                  </span>

                  <span className="ajuda-faq-question">
                    {t(item.pergunta)}
                  </span>

                  <span className="ajuda-faq-chevron">
                    <SvgIcon
                      name="chevronDown"
                      size={21}
                      strokeWidth={2.35}
                    />
                  </span>
                </summary>

                <div className="ajuda-faq-answer">
                  <p>{t(item.resposta)}</p>
                </div>
              </details>
            );
          })}
        </div>
      ) : (
        <div style={emptyStateStyle}>
          <span style={emptyIconStyle}>
            <SvgIcon name="search" size={28} strokeWidth={2.15} />
          </span>
          <strong style={emptyTitleStyle}>
            {t({
              pt: "Nenhuma resposta encontrada",
              en: "No answer found",
              es: "No se encontró ninguna respuesta",
            })}
          </strong>
          <p style={emptyDescriptionStyle}>
            {t({
              pt: "Tente pesquisar com outras palavras ou escolha Todas para ver os assuntos disponíveis.",
              en: "Try different words or choose All to view the available topics.",
              es: "Prueba con otras palabras o elige Todas para ver los temas disponibles.",
            })}
          </p>
          <button
            type="button"
            className="ajuda-reset-button"
            onClick={onReset}
          >
            {t({
              pt: "Mostrar todas as respostas",
              en: "Show all answers",
              es: "Mostrar todas las respuestas",
            })}
          </button>
        </div>
      )}
    </section>
  );
}
