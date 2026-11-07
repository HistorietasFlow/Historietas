import type { HistorietasLanguage } from "../../../lib/i18n";
import type {
  FiltroColecaoExplorar,
  OrdenacaoExplorar,
} from "../lib/explorar-derived-utils";
import { explorarModalSectionLabelStyle } from "../lib/explorar-layout-styles";
import { traduzirTextoExplorar } from "../lib/explorar-translations";
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
