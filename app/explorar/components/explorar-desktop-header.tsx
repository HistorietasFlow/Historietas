import type { HistorietasLanguage } from "../../../lib/i18n";
import type { ModoConteudoExplorar } from "./explorar-section-components";
import {
  desktopExplorarHeaderActionsStyle,
  desktopExplorarHeaderFilterButtonStyle,
  desktopExplorarHeaderSearchIconStyle,
  desktopExplorarHeaderSearchInputStyle,
  desktopExplorarHeaderSearchShellStyle,
  desktopExplorarHeaderTitleStyle,
  desktopTitleHeaderStyle,
} from "../lib/explorar-layout-styles";
import { traduzirTextoExplorar } from "../lib/explorar-translations";

type ExplorarDesktopHeaderProps = {
  busca: string;
  modoConteudo: ModoConteudoExplorar;
  language: HistorietasLanguage;
  onBuscaChange: (valor: string) => void;
  onAbrirFiltros: () => void;
};

export function ExplorarDesktopHeader({
  busca,
  modoConteudo,
  language,
  onBuscaChange,
  onAbrirFiltros,
}: ExplorarDesktopHeaderProps) {
  return (
    <header style={desktopTitleHeaderStyle}>
      <h1 style={desktopExplorarHeaderTitleStyle}>
        {traduzirTextoExplorar("Explorar", language)}
      </h1>

      <div style={desktopExplorarHeaderActionsStyle}>
        <label style={desktopExplorarHeaderSearchShellStyle}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            style={desktopExplorarHeaderSearchIconStyle}
          >
            <circle
              cx="10.85"
              cy="10.85"
              r="6.65"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M16.05 16.05L20.25 20.25"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          <input
            value={busca}
            onChange={(event) => onBuscaChange(event.target.value)}
            aria-label={traduzirTextoExplorar(
              modoConteudo === "autores"
                ? "Buscar autores..."
                : "Buscar histórias...",
              language,
            )}
            placeholder={traduzirTextoExplorar(
              modoConteudo === "autores"
                ? "Buscar autores..."
                : "Buscar histórias...",
              language,
            )}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={90}
            style={desktopExplorarHeaderSearchInputStyle}
            type="text"
          />
        </label>

        <button
          type="button"
          onClick={onAbrirFiltros}
          style={desktopExplorarHeaderFilterButtonStyle}
          aria-label={traduzirTextoExplorar(
            "Abrir funções do Explorar",
            language,
          )}
        >
          <span>{traduzirTextoExplorar("Filtros", language)}</span>
          <span aria-hidden="true">+</span>
        </button>
      </div>
    </header>
  );
}
