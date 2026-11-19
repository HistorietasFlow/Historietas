import { normalizarTexto } from "../../../lib/utils";
import { recomendacoesExigemLogin, recomendacoesLocaisAtivas } from "../../../lib/recomendacoes-locais";
import { ExplorarRecomendacoesLocais } from "./explorar-recomendacoes-locais";
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
  leitor?: string;
  mostrarRecomendacoes?: boolean;
};

export function ExplorarCreativeWorkSections({
  secoes,
  isDesktop,
  tema,
  leitor = "",
  mostrarRecomendacoes = false,
}: ExplorarCreativeWorkSectionsProps) {
  const usarPiloto = recomendacoesLocaisAtivas && mostrarRecomendacoes;
  const secoesComuns = secoes.map((secao) => usarPiloto && secao.titulo === "Recomendações para você" ? null : (
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

  return (
    <>
      {usarPiloto && (!recomendacoesExigemLogin || leitor) &&
        <ExplorarRecomendacoesLocais leitor={leitor} isDesktop={isDesktop} tema={tema} />}
      {secoesComuns}
    </>
  );
}
