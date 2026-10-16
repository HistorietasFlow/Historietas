import { normalizarTexto } from "../../lib/utils";
import { criarObraHeroLocalHome } from "./home-hero-work-utils";
import { formatarGeneroHome } from "./home-metadata-utils";

type CapituloHeroSelecionavelHome = {
  titulo: string;
  curtiu: boolean;
  comentario: string;
};

type ObraHeroSelecionavelHome<Capitulo extends CapituloHeroSelecionavelHome> = {
  id: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capa: string;
  arquivoObra?: unknown;
  capitulos: Capitulo[];
  visualizacoes: number;
  totalCurtidas: number;
  totalComentarios: number;
  slug: string;
  link: string;
};

export function criarObrasHeroHome<
  Capitulo extends CapituloHeroSelecionavelHome,
>(obrasPublicadas: ObraHeroSelecionavelHome<Capitulo>[], termoBusca: string) {
  if (!termoBusca) {
    return obrasPublicadas
      .slice(0, 6)
      .map((obra) => criarObraHeroLocalHome(obra));
  }

  return obrasPublicadas
    .map((obra, ordem) => {
      const titulo = normalizarTexto(obra.titulo);
      const autor = normalizarTexto(obra.autor);
      const genero = normalizarTexto(formatarGeneroHome(obra.genero));
      const tags = obra.tags.map((tag) => normalizarTexto(tag));
      const textoCompleto = normalizarTexto(
        [
          obra.titulo,
          obra.autor,
          obra.genero,
          formatarGeneroHome(obra.genero),
          obra.formato,
          obra.classificacaoIndicativa,
          obra.sinopse,
          ...obra.tags,
          ...obra.capitulos.map((capitulo) => capitulo.titulo),
        ].join(" ")
      );

      let relevancia = -1;

      if (titulo.startsWith(termoBusca)) {
        relevancia = 0;
      } else if (titulo.includes(termoBusca)) {
        relevancia = 1;
      } else if (autor.startsWith(termoBusca)) {
        relevancia = 2;
      } else if (
        genero.startsWith(termoBusca) ||
        tags.some((tag) => tag.startsWith(termoBusca))
      ) {
        relevancia = 3;
      } else if (textoCompleto.includes(termoBusca)) {
        relevancia = 4;
      }

      return {
        obra,
        ordem,
        relevancia,
      };
    })
    .filter((resultado) => resultado.relevancia >= 0)
    .sort((resultadoA, resultadoB) => {
      return (
        resultadoA.relevancia - resultadoB.relevancia ||
        resultadoA.ordem - resultadoB.ordem
      );
    })
    .slice(0, 6)
    .map(({ obra }) => criarObraHeroLocalHome(obra));
}
