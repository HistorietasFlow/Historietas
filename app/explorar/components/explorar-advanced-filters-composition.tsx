import { categorias } from "../lib/explorar-categories";
import { normalizarGeneroExcluido } from "../../../lib/catalogo-genero";
import type { HistorietasLanguage } from "../../../lib/i18n";
import type {
  FiltroColecaoExplorar,
  OrdenacaoExplorar,
} from "../lib/explorar-derived-utils";
import { explorarModalSectionLabelStyle } from "../lib/explorar-layout-styles";
import { traduzirGeneroExplorar, traduzirTextoExplorar } from "../lib/explorar-translations";
import { ExplorarAdultContentFilter } from "./explorar-adult-content-filter";
import { ExplorarAdvancedFiltersShell } from "./explorar-advanced-filters-shell";
import { ExplorarClearFiltersAction } from "./explorar-clear-filters-action";
import { ExplorarCollectionFilterOptions } from "./explorar-collection-filter-options";
import { ExplorarOrderingOptions } from "./explorar-ordering-options";
import { ExplorarFormatFilterOptions } from "./explorar-format-filter-options";
import type { ModoConteudoExplorar } from "./explorar-section-components";

type ExplorarAdvancedFiltersCompositionProps = {
  isDesktop: boolean;
  language: HistorietasLanguage;
  modoConteudo: ModoConteudoExplorar;
  filtroColecao: FiltroColecaoExplorar;
  filtroFormato: string;
  filtroTag: string;
  tagExcluida: string;
  generoExcluido: string;
  notaMinima: number | null;
  filtroClassificacao: string;
  mostrarConfirmacaoConteudo18: boolean;
  confirmouIdadeConteudo18: boolean;
  acessoConteudo18TemporariamenteBloqueado: boolean;
  ordenacao: OrdenacaoExplorar;
  filtrosAtivos: boolean;
  onFechar: () => void;
  onSelecionarColecao: (filtro: FiltroColecaoExplorar) => void;
  onSelecionarFormato: (formato: string) => void;
  onSelecionarTag: (tag: string) => void;
  onSelecionarGeneroExcluido: (genero: string) => void;
  onSelecionarTagExcluida: (tag: string) => void;
  onSelecionarNotaMinima: (valor: string) => void;
  onSelecionarClassificacao: (filtro: string) => void;
  onConfirmouIdadeChange: (confirmou: boolean) => void;
  onVoltarConteudo18: () => void;
  onConfirmarConteudo18: () => void;
  onSelecionarOrdenacao: (ordenacao: OrdenacaoExplorar) => void;
  onLimparFiltros: () => void;
};

