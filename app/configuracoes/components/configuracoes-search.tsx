import { SvgIcon } from "./configuracoes-svg-icon";
import {
  searchBoxStyle,
  searchInputStyle,
} from "../lib/configuracoes-shell-styles";
import type { ConfiguracoesSearchProps } from "./configuracoes-search-props";

export function ConfiguracoesSearch({
  busca,
  onBuscaChange,
  traduzirTexto,
}: ConfiguracoesSearchProps) {
  return (
    <label style={searchBoxStyle} htmlFor="buscar-configuracoes">
      <SvgIcon name="search" size={23} strokeWidth={2.3} />
      <input
        id="buscar-configuracoes"
        className="configuracoes-input configuracoes-input-transparente"
        value={busca}
        onChange={(event) => onBuscaChange(event.target.value)}
        placeholder={traduzirTexto("Pesquisar", "Search", "Buscar")}
        maxLength={80}
        autoComplete="off"
        style={searchInputStyle}
      />
    </label>
  );
}
