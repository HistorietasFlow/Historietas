import { normalizarTexto } from "../../../lib/utils";
import AutorExplorarCard from "./explorar-autor-card";
import {
  ExplorarCarouselRow,
  SectionHeader,
} from "./explorar-section-components";
import type { TemaCategoriaExplorar } from "./explorar-section-components";
import {
  desktopSectionStyle,
  sectionStyle,
} from "../lib/explorar-content-styles";
import type { AutorExplorar } from "../lib/explorar-derived-utils";
import { criarHrefListaExplorar } from "../lib/explorar-list-route-utils";

type SecaoCriativaAutoresExplorar = {
  titulo: string;
  autores: AutorExplorar[];
};

type ExplorarCreativeAuthorSectionsProps = {
  secoes: SecaoCriativaAutoresExplorar[];
  isDesktop: boolean;
  tema: TemaCategoriaExplorar;
};

export function ExplorarCreativeAuthorSections({
  secoes,
  isDesktop,
  tema,
}: ExplorarCreativeAuthorSectionsProps) {
  return secoes.map((secao) => (
    <section
      key={`autores-criativos-${normalizarTexto(secao.titulo)}`}
      style={isDesktop ? desktopSectionStyle : sectionStyle}
    >
      <SectionHeader
        title={secao.titulo}
        tema={tema}
        isDesktop={isDesktop}
        href={criarHrefListaExplorar({
          titulo: secao.titulo,
          modo: "autores",
        })}
      />

      <ExplorarCarouselRow isDesktop={isDesktop} variant="autor">
        {secao.autores.map((autor) => (
          <AutorExplorarCard
            key={`${secao.titulo}-${autor.chave}`}
            autor={autor}
            isDesktop={isDesktop}
          />
        ))}
      </ExplorarCarouselRow>
    </section>
  ));
}
