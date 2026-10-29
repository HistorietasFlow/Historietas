import type { ReactNode } from "react";
import type { HistorietasLanguage } from "../../../lib/i18n";
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
  return (
    <div style={explorarModalOverlayStyle} onClick={onFechar}>
      <section
        style={
          isDesktop
            ? desktopExplorarModalSheetStyle
            : explorarModalSheetStyle
        }
        onClick={(event) => event.stopPropagation()}
        aria-label={traduzirTextoExplorar("EXPLORAR", language)}
      >
        <span style={explorarModalHandleStyle} aria-hidden="true" />

        <h2 style={explorarModalTitleStyle}>
          {traduzirTextoExplorar("EXPLORAR", language)}
        </h2>

        <div style={explorarModalContentStyle}>{children}</div>
      </section>
    </div>
  );
}
