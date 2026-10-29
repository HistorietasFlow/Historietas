import type { HistorietasLanguage } from "../../../lib/i18n";
import type { ModoConteudoExplorar } from "./explorar-section-components";
import { categorias } from "../lib/explorar-categories";
import { criarActiveCategoryStyle, categoriesStyle, categoryStyle, desktopCategoriesStyle } from "../lib/explorar-layout-styles";
import { traduzirGeneroExplorar, traduzirTextoExplorar } from "../lib/explorar-translations";
type ExplorarCategoriesBarProps = { isDesktop: boolean; modoConteudo: ModoConteudoExplorar; categoriaSelecionada: string; language: HistorietasLanguage; onSelecionarModo: (modo: ModoConteudoExplorar) => void; onSelecionarCategoria: (categoria: string) => void };
export function ExplorarCategoriesBar({ isDesktop, modoConteudo, categoriaSelecionada, language, onSelecionarModo, onSelecionarCategoria }: ExplorarCategoriesBarProps) {
  return <section className="explorar-carousel" style={isDesktop ? desktopCategoriesStyle : categoriesStyle} aria-label={traduzirTextoExplorar("Categorias", language)}><button type="button" onClick={() => onSelecionarModo("obras")} style={modoConteudo === "obras" && !categoriaSelecionada ? criarActiveCategoryStyle() : categoryStyle}>{traduzirTextoExplorar("Tudo", language)}</button><button type="button" onClick={() => onSelecionarModo("autores")} style={modoConteudo === "autores" && !categoriaSelecionada ? criarActiveCategoryStyle() : categoryStyle}>{traduzirTextoExplorar("Autores", language)}</button>{categorias.map((categoria) => <button key={categoria} type="button" onClick={() => onSelecionarCategoria(categoria)} style={categoriaSelecionada === categoria ? criarActiveCategoryStyle() : categoryStyle}>{traduzirGeneroExplorar(categoria, language)}</button>)}</section>;
}
