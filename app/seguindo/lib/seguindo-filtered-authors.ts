import { normalizarTexto } from "../../../lib/utils";
import { formatarGeneroSeguindo } from "./seguindo-format-utils";
import type { AbaConteudoSeguindo, AutorSeguido, FiltroSeguindo, OrdenacaoSeguindo } from "./seguindo-page-types";

export function filtrarAutoresSeguindo(
  autoresBase: AutorSeguido[],
  termoBusca: string,
  filtro: FiltroSeguindo,
  ordenacao: OrdenacaoSeguindo,
  abaConteudo: AbaConteudoSeguindo,
  visualizandoListaSocialDoPerfil: boolean,
): AutorSeguido[] {
    if (visualizandoListaSocialDoPerfil || abaConteudo !== "pessoas") {
      return [] as AutorSeguido[];
    }

    const filtrados = autoresBase.filter((autor) => {
      if (filtro === "obras" || filtro === "usuarios") {
        return false;
      }

      const textoAutor = normalizarTexto(
        [
          autor.nome,
          autor.obras.map((obra) => obra.titulo).join(" "),
          autor.obras.map((obra) => obra.genero).join(" "),
          autor.obras.map((obra) => formatarGeneroSeguindo(obra.genero)).join(" "),
          autor.obras.map((obra) => obra.tags.join(" ")).join(" "),
        ].join(" ")
      );

      const passaBusca = termoBusca ? textoAutor.includes(termoBusca) : true;

      const passaFiltro =
        filtro === "todos" ||
        filtro === "autores" ||
        (filtro === "em-leitura" && autor.totalEmLeitura > 0) ||
        (filtro === "favoritas" && autor.totalFavoritas > 0) ||
        (filtro === "concluidas" && autor.totalConcluidas > 0);

      return passaBusca && passaFiltro;
    });

    return [...filtrados].sort((autorA, autorB) => {
      if (ordenacao === "progresso") {
        return autorB.progressoMedio - autorA.progressoMedio;
      }

      if (ordenacao === "capitulos") {
        return autorB.totalCapitulos - autorA.totalCapitulos;
      }

      return autorA.nome.localeCompare(autorB.nome);
    });

}
