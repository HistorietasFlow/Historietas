import MobileAutorCard from "./HomeAuthorCard";
import MobileObraCard from "./HomeCatalogWorkCard";
import MobileObraLocalCard from "./HomeLocalWorkCard";
import HomeCarouselRow from "./HomeCarouselRow";
import HomeSectionHeader from "./HomeSectionHeader";
import { EmptySearch, HomeEmptyState } from "./HomeStatusStates";
import {
  desktopLastSectionStyle,
  desktopSectionStyle,
  lastSectionStyle,
  sectionStyle,
} from "../app/lib/home-summary-section-styles";
import type { AutorHome } from "../app/lib/home-author-composition-utils";
import type { AvaliacaoAutorHome } from "../app/lib/home-format-utils";
import type { Obra, ObraLocal } from "../app/lib/home-page-models";

type HomeContentSectionsProps = {
  isDesktop: boolean;
  termoBusca: string;
  homeSemObrasReais: boolean;
  obrasParaContinuar: ObraLocal[];
  totalMinhaListaHome: number;
  obrasMinhaLista: ObraLocal[];
  obrasCatalogoMinhaLista: Obra[];
  autoresParaConhecer: AutorHome[];
  avaliacoesAutoresHome: Record<string, AvaliacaoAutorHome>;
  totalRecomendacoesHome: number;
  temasRecomendadosUsuario: Set<string>;
  obrasRecomendadas: ObraLocal[];
  obrasCatalogoRecomendadas: Obra[];
  obrasPublicadasFiltradas: ObraLocal[];
  obrasComNovosCapitulos: ObraLocal[];
  obrasMaisCurtidas: ObraLocal[];
  obrasMaisComentadas: ObraLocal[];
  obrasComArquivoAnexado: ObraLocal[];
  leiturasRapidas: ObraLocal[];
  obrasFiltradas: Obra[];
  obrasFantasiaPoderes: Obra[];
  obrasTerrorSuspense: Obra[];
  obrasRomanceDrama: Obra[];
  obrasAcaoRivalidades: Obra[];
  obrasScifiCodigo: Obra[];
  obrasEmBreve: Obra[];
};

