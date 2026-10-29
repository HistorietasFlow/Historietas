import {
  searchIconStyle,
  searchInputStyle,
  searchSectionStyle,
  searchShellStyle,
} from "../lib/top5-search-feedback-styles";

type Top5SearchSectionProps = {
  busca: string;
  onBuscaChange: (valor: string) => void;
};

export function Top5SearchSection({
  busca,
  onBuscaChange,
}: Top5SearchSectionProps) {
  return (
    <section style={searchSectionStyle} aria-label="Buscar obras">
      <label style={searchShellStyle} htmlFor="buscar-obra-top-5">
        <span style={searchIconStyle}>⌕</span>

        <input
          id="buscar-obra-top-5"
          value={busca}
          onChange={(event) => onBuscaChange(event.target.value)}
          aria-label="Pesquisar obra, autor, gênero ou tag"
          placeholder="Pesquisar obra, autor, gênero ou tag"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={90}
          style={searchInputStyle}
          type="text"
        />
      </label>
    </section>
  );
}
