import type {
  HistorietasLanguage,
} from "../../../lib/i18n";

import {
  SvgIcon,
} from "./ajuda-svg-icon";
import {
  CATEGORIAS_AJUDA,
  type CategoriaAjudaId,
} from "../lib/ajuda-content";
import {
  traduzirTexto,
} from "../lib/ajuda-display-utils";
import {
  categoriesGridStyle,
  sectionHeadingStyle,
  sectionKickerStyle,
  sectionStyle,
  sectionTitleStyle,
} from "../lib/ajuda-layout-styles";

type AjudaCategoriesSectionProps = {
  categoriaAtiva: CategoriaAjudaId;
  language: HistorietasLanguage;
  onSelecionarCategoria: (
    categoria: CategoriaAjudaId,
  ) => void;
};

export function AjudaCategoriesSection({
  categoriaAtiva,
  language,
  onSelecionarCategoria,
}: AjudaCategoriesSectionProps) {
  function t(texto: {
    pt: string;
    en: string;
    es: string;
  }) {
    return traduzirTexto(texto, language);
  }

  return (
    <section style={sectionStyle} aria-labelledby="categorias-ajuda-titulo">
      <div style={sectionHeadingStyle}>
        <div>
          <span style={sectionKickerStyle}>
            {t({
              pt: "ASSUNTOS",
              en: "TOPICS",
              es: "TEMAS",
            })}
          </span>
          <h2 id="categorias-ajuda-titulo" style={sectionTitleStyle}>
            {t({
              pt: "Escolha uma categoria",
              en: "Choose a category",
              es: "Elige una categoría",
            })}
          </h2>
        </div>
      </div>

      <div style={categoriesGridStyle}>
        {CATEGORIAS_AJUDA.map((categoria) => {
          const ativa = categoria.id === categoriaAtiva;

          return (
            <button
              key={categoria.id}
              type="button"
              className="ajuda-category-button"
              data-active={ativa ? "true" : "false"}
              aria-pressed={ativa}
              onClick={() =>
                onSelecionarCategoria(categoria.id)
              }
            >
              <span className="ajuda-category-icon">
                <SvgIcon name={categoria.icon} size={23} strokeWidth={2.05} />
              </span>
              <span className="ajuda-category-copy">
                <strong>{t(categoria.titulo)}</strong>
                <span>{t(categoria.descricao)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