export default function ExplorarAdvancedFiltersComposition({
  isDesktop,
  language,
  modoConteudo,
  filtroColecao,
  filtroFormato,
  filtroTag,
  tagExcluida,
  generoExcluido,
  notaMinima,
  filtroClassificacao,
  mostrarConfirmacaoConteudo18,
  confirmouIdadeConteudo18,
  acessoConteudo18TemporariamenteBloqueado,
  ordenacao,
  filtrosAtivos,
  onFechar,
  onSelecionarColecao,
  onSelecionarFormato,
  onSelecionarTag,
  onSelecionarTagExcluida,
  onSelecionarGeneroExcluido,
  onSelecionarNotaMinima,
  onSelecionarClassificacao,
  onConfirmouIdadeChange,
  onVoltarConteudo18,
  onConfirmarConteudo18,
  onSelecionarOrdenacao,
  onLimparFiltros,
}: ExplorarAdvancedFiltersCompositionProps) {
  return (
    <ExplorarAdvancedFiltersShell
      isDesktop={isDesktop}
      language={language}
      onFechar={onFechar}
    >
      <p style={explorarModalSectionLabelStyle}>
        {traduzirTextoExplorar("Mostrar", language)}
      </p>

      <ExplorarCollectionFilterOptions
        filtroColecao={filtroColecao}
        language={language}
        onSelecionar={onSelecionarColecao}
      />

      {modoConteudo === "obras" && (
        <ExplorarAdultContentFilter
          filtroClassificacao={filtroClassificacao}
          mostrarConfirmacao={mostrarConfirmacaoConteudo18}
          confirmouIdade={confirmouIdadeConteudo18}
          acessoTemporariamenteBloqueado={
            acessoConteudo18TemporariamenteBloqueado
          }
          language={language}
          onSelecionarClassificacao={onSelecionarClassificacao}
          onConfirmouIdadeChange={onConfirmouIdadeChange}
          onVoltar={onVoltarConteudo18}
          onConfirmar={onConfirmarConteudo18}
        />
      )}

      {!mostrarConfirmacaoConteudo18 && (
        <>
          <ExplorarFormatFilterOptions
            filtroFormato={filtroFormato}
            language={language}
            onSelecionar={onSelecionarFormato}
          />
          <label style={explorarModalSectionLabelStyle}>
            {traduzirTextoExplorar("Tag da obra", language)}
            <input
              type="text"
              value={filtroTag}
              maxLength={90}
              onChange={(event) => onSelecionarTag(event.target.value)}
              aria-describedby="explorar-tag-ajuda"
              style={{ display: "block", width: "100%", boxSizing: "border-box", padding: 10 }}
            />
          </label>
          <p id="explorar-tag-ajuda">
            {traduzirTextoExplorar("Informe uma tag completa. Deixe vazio para todas.", language)}
          </p>

          {modoConteudo === "obras" && (
            <>
              <label style={explorarModalSectionLabelStyle}>
                {traduzirTextoExplorar("Excluir tag", language)}
                <input
                  type="text"
                  value={tagExcluida}
                  maxLength={90}
                  onChange={(event) => onSelecionarTagExcluida(event.target.value)}
                  aria-describedby="explorar-tag-excluida-ajuda"
                  style={{ display: "block", width: "100%", boxSizing: "border-box", padding: 10 }}
                />
              </label>
              <p id="explorar-tag-excluida-ajuda">
                {traduzirTextoExplorar("Oculta obras com esta tag completa. Deixe vazio para não excluir.", language)}
              </p>
            </>
          )}

          {modoConteudo === "obras" && (
            <label style={explorarModalSectionLabelStyle}>
              <span id="explorar-genero-excluido-titulo">{traduzirTextoExplorar("Excluir gênero", language)}</span>
              <select
                value={generoExcluido}
                onChange={(event) => onSelecionarGeneroExcluido(event.target.value)}
                aria-labelledby="explorar-genero-excluido-titulo"
                aria-describedby="explorar-genero-excluido-ajuda"
                style={{ display: "block", width: "100%", padding: 10, fontSize: 16 }}
              >
                <option value="">{traduzirTextoExplorar("Nenhum", language)}</option>
                {categorias.map((genero) => (
                  <option key={genero} value={normalizarGeneroExcluido(genero)}>
                    {traduzirGeneroExplorar(genero, language)}
                  </option>
                ))}
              </select>
              <span id="explorar-genero-excluido-ajuda">
                {traduzirTextoExplorar("Oculta obras que contenham este gênero, inclusive gêneros compostos.", language)}
              </span>
            </label>
          )}

          {modoConteudo === "obras" && (
            <label style={explorarModalSectionLabelStyle}>
              {traduzirTextoExplorar("Avaliação mínima", language)}
              <select
                value={notaMinima ?? ""}
                onChange={(event) => onSelecionarNotaMinima(event.target.value)}
                style={{ display: "block", width: "100%", padding: 10, fontSize: 16 }}
              >
                <option value="">{traduzirTextoExplorar("Qualquer avaliação", language)}</option>
                {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((nota) => (
                  <option key={nota} value={nota}>
                    {nota.toLocaleString(language === "pt-BR" ? "pt-BR" : language)} ★+
                  </option>
                ))}
              </select>
            </label>
          )}

          <p style={explorarModalSectionLabelStyle}>
            {traduzirTextoExplorar("Ordenar", language)}
          </p>

          <ExplorarOrderingOptions
            ordenacao={ordenacao}
            modoConteudo={modoConteudo}
            language={language}
            onSelecionar={onSelecionarOrdenacao}
          />
        </>
      )}

      {!mostrarConfirmacaoConteudo18 && filtrosAtivos && (
        <ExplorarClearFiltersAction
          language={language}
          onLimpar={onLimparFiltros}
        />
      )}
    </ExplorarAdvancedFiltersShell>
  );
}
