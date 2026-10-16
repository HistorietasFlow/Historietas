import {
  criarIdentificadoresObraCatalogoHome,
  colecaoTemIdentificadorHome,
  obterIdentificadorFavoritoHome,
} from "./home-collection-utils";
import {
  obterImagemObraCatalogo,
  obterTotalCapitulosObraCatalogoHome,
  obraCatalogoTemArquivoAnexadoHome,
} from "./home-catalog-utils";
import { compactarNumeroHome } from "./home-format-utils";
import { criarHrefObraCatalogoHome } from "./home-route-utils";

type ObraHeroHome = {
  id?: string;
  titulo: string;
  disponivel: boolean;
  slug?: string;
  link?: string;
  capa?: string;
  capaUrl?: string;
  cover?: string;
  imagem?: string;
  capitulos?: unknown;
  arquivoObra?: unknown;
  views: string;
  likes: string;
  comentarios: string;
};

type CriarDadosHeroHomeParams<Obra extends ObraHeroHome> = {
  obrasHero: Obra[];
  heroIndex: number;
  heroInicial: Obra;
  usuarioLogado: boolean;
  obrasFavoritas: string[];
};

export function criarDadosHeroHome<Obra extends ObraHeroHome>({
  obrasHero,
  heroIndex,
  heroInicial,
  usuarioLogado,
  obrasFavoritas,
}: CriarDadosHeroHomeParams<Obra>) {
  const usandoHeroInicial = obrasHero.length === 0;
  const heroObra = obrasHero[heroIndex] || obrasHero[0] || heroInicial;
  const heroObraHref = usandoHeroInicial ? "/explorar" : criarHrefObraCatalogoHome(heroObra);
  const heroTemImagem = Boolean(!usandoHeroInicial && obterImagemObraCatalogo(heroObra));
  const heroFavoritoId = usandoHeroInicial ? "" : obterIdentificadorFavoritoHome(heroObra);
  const heroTotalCapitulos = usandoHeroInicial
    ? 0
    : obterTotalCapitulosObraCatalogoHome(heroObra);
  const desktopHeroTemArquivo = Boolean(
    !usandoHeroInicial && obraCatalogoTemArquivoAnexadoHome(heroObra),
  );
  const desktopHeroTotalConteudo = compactarNumeroHome(
    desktopHeroTemArquivo ? 1 : heroTotalCapitulos,
  );
  const metricasHeroHome = [
    { icone: "👁️", valor: heroObra.views || "0" },
    { icone: "❤️", valor: heroObra.likes || "0", destaque: true },
    { icone: "💬", valor: heroObra.comentarios || "0" },
  ];
  const desktopMetricasHeroHome = [
    ...metricasHeroHome,
    {
      icone: desktopHeroTemArquivo ? "📄" : "📚",
      valor: desktopHeroTotalConteudo,
    },
  ];
  const heroEstaSalvo = Boolean(
    usuarioLogado &&
      heroObra &&
      heroFavoritoId &&
      colecaoTemIdentificadorHome(
        criarIdentificadoresObraCatalogoHome(heroObra),
        obrasFavoritas
      )
  );

  return {
    usandoHeroInicial,
    heroObra,
    heroObraHref,
    heroTemImagem,
    heroFavoritoId,
    heroTotalCapitulos,
    desktopHeroTemArquivo,
    desktopHeroTotalConteudo,
    metricasHeroHome,
    desktopMetricasHeroHome,
    heroEstaSalvo,
  };
}
