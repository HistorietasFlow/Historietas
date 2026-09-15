import type { AbaBibliotecaPerfil } from "../types";
import {
  desktopProfileLibraryTabsStyle,
  profileLibraryTabActiveStyle,
  profileLibraryTabsStyle,
  profileLibraryTabStyle,
} from "../styles";

const ABAS_BIBLIOTECA: Array<[AbaBibliotecaPerfil, string]> = [
  ["tudo", "Tudo"],
  ["quero-ler", "Quero ler"],
  ["favoritas", "Na lista"],
  ["salvos", "Salvos"],
  ["lendo-agora", "Lendo"],
  ["concluidas", "Concluídas"],
  ["historico", "Histórico"],
];

type LibraryTabsProps = {
  abaAtiva: AbaBibliotecaPerfil;
  isDesktop: boolean;
  onSelect: (aba: AbaBibliotecaPerfil) => void;
};

export function LibraryTabs({
  abaAtiva,
  isDesktop,
  onSelect,
}: LibraryTabsProps) {
  return (
    <div
      style={
        isDesktop ? desktopProfileLibraryTabsStyle : profileLibraryTabsStyle
      }
    >
      {ABAS_BIBLIOTECA.map(([valor, rotulo]) => (
        <button
          key={valor}
          type="button"
          onClick={() => onSelect(valor)}
          style={
            abaAtiva === valor
              ? profileLibraryTabActiveStyle
              : profileLibraryTabStyle
          }
        >
          {rotulo}
        </button>
      ))}
    </div>
  );
}
