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
import type { ModoConteudoExplorar } from "./explorar-section-components";

type ExplorarAdvancedFiltersCompositionProps = {
  isDesktop: boolean;
  language: HistorietasLanguage;
  modoConteudo: ModoConteudoExplorar;
  filtroColecao: FiltroColecaoExplorar;
  filtroClassificacao: string;
  mostrarConfirmacaoConteudo18: boolean;
  confirmouIdadeConteudo18: boolean;
  acessoConteudo18TemporariamenteBloqueado: boolean;
  ordenacao: OrdenacaoExplorar;
  filtrosAtivos: boolean;
  onFechar: () => void;
  onSelecionarColecao: (filtro: FiltroColecaoExplorar) => void;
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
  filtroClassificacao,
  mostrarConfirmacaoConteudo18,
  confirmouIdadeConteudo18,
  acessoConteudo18TemporariamenteBloqueado,
  ordenacao,
  filtrosAtivos,
  onFechar,
  onSelecionarColecao,
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
          <p style={explorarModalSectionLabelStyle}>
            {traduzirTextoExplorar("Ordenar", language)}
          </p>

          <ExplorarOrderingOptions
            ordenacao={ordenacao}
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
