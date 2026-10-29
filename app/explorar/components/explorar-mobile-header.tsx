import type { HistorietasLanguage } from "../../../lib/i18n";
import type { ModoConteudoExplorar } from "./explorar-section-components";
import {
  explorarHeaderFilterButtonStyle,
  explorarHeaderFilterIconStyle,
  explorarHeaderSearchInputStyle,
  explorarHeaderSearchShellStyle,
  mobileSearchToggleStyle,
  titleHeaderStyle,
} from "../lib/explorar-layout-styles";
import { traduzirTextoExplorar } from "../lib/explorar-translations";

type ExplorarMobileHeaderProps = {
  busca: string;
  buscaMobileAberta: boolean;
  modoConteudo: ModoConteudoExplorar;
  textoBotaoFiltrosAvancados: string;
  language: HistorietasLanguage;
  onBuscaChange: (valor: string) => void;
  onAbrirBusca: () => void;
  onFecharBusca: () => void;
  onAbrirFiltros: () => void;
};

export function ExplorarMobileHeader({
  busca,
  buscaMobileAberta,
  modoConteudo,
  textoBotaoFiltrosAvancados,
  language,
  onBuscaChange,
  onAbrirBusca,
  onFecharBusca,
  onAbrirFiltros,
}: ExplorarMobileHeaderProps) {
  return (
    <header style={titleHeaderStyle}>
      <button
        type="button"
        onClick={onAbrirFiltros}
        style={explorarHeaderFilterButtonStyle}
        aria-label={traduzirTextoExplorar(
          "Abrir funções do Explorar",
          language,
        )}
      >
        <span>{textoBotaoFiltrosAvancados}</span>
        <span style={explorarHeaderFilterIconStyle} aria-hidden="true">
          +
        </span>
      </button>

      {buscaMobileAberta ? (
        <>
          <label style={explorarHeaderSearchShellStyle}>
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
              style={explorarHeaderSearchInputStyle}
              type="text"
              autoFocus
            />
          </label>

          <button
            type="button"
            onClick={onFecharBusca}
            aria-label={traduzirTextoExplorar("Fechar busca", language)}
            aria-expanded="true"
            style={mobileSearchToggleStyle}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle
                cx="10.85"
                cy="10.85"
                r="6.65"
                stroke="currentColor"
                strokeWidth="2.15"
              />
              <path
                d="M16.05 16.05L20.25 20.25"
                stroke="currentColor"
                strokeWidth="2.15"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={onAbrirBusca}
          aria-label={traduzirTextoExplorar("Abrir busca", language)}
          aria-expanded="false"
          style={mobileSearchToggleStyle}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              cx="10.85"
              cy="10.85"
              r="6.65"
              stroke="currentColor"
              strokeWidth="2.15"
            />
            <path
              d="M16.05 16.05L20.25 20.25"
              stroke="currentColor"
              strokeWidth="2.15"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </header>
  );
}
