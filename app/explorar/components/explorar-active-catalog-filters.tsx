import { filtroStatusEditorial, textosStatusEditorial } from "../../../lib/statusEditorial";
import { useRef } from "react";
import { INTERVALO_PALAVRAS_VAZIO, validarIntervaloPalavras, type IntervaloPalavrasTexto } from "../../../lib/catalogo-palavras";
import { descreverIntervaloPalavras, textosFiltroPalavras } from "../lib/explorar-word-filter-text";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { normalizarTagCatalogo } from "../../../lib/catalogo-tag";
import { normalizarGeneroExcluido } from "../../../lib/catalogo-genero";
import { normalizarNotaMinimaCatalogo } from "../../../lib/catalogo-nota-minima";
import { normalizarFormatoExplorar } from "../lib/explorar-page-route-utils";
import { categorias } from "../lib/explorar-categories";
import { explorarModalClearButtonStyle } from "../lib/explorar-layout-styles";
import { traduzirFormatoExplorar, traduzirGeneroExplorar, traduzirTextoExplorar } from "../lib/explorar-translations";
import type { ModoConteudoExplorar } from "./explorar-section-components";

type ExplorarActiveCatalogFiltersProps = {
  language: HistorietasLanguage;
  modoConteudo: ModoConteudoExplorar;
  filtroFormato: string;
  filtroTag: string;
  tagExcluida: string;
  generoExcluido: string;
  statusEditorial?: string;
  onSelecionarStatusEditorial?: (valor: string) => void;
  notaMinima: number | null;
  intervaloPalavras?: IntervaloPalavrasTexto;
  onAplicarPalavras?: (intervalo: IntervaloPalavrasTexto) => void;
  onSelecionarFormato: (valor: string) => void;
  onSelecionarTag: (valor: string) => void;
  onSelecionarTagExcluida: (valor: string) => void;
  onSelecionarGeneroExcluido: (valor: string) => void;
  onSelecionarNotaMinima: (valor: string) => void;
  onFocarFiltros: () => void;
};

export function ExplorarActiveCatalogFilters({
  language, modoConteudo, filtroFormato, filtroTag, tagExcluida, generoExcluido, notaMinima,
  onSelecionarFormato, onSelecionarTag, onSelecionarTagExcluida, onSelecionarGeneroExcluido,
  onSelecionarNotaMinima, onFocarFiltros, statusEditorial, onSelecionarStatusEditorial,
  intervaloPalavras = INTERVALO_PALAVRAS_VAZIO, onAplicarPalavras,
}: ExplorarActiveCatalogFiltersProps) {
  const grupoRef = useRef<HTMLDivElement>(null);
  const formato = normalizarFormatoExplorar(filtroFormato);
  const tag = normalizarTagCatalogo(filtroTag);
  const exclusaoTag = modoConteudo === "obras" ? normalizarTagCatalogo(tagExcluida) : "";
  const exclusaoGenero = modoConteudo === "obras" ? normalizarGeneroExcluido(generoExcluido) : "";
  const nota = modoConteudo === "obras" ? normalizarNotaMinimaCatalogo(notaMinima) : null;
  const filtros: { id: string; rotulo: string; valor: string; remover: () => void }[] = [];
  if (formato !== "todos") filtros.push({ id: "formato", rotulo: "Formato", valor: traduzirFormatoExplorar(formato, language), remover: () => onSelecionarFormato("todos") });
  if (tag) filtros.push({ id: "tag", rotulo: "Tag", valor: tag, remover: () => onSelecionarTag("") });
  if (exclusaoTag) filtros.push({ id: "tag-excluida", rotulo: "Excluir tag", valor: exclusaoTag, remover: () => onSelecionarTagExcluida("") });
  if (exclusaoGenero) filtros.push({ id: "genero-excluido", rotulo: "Excluir gênero", valor: traduzirGeneroExplorar(categorias.find(genero => normalizarGeneroExcluido(genero) === exclusaoGenero) || exclusaoGenero, language), remover: () => onSelecionarGeneroExcluido("") });
  if (nota !== null) filtros.push({ id: "nota-minima", rotulo: "Avaliação mínima", valor: String(nota), remover: () => onSelecionarNotaMinima("") });

  const editorial = modoConteudo === "obras" ? filtroStatusEditorial(statusEditorial) : "";
  if (editorial && onSelecionarStatusEditorial) filtros.push({ id: "status-editorial", rotulo: textosStatusEditorial(language).label, valor: textosStatusEditorial(language)[editorial], remover: () => onSelecionarStatusEditorial("") });
  const intervalo = validarIntervaloPalavras(intervaloPalavras);
  if (modoConteudo === "obras" && intervalo.valido && onAplicarPalavras &&
      (intervalo.palavrasMinimas !== null || intervalo.palavrasMaximas !== null)) {
    filtros.push({ id: "palavras", rotulo: textosFiltroPalavras(language).palavras,
      valor: descreverIntervaloPalavras(intervalo.palavrasMinimas, intervalo.palavrasMaximas, language),
      remover: () => onAplicarPalavras(INTERVALO_PALAVRAS_VAZIO) });
  }

  if (filtros.length === 0) return null;

  return (
    <div ref={grupoRef} role="group" aria-label={traduzirTextoExplorar("Filtros selecionados", language)} style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "16px 0", minWidth: 0 }}>
      <style>{`.historietas-explorar-filter-chip:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }`}</style>
      {filtros.map(filtro => {
        const texto = `${traduzirTextoExplorar(filtro.rotulo, language)}: ${filtro.valor}`;
        return (
          <button
            key={filtro.id}
            type="button"
            className="historietas-explorar-filter-chip"
            aria-label={`${traduzirTextoExplorar("Remover filtro", language)}: ${texto}`}
            style={{ ...explorarModalClearButtonStyle, width: "auto", maxWidth: "100%", minWidth: 0, marginTop: 0, minHeight: 44, padding: "8px 12px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 8, textAlign: "left" }}
            onClick={event => {
              const botoes = Array.from(grupoRef.current?.querySelectorAll("button") || []);
              const indice = botoes.indexOf(event.currentTarget);
              const proximo = botoes[indice + 1] || botoes[indice - 1];
              if (proximo) proximo.focus({ preventScroll: true });
              else onFocarFiltros();
              filtro.remover();
            }}
          >
            <span style={{ overflowWrap: "anywhere", minWidth: 0 }}>{texto}</span>
            <span aria-hidden="true">×</span>
          </button>
        );
      })}
    </div>
  );
}
