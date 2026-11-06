import { useRef } from "react";
import type { ReactNode } from "react";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { useExplorarAdvancedFiltersDialogAccessibility } from "../hooks/use-explorar-advanced-filters-dialog-accessibility";
import {
  desktopExplorarModalSheetStyle,
  explorarModalContentStyle,
  explorarModalHandleStyle,
  explorarModalOverlayStyle,
  explorarModalSheetStyle,
  explorarModalTitleStyle,
} from "../lib/explorar-layout-styles";
import { traduzirTextoExplorar } from "../lib/explorar-translations";

type ExplorarAdvancedFiltersShellProps = {
  isDesktop: boolean;
  language: HistorietasLanguage;
  onFechar: () => void;
  children: ReactNode;
};

export function ExplorarAdvancedFiltersShell({
  isDesktop,
  language,
  onFechar,
  children,
}: ExplorarAdvancedFiltersShellProps) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const { aoPressionarTeclaDialogo } =
    useExplorarAdvancedFiltersDialogAccessibility({
      aberto: true,
      dialogRef,
      onFechar,
    });

  return (
    <div style={explorarModalOverlayStyle} onClick={onFechar}>
      <section
        ref={dialogRef}
        style={
          isDesktop
            ? desktopExplorarModalSheetStyle
            : explorarModalSheetStyle
        }
        onClick={(event) => event.stopPropagation()}
        onKeyDown={aoPressionarTeclaDialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby="explorar-filtros-avancados-titulo"
        aria-label={traduzirTextoExplorar("EXPLORAR", language)}
        tabIndex={-1}
      >
        <span style={explorarModalHandleStyle} aria-hidden="true" />

        <h2
          id="explorar-filtros-avancados-titulo"
          style={explorarModalTitleStyle}
        >
          {traduzirTextoExplorar("EXPLORAR", language)}
        </h2>

        <div style={explorarModalContentStyle}>{children}</div>
      </section>
    </div>
  );
}
