import { criarAutorHome } from "./home-author-composition-utils";
import type { AutorHome } from "./home-author-composition-utils";
import { obraLocalCombinaBusca } from "./home-discovery-utils";
import { obterTotalComentariosObraHome, obterTotalCurtidasObraHome } from "./home-local-work-utils";
import { normalizarChaveAutor } from "./home-author-profile-utils";
import type { PerfisAutoresSalvos } from "./home-author-profile-utils";

type CapituloAutorHome = {
  titulo: string;
  curtiu: boolean;
  comentario: string;
};

type ObraPublicadaAutorHome = {
  titulo: string;
  autor: string;
  autorId?: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capaNome: string;
  capitulos: CapituloAutorHome[];
  totalCurtidas: number;
  totalComentarios: number;
};

type ObraFiltradaAutorHome = {
  autor: string;
  genero: string;
};

type CriarAutoresParaConhecerHomeArgs = {
  obrasPublicadas: ObraPublicadaAutorHome[];
  obrasFiltradas: ObraFiltradaAutorHome[];
  perfisAutores: PerfisAutoresSalvos;
  termoBusca: string;
};

export function criarAutoresParaConhecerHome({
  obrasPublicadas,
  obrasFiltradas,
  perfisAutores,
  termoBusca,
}: CriarAutoresParaConhecerHomeArgs): AutorHome[] {
  const autoresMap = new Map<
    string,
    {
      nome: string;
      autorId: string;
      generos: string[];
      totalObras: number;
      totalCapitulos: number;
      totalCurtidas: number;
      totalComentarios: number;
    }
  >();

  function registrarAutor(
    nomeAutor: string,
    autorId: string,
    genero: string,
    capitulos = 0,
    curtidas = 0,
    comentarios = 0
  ) {
    const nomeLimpo = nomeAutor.trim() || "Autor não informado";
    const autorIdLimpo = autorId.trim();
    const chave = autorIdLimpo || normalizarChaveAutor(nomeLimpo);
    const autorRegistrado = autoresMap.get(chave);

    if (autorRegistrado) {
      autoresMap.set(chave, {
        ...autorRegistrado,
        generos: genero.trim()
          ? [...autorRegistrado.generos, genero.trim()]
          : autorRegistrado.generos,
        totalObras: autorRegistrado.totalObras + 1,
        totalCapitulos: autorRegistrado.totalCapitulos + capitulos,
        totalCurtidas: autorRegistrado.totalCurtidas + curtidas,
        totalComentarios: autorRegistrado.totalComentarios + comentarios,
      });

      return;
    }

    autoresMap.set(chave, {
      nome: nomeLimpo,
      autorId: autorIdLimpo,
      generos: genero.trim() ? [genero.trim()] : [],
      totalObras: 1,
      totalCapitulos: capitulos,
      totalCurtidas: curtidas,
      totalComentarios: comentarios,
    });
  }

  obrasPublicadas
    .filter((obra) => obraLocalCombinaBusca(obra, termoBusca))
    .forEach((obra) => {
      registrarAutor(
        obra.autor,
        obra.autorId || "",
        obra.genero,
        obra.capitulos.length,
        obterTotalCurtidasObraHome(obra),
        obterTotalComentariosObraHome(obra)
      );
    });

  obrasFiltradas.forEach((obra) => {
    registrarAutor(obra.autor, "", obra.genero);
  });

  return Array.from(autoresMap.values())
    .map((autor) =>
      criarAutorHome(
        autor.nome,
        autor.autorId,
        autor.generos,
        autor.totalObras,
        autor.totalCapitulos,
        autor.totalCurtidas,
        autor.totalComentarios,
        perfisAutores
      )
    )
    .sort((autorA, autorB) => {
      return (
        autorB.totalObras - autorA.totalObras ||
        autorB.totalCapitulos - autorA.totalCapitulos ||
        autorA.nome.localeCompare(autorB.nome, "pt-BR")
      );
    })
    .slice(0, 12);
}
