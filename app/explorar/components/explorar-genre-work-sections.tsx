import { normalizarTexto } from "../../../lib/utils";
import ObraPublicadaCard from "./explorar-obra-publicada-card";
import {
  ExplorarCarouselRow,
  SectionHeader,
} from "./explorar-section-components";
import {
  obterTituloCriativoObrasExplorar,
} from "../lib/explorar-category-titles";
import {
  desktopExplorarObraCarouselItemStyle,
  desktopSectionStyle,
  explorarObraCarouselItemStyle,
  sectionStyle,
} from "../lib/explorar-content-styles";
import { criarHrefListaExplorar } from "../lib/explorar-list-route-utils";
import { obterTemaCategoria } from "../lib/explorar-theme";
import type { ObraLocal } from "../lib/explorar-work-normalizers";

type SecaoObrasGeneroExplorar = {
  genero: string;
  obras: ObraLocal[];
};

type ExplorarGenreWorkSectionsProps = {
  secoes: SecaoObrasGeneroExplorar[];
  isDesktop: boolean;
};

export function ExplorarGenreWorkSections({
  secoes,
  isDesktop,
}: ExplorarGenreWorkSectionsProps) {
  return secoes.map((secao) => (
    <section
      key={`obras-${normalizarTexto(secao.genero)}`}
      style={isDesktop ? desktopSectionStyle : sectionStyle}
    >
      <SectionHeader
        title={obterTituloCriativoObrasExplorar(secao.genero)}
        tema={obterTemaCategoria()}
        isDesktop={isDesktop}
        href={criarHrefListaExplorar({
          titulo: obterTituloCriativoObrasExplorar(secao.genero),
          modo: "obras",
          genero: secao.genero,
        })}
      />

      <ExplorarCarouselRow isDesktop={isDesktop} variant="obra">
        {secao.obras.map((obra) => (
          <div
            key={`${secao.genero}-${obra.id}`}
            style={
              isDesktop
                ? desktopExplorarObraCarouselItemStyle
                : explorarObraCarouselItemStyle
            }
          >
            <ObraPublicadaCard obra={obra} isDesktop={isDesktop} />
          </div>
        ))}
      </ExplorarCarouselRow>
    </section>
  ));
}
