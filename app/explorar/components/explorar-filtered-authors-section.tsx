import AutorExplorarCard from "./explorar-autor-card";
import { SectionHeader } from "./explorar-section-components";
import type { TemaCategoriaExplorar } from "./explorar-section-components";
import {
  autoresExplorarGridStyle,
  desktopAutoresExplorarGridStyle,
  desktopSectionStyle,
  sectionStyle,
} from "../lib/explorar-content-styles";
import type { AutorExplorar } from "../lib/explorar-derived-utils";

type ExplorarFilteredAuthorsSectionProps = {
  autores: AutorExplorar[];
  titulo: string;
  tema: TemaCategoriaExplorar;
  isDesktop: boolean;
};

export function ExplorarFilteredAuthorsSection({
  autores,
  titulo,
  tema,
  isDesktop,
}: ExplorarFilteredAuthorsSectionProps) {
  return (
    <section
      style={
        isDesktop
          ? desktopSectionStyle
          : sectionStyle
      }
    >
      <SectionHeader
        title={titulo}
        tema={tema}
        isDesktop={isDesktop}
      />

      <div
        style={
          isDesktop
            ? desktopAutoresExplorarGridStyle
            : autoresExplorarGridStyle
        }
      >
        {autores.map((autor) => (
          <AutorExplorarCard
            key={autor.chave}
            autor={autor}
            isDesktop={isDesktop}
            emGrade
          />
        ))}
      </div>
    </section>
  );
}
