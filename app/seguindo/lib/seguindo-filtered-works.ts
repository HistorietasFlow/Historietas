import type { AbaConteudoSeguindo, FiltroSeguindo, ObraLocal, OrdenacaoSeguindo } from "./seguindo-page-types";
import { obraEstaNaLista } from "./seguindo-work-collection-utils";
import { obraEmLeitura, calcularProgressoLeitura } from "./seguindo-work-metrics-utils";
import { textoBuscaObra, dataAtividadeObra } from "./seguindo-work-presentation-utils";

export function filtrarObrasSeguindo(
  obrasSeguidasBase: ObraLocal[],
  termoBusca: string,
  filtro: FiltroSeguindo,
  ordenacao: OrdenacaoSeguindo,
  obrasFavoritas: string[],
  obrasConcluidas: string[],
  abaConteudo: AbaConteudoSeguindo,
): ObraLocal[] {
    if (abaConteudo !== "obras") {
      return [] as ObraLocal[];
    }

    const filtradas = obrasSeguidasBase.filter((obra) => {
      if (filtro === "autores" || filtro === "usuarios") {
        return false;
      }

      const passaBusca = termoBusca
        ? textoBuscaObra(obra).includes(termoBusca)
        : true;

      const passaFiltro =
        filtro === "todos" ||
        filtro === "obras" ||
        (filtro === "em-leitura" && obraEmLeitura(obra)) ||
        (filtro === "favoritas" && obraEstaNaLista(obra, obrasFavoritas)) ||
        (filtro === "concluidas" && obraEstaNaLista(obra, obrasConcluidas));

      return passaBusca && passaFiltro;
    });

    return [...filtradas].sort((obraA, obraB) => {
      if (ordenacao === "titulo") {
        return obraA.titulo.localeCompare(obraB.titulo);
      }

      if (ordenacao === "progresso") {
        return (
          calcularProgressoLeitura(obraB.capitulos) -
          calcularProgressoLeitura(obraA.capitulos)
        );
      }

      if (ordenacao === "capitulos") {
        return obraB.capitulos.length - obraA.capitulos.length;
      }

      if (ordenacao === "antigos") {
        return dataAtividadeObra(obraA) - dataAtividadeObra(obraB);
      }

      return dataAtividadeObra(obraB) - dataAtividadeObra(obraA);
    });

}