export default function HomeContentSections({
  isDesktop,
  termoBusca,
  homeSemObrasReais,
  obrasParaContinuar,
  totalMinhaListaHome,
  obrasMinhaLista,
  obrasCatalogoMinhaLista,
  autoresParaConhecer,
  avaliacoesAutoresHome,
  totalRecomendacoesHome,
  temasRecomendadosUsuario,
  obrasRecomendadas,
  obrasCatalogoRecomendadas,
  obrasPublicadasFiltradas,
  obrasComNovosCapitulos,
  obrasMaisCurtidas,
  obrasMaisComentadas,
  obrasComArquivoAnexado,
  leiturasRapidas,
  obrasFiltradas,
  obrasFantasiaPoderes,
  obrasTerrorSuspense,
  obrasRomanceDrama,
  obrasAcaoRivalidades,
  obrasScifiCodigo,
  obrasEmBreve,
}: HomeContentSectionsProps) {
  return (
    <>
      {homeSemObrasReais && <HomeEmptyState />}

      {obrasParaContinuar.length > 0 && (
        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <HomeSectionHeader
            title="Continuar lendo"
            subtitle="Continue do ponto em que parou."
          />

          <HomeCarouselRow isDesktop={isDesktop}>
            {obrasParaContinuar.map((obra) => (
              <MobileObraLocalCard
                key={`continuar-${obra.id}`}
                obra={obra}
                tipo="continuar"
                isDesktop={isDesktop}
              />
            ))}
          </HomeCarouselRow>
        </section>
      )}

      {totalMinhaListaHome > 0 && (
        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <HomeSectionHeader
            title="Minha lista"
            subtitle={`${totalMinhaListaHome} na lista para acessar rápido.`}
          />

          <HomeCarouselRow isDesktop={isDesktop}>
            {obrasMinhaLista.map((obra) => (
              <MobileObraLocalCard
                key={`minha-lista-${obra.id}`}
                obra={obra}
                tipo="catalogo"
                isDesktop={isDesktop}
              />
            ))}

            {obrasCatalogoMinhaLista.map((obra) => (
              <MobileObraCard
                key={`minha-lista-catalogo-${obra.titulo}`}
                obra={obra}
                isDesktop={isDesktop}
              />
            ))}
          </HomeCarouselRow>
        </section>
      )}

      {autoresParaConhecer.length > 0 && (
        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <HomeSectionHeader
            title="Autores para conhecer"
            subtitle="Perfis que dão vida ao catálogo."
          />

          <HomeCarouselRow isDesktop={isDesktop} variant="autor">
            {autoresParaConhecer.map((autor) => (
              <MobileAutorCard
                key={`autor-${autor.chave}`}
                autor={autor}
                avaliacao={avaliacoesAutoresHome[autor.autorId]}
                isDesktop={isDesktop}
              />
            ))}
          </HomeCarouselRow>
        </section>
      )}

      {totalRecomendacoesHome > 0 && (
        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <HomeSectionHeader
            title="Recomendações para você"
            subtitle={
              temasRecomendadosUsuario.size > 0
                ? "Obras parecidas com o que você lê ou salvou."
                : "Sugestões para começar sua próxima leitura."
            }
          />

          <HomeCarouselRow isDesktop={isDesktop}>
            {obrasRecomendadas.map((obra) => (
              <MobileObraLocalCard
                key={`recomendadas-${obra.id}`}
                obra={obra}
                tipo="catalogo"
                isDesktop={isDesktop}
              />
            ))}

            {obrasCatalogoRecomendadas.map((obra) => (
              <MobileObraCard
                key={`recomendadas-catalogo-${obra.titulo}`}
                obra={obra}
                isDesktop={isDesktop}
              />
            ))}
          </HomeCarouselRow>
        </section>
      )}

      {obrasPublicadasFiltradas.length > 0 && (
        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <HomeSectionHeader
            title="Publicações recentes"
            subtitle={`${obrasPublicadasFiltradas.length} ${
              obrasPublicadasFiltradas.length === 1
                ? "obra publicada"
                : "obras publicadas"
            }`}
          />

          <HomeCarouselRow isDesktop={isDesktop}>
            {obrasPublicadasFiltradas.map((obra) => (
              <MobileObraLocalCard
                key={obra.id}
                obra={obra}
                tipo="catalogo"
                isDesktop={isDesktop}
              />
            ))}
          </HomeCarouselRow>
        </section>
      )}

      {obrasComNovosCapitulos.length > 0 && (
        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <HomeSectionHeader
            title="Novos capítulos"
            subtitle="Capítulos novos para acompanhar sem perder o ritmo."
          />

          <HomeCarouselRow isDesktop={isDesktop}>
            {obrasComNovosCapitulos.map((obra) => (
              <MobileObraLocalCard
                key={`novos-capitulos-${obra.id}`}
                obra={obra}
                tipo="novo-capitulo"
                isDesktop={isDesktop}
              />
            ))}
          </HomeCarouselRow>
        </section>
      )}

      {obrasMaisCurtidas.length > 0 && (
        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <HomeSectionHeader
            title="Mais curtidas"
            subtitle="Na lista da comunidade nesta fase."
          />

          <HomeCarouselRow isDesktop={isDesktop}>
            {obrasMaisCurtidas.map((obra) => (
              <MobileObraLocalCard
                key={`mais-curtidas-${obra.id}`}
                obra={obra}
                tipo="catalogo"
                isDesktop={isDesktop}
              />
            ))}
          </HomeCarouselRow>
        </section>
      )}

      {obrasMaisComentadas.length > 0 && (
        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <HomeSectionHeader
            title="Mais comentadas"
            subtitle="Histórias que estão puxando conversa."
          />

          <HomeCarouselRow isDesktop={isDesktop}>
            {obrasMaisComentadas.map((obra) => (
              <MobileObraLocalCard
                key={`mais-comentadas-${obra.id}`}
                obra={obra}
                tipo="catalogo"
                isDesktop={isDesktop}
              />
            ))}
          </HomeCarouselRow>
        </section>
      )}

      {obrasComArquivoAnexado.length > 0 && (
        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <HomeSectionHeader
            title="Extras e arquivos"
            subtitle="Histórias com material extra para abrir depois."
          />

          <HomeCarouselRow isDesktop={isDesktop}>
            {obrasComArquivoAnexado.map((obra) => (
              <MobileObraLocalCard
                key={`arquivo-anexado-${obra.id}`}
                obra={obra}
                tipo="catalogo"
                isDesktop={isDesktop}
              />
            ))}
          </HomeCarouselRow>
        </section>
      )}

      {leiturasRapidas.length > 0 && (
        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <HomeSectionHeader
            title="Para ler agora"
            subtitle="Obras curtas para entrar rápido no universo."
          />

          <HomeCarouselRow isDesktop={isDesktop}>
            {leiturasRapidas.map((obra) => (
              <MobileObraLocalCard
                key={`leituras-rapidas-${obra.id}`}
                obra={obra}
                tipo="catalogo"
                isDesktop={isDesktop}
              />
            ))}
          </HomeCarouselRow>
        </section>
      )}

      {(obrasFiltradas.length > 0 || Boolean(termoBusca)) && (
        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <HomeSectionHeader title="Catálogo" subtitle="Obras reais publicadas na plataforma." />

          {obrasFiltradas.length > 0 ? (
            <HomeCarouselRow isDesktop={isDesktop}>
              {obrasFiltradas.map((obra) => (
                <MobileObraCard key={obra.titulo} obra={obra} isDesktop={isDesktop} />
              ))}
            </HomeCarouselRow>
          ) : (
            <EmptySearch />
          )}
        </section>
      )}

      {obrasFantasiaPoderes.length > 0 && (
        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <HomeSectionHeader
            title="Fantasia e poderes"
            subtitle="Mundos, poderes e mistérios para explorar."
          />

          <HomeCarouselRow isDesktop={isDesktop}>
            {obrasFantasiaPoderes.map((obra) => (
              <MobileObraCard key={`fantasia-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
            ))}
          </HomeCarouselRow>
        </section>
      )}

      {obrasTerrorSuspense.length > 0 && (
        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <HomeSectionHeader
            title="Terror e suspense"
            subtitle="Atmosfera sombria, tensão e mistério."
          />

          <HomeCarouselRow isDesktop={isDesktop}>
            {obrasTerrorSuspense.map((obra) => (
              <MobileObraCard key={`terror-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
            ))}
          </HomeCarouselRow>
        </section>
      )}

      {obrasRomanceDrama.length > 0 && (
        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <HomeSectionHeader
            title="Romance e drama"
            subtitle="Relações intensas e escolhas difíceis."
          />

          <HomeCarouselRow isDesktop={isDesktop}>
            {obrasRomanceDrama.map((obra) => (
              <MobileObraCard key={`romance-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
            ))}
          </HomeCarouselRow>
        </section>
      )}

      {obrasAcaoRivalidades.length > 0 && (
        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <HomeSectionHeader
            title="Ação e rivalidades"
            subtitle="Conflitos, disputas e personagens intensos."
          />

          <HomeCarouselRow isDesktop={isDesktop}>
            {obrasAcaoRivalidades.map((obra) => (
              <MobileObraCard key={`acao-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
            ))}
          </HomeCarouselRow>
        </section>
      )}

      {obrasScifiCodigo.length > 0 && (
        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <HomeSectionHeader
            title="Sci-fi e códigos"
            subtitle="Futuro, sistemas e universos alternativos."
          />

          <HomeCarouselRow isDesktop={isDesktop}>
            {obrasScifiCodigo.map((obra) => (
              <MobileObraCard key={`scifi-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
            ))}
          </HomeCarouselRow>
        </section>
      )}

      {obrasEmBreve.length > 0 && (
        <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
          <HomeSectionHeader
            title="Em breve na Historietas"
            subtitle="Obras chegando ao catálogo em breve."
          />

          <HomeCarouselRow isDesktop={isDesktop}>
            {obrasEmBreve.map((obra) => (
              <MobileObraCard key={`em-breve-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
            ))}
          </HomeCarouselRow>
        </section>
      )}

      {obrasFiltradas.length > 0 && (
        <section style={isDesktop ? desktopLastSectionStyle : lastSectionStyle}>
          <HomeSectionHeader
            title="Obras em destaque"
            subtitle="Obras reais disponíveis para leitura."
          />

          <HomeCarouselRow isDesktop={isDesktop}>
            {obrasFiltradas.map((obra) => (
              <MobileObraCard key={`destaque-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
            ))}
          </HomeCarouselRow>
        </section>
      )}
    </>
  );
}
