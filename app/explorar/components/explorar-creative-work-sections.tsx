import { normalizarTexto } from "../../../lib/utils";
import ObraPublicadaCard from "./explorar-obra-publicada-card";
import {
  ExplorarCarouselRow,
  SectionHeader,
} from "./explorar-section-components";
import type { TemaCategoriaExplorar } from "./explorar-section-components";
import {
  desktopExplorarObraCarouselItemStyle,
  desktopSectionStyle,
  explorarObraCarouselItemStyle,
  sectionStyle,
} from "../lib/explorar-content-styles";
import { criarHrefListaExplorar } from "../lib/explorar-list-route-utils";
import type { ObraLocal } from "../lib/explorar-work-normalizers";

type SecaoCriativaObrasExplorar = {
  titulo: string;
  obras: ObraLocal[];
};

type ExplorarCreativeWorkSectionsProps = {
  secoes: SecaoCriativaObrasExplorar[];
  isDesktop: boolean;
  tema: TemaCategoriaExplorar;
};

export function ExplorarCreativeWorkSections({
  secoes,
  isDesktop,
  tema,
}: ExplorarCreativeWorkSectionsProps) {
  return secoes.map((secao) => (
    <section
      key={`obras-criativas-${normalizarTexto(secao.titulo)}`}
      style={isDesktop ? desktopSectionStyle : sectionStyle}
    >
      <SectionHeader
        title={secao.titulo}
        tema={tema}
        isDesktop={isDesktop}
        href={criarHrefListaExplorar({
          titulo: secao.titulo,
          modo: "obras",
        })}
      />

      <ExplorarCarouselRow isDesktop={isDesktop} variant="obra">
        {secao.obras.map((obra) => (
          <div
            key={`${secao.titulo}-${obra.id}`}
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
