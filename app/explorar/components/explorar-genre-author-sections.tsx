import { normalizarTexto } from "../../../lib/utils";
import AutorExplorarCard from "./explorar-autor-card";
import {
  ExplorarCarouselRow,
  SectionHeader,
} from "./explorar-section-components";
import {
  obterTituloCriativoAutoresExplorar,
} from "../lib/explorar-category-titles";
import {
  desktopSectionStyle,
  sectionStyle,
} from "../lib/explorar-content-styles";
import type { AutorExplorar } from "../lib/explorar-derived-utils";
import { criarHrefListaExplorar } from "../lib/explorar-list-route-utils";
import { obterTemaCategoria } from "../lib/explorar-theme";

type SecaoAutoresGeneroExplorar = {
  genero: string;
  autores: AutorExplorar[];
};

type ExplorarGenreAuthorSectionsProps = {
  secoes: SecaoAutoresGeneroExplorar[];
  isDesktop: boolean;
};

export function ExplorarGenreAuthorSections({
  secoes,
  isDesktop,
}: ExplorarGenreAuthorSectionsProps) {
  return secoes.map((secao) => (
    <section
      key={`autores-${normalizarTexto(secao.genero)}`}
      style={isDesktop ? desktopSectionStyle : sectionStyle}
    >
      <SectionHeader
        title={obterTituloCriativoAutoresExplorar(secao.genero)}
        tema={obterTemaCategoria()}
        isDesktop={isDesktop}
        href={criarHrefListaExplorar({
          titulo: obterTituloCriativoAutoresExplorar(secao.genero),
          modo: "autores",
          genero: secao.genero,
        })}
      />

      <ExplorarCarouselRow isDesktop={isDesktop} variant="autor">
        {secao.autores.map((autor) => (
          <AutorExplorarCard
            key={`${secao.genero}-${autor.chave}`}
            autor={autor}
            isDesktop={isDesktop}
          />
        ))}
      </ExplorarCarouselRow>
    </section>
  ));
}
