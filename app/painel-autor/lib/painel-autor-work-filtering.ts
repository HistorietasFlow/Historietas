import { normalizarTexto } from "../../../lib/utils";
import { colecaoTemObraPainel } from "./painel-autor-collection-utils";
import type { FiltroPainel, OrdenacaoPainel } from "./painel-autor-filter-options";
import {
  formatarGeneroPainelAutor,
  obterTimestamp,
} from "./painel-autor-format-utils";
import {
  obraPublicadaComConteudoPainel,
  obraRascunhoOuSemConteudoPainel,
} from "./painel-autor-work-status-utils";

type CapituloParaFiltroPainel = {
  titulo: string;
  publicado?: boolean;
};

type ObraParaFiltroPainel = {
  id: string;
  slug: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capaNome: string;
  arquivoObra?: { nome: string } | null;
  publicado: boolean;
  capitulos: CapituloParaFiltroPainel[];
  criadaEm: string;
  progressoLeitura: number;
  pontuacao: number;
};

type OpcoesObrasFiltradasPainel<TObra extends ObraParaFiltroPainel> = {
  obrasComMetricas: TObra[];
  busca: string;
  filtro: FiltroPainel;
  ordenacao: OrdenacaoPainel;
  obrasFavoritas: string[];
  obrasConcluidas: string[];
};

export function obterObrasFiltradasPainel<TObra extends ObraParaFiltroPainel>({
  obrasComMetricas,
  busca,
  filtro,
  ordenacao,
  obrasFavoritas,
  obrasConcluidas,
}: OpcoesObrasFiltradasPainel<TObra>): TObra[] {
  const termoBusca = normalizarTexto(busca);

  return obrasComMetricas
    .filter((obra) => {
      const passaBusca = termoBusca
        ? normalizarTexto(
            [
              obra.titulo,
              obra.autor,
              obra.genero,
              formatarGeneroPainelAutor(obra.genero),
              obra.formato,
              obra.classificacaoIndicativa,
              obra.sinopse,
              obra.tags.join(" "),
              obra.capaNome,
              obra.arquivoObra?.nome || "",
              obra.capitulos.map((capitulo) => capitulo.titulo).join(" "),
            ].join(" ")
          ).includes(termoBusca)
        : true;

      const passaFiltro =
        filtro === "todas"
          ? true
          : filtro === "publicadas"
          ? obraPublicadaComConteudoPainel(obra)
          : filtro === "rascunhos"
          ? obraRascunhoOuSemConteudoPainel(obra)
          : filtro === "sem-capitulos"
          ? obra.capitulos.length === 0
          : filtro === "favoritas"
          ? colecaoTemObraPainel(obrasFavoritas, obra)
          : filtro === "concluidas"
          ? colecaoTemObraPainel(obrasConcluidas, obra)
          : obra.progressoLeitura > 0 && obra.progressoLeitura < 100;

      return passaBusca && passaFiltro;
    })
    .sort((obraA, obraB) => {
      if (ordenacao === "recentes") {
        return obterTimestamp(obraB.criadaEm) - obterTimestamp(obraA.criadaEm);
      }

      if (ordenacao === "titulo") {
        return obraA.titulo.localeCompare(obraB.titulo);
      }

      if (ordenacao === "capitulos") {
        return obraB.capitulos.length - obraA.capitulos.length;
      }

      if (ordenacao === "progresso") {
        return obraB.progressoLeitura - obraA.progressoLeitura;
      }

      return obraB.pontuacao - obraA.pontuacao;
    });
}
