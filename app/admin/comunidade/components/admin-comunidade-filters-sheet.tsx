import {
  STATUS_DENUNCIAS,
  STATUS_LABEL,
} from "../lib/admin-comunidade-status-utils";
import type { StatusFiltroDenuncia } from "../lib/admin-comunidade-filter-utils";
import {
  adminFiltersSheetOverlayStyle,
  adminFiltersSheetBackdropStyle,
  adminFiltersSheetStyle,
  adminFiltersSheetHandleStyle,
  adminFiltersSheetTitleStyle,
  adminFiltersSheetSectionLabelStyle,
  adminFiltersSheetOptionStyle,
  adminFiltersSheetOptionActiveStyle,
  adminFiltersSheetRadioStyle,
  adminFiltersSheetRadioActiveStyle,
  adminFiltersSheetClearButtonStyle,
} from "../lib/admin-comunidade-styles";

type AdminComunidadeFiltersSheetProps = {
  statusFiltro: StatusFiltroDenuncia;
  busca: string;
  onFechar: () => void;
  onSelecionarStatus: (status: StatusFiltroDenuncia) => void;
  onLimparFiltros: () => void;
};

export function AdminComunidadeFiltersSheet({
  statusFiltro,
  busca,
  onFechar,
  onSelecionarStatus,
  onLimparFiltros,
}: AdminComunidadeFiltersSheetProps) {
  return (
    <section
      style={adminFiltersSheetOverlayStyle}
      aria-label="Filtrar denúncias"
    >
      <button
        type="button"
        aria-label="Fechar filtros"
        onClick={onFechar}
        style={adminFiltersSheetBackdropStyle}
      />

      <article style={adminFiltersSheetStyle}>
        <div style={adminFiltersSheetHandleStyle} />

        <strong style={adminFiltersSheetTitleStyle}>
          Moderação
        </strong>

        <span style={adminFiltersSheetSectionLabelStyle}>Status</span>

        {(["todas", ...STATUS_DENUNCIAS, "arquivadas"] as const).map(
          (status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                onSelecionarStatus(status);
                onFechar();
              }}
              style={
                statusFiltro === status
                  ? adminFiltersSheetOptionActiveStyle
                  : adminFiltersSheetOptionStyle
              }
            >
              <span>
                {status === "todas"
                  ? "Todas"
                  : status === "arquivadas"
                    ? "Arquivadas"
                    : STATUS_LABEL[status]}
              </span>

              <span
                style={
                  statusFiltro === status
                    ? adminFiltersSheetRadioActiveStyle
                    : adminFiltersSheetRadioStyle
                }
              >
                {statusFiltro === status ? "✓" : ""}
              </span>
            </button>
          )
        )}

        {(busca || statusFiltro !== "todas") && (
          <button
            type="button"
            onClick={onLimparFiltros}
            style={adminFiltersSheetClearButtonStyle}
          >
            Limpar filtros
          </button>
        )}
      </article>
    </section>
  );
}
