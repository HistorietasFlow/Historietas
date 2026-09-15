import type { AbaPerfilAutor } from "../types";
import {
  profileTabActiveStyle,
  profileTabsStyle,
  profileTabStyle,
} from "../styles";

type ProfileSectionTabsProps = {
  abaAtiva: AbaPerfilAutor;
  bibliotecaVisivel: boolean;
  comunidadeVisivel: boolean;
  diarioVisivel: boolean;
  obrasVisivel: boolean;
  sobreVisivel: boolean;
  totalAbasVisiveis: number;
  onSelect: (aba: AbaPerfilAutor) => void;
};

export function ProfileSectionTabs({
  abaAtiva,
  bibliotecaVisivel,
  comunidadeVisivel,
  diarioVisivel,
  obrasVisivel,
  sobreVisivel,
  totalAbasVisiveis,
  onSelect,
}: ProfileSectionTabsProps) {
  return (
    <div
      role="group"
      style={{
        ...profileTabsStyle,
        gridTemplateColumns: `repeat(${totalAbasVisiveis}, minmax(0, 1fr))`,
      }}
      aria-label="Seções do perfil"
    >
      {obrasVisivel && (
        <button
          type="button"
          aria-pressed={abaAtiva === "obras"}
          onClick={() => onSelect("obras")}
          style={abaAtiva === "obras" ? profileTabActiveStyle : profileTabStyle}
        >
          Obras
        </button>
      )}

      {diarioVisivel && (
        <button
          type="button"
          aria-pressed={abaAtiva === "diario"}
          onClick={() => onSelect("diario")}
          style={abaAtiva === "diario" ? profileTabActiveStyle : profileTabStyle}
        >
          Diário
        </button>
      )}

      {comunidadeVisivel && (
        <button
          type="button"
          aria-pressed={abaAtiva === "comunidade"}
          onClick={() => onSelect("comunidade")}
          style={
            abaAtiva === "comunidade" ? profileTabActiveStyle : profileTabStyle
          }
        >
          Comunidade
        </button>
      )}

      {sobreVisivel && (
        <button
          type="button"
          aria-pressed={abaAtiva === "sobre"}
          onClick={() => onSelect("sobre")}
          style={abaAtiva === "sobre" ? profileTabActiveStyle : profileTabStyle}
        >
          Sobre
        </button>
      )}

      {bibliotecaVisivel && (
        <button
          type="button"
          aria-pressed={abaAtiva === "biblioteca"}
          onClick={() => onSelect("biblioteca")}
          style={
            abaAtiva === "biblioteca" ? profileTabActiveStyle : profileTabStyle
          }
        >
          Biblioteca
        </button>
      )}
    </div>
  );
}
