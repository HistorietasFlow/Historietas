import { calcularProgressoLeitura } from "./adicionar-capitulo-metrics-utils";
import { ordenarCapitulosPorOrdem } from "./adicionar-capitulo-chapter-order-utils";

type CapituloParaCriacaoLocal = {
  id: string;
  criadoEm: string;
  lido?: boolean;
  lidoEm?: string;
  curtiu?: boolean;
  salvo?: boolean;
  comentario?: string;
};

type ObraParaCriacaoLocal<TCapitulo extends CapituloParaCriacaoLocal> = {
  id: string;
  autor: string;
  autorId?: string;
  capitulos: TCapitulo[];
};

type AplicarNovoCapituloNasObrasLocaisParams<
  TObra extends ObraParaCriacaoLocal<TCapitulo>,
  TCapitulo extends CapituloParaCriacaoLocal,
> = {
  obras: TObra[];
  obraId: string;
  novoCapitulo: TCapitulo;
  nomeProfileAutor: string;
  usuarioIdLogado: string;
  userId: string;
};

export function aplicarNovoCapituloNasObrasLocais<
  TObra extends ObraParaCriacaoLocal<TCapitulo>,
  TCapitulo extends CapituloParaCriacaoLocal,
>({
  obras,
  obraId,
  novoCapitulo,
  nomeProfileAutor,
  usuarioIdLogado,
  userId,
}: AplicarNovoCapituloNasObrasLocaisParams<TObra, TCapitulo>) {
  return obras.map((obra) => {
    if (obra.id !== obraId) {
      return obra;
    }

    const existente = obra.capitulos.find((capitulo) => capitulo.id === novoCapitulo.id);
    const capituloAtualizado = existente ? {
      ...existente, ...novoCapitulo,
      lido: existente.lido ?? novoCapitulo.lido,
      lidoEm: existente.lidoEm ?? novoCapitulo.lidoEm,
      curtiu: existente.curtiu ?? novoCapitulo.curtiu,
      salvo: existente.salvo ?? novoCapitulo.salvo,
      comentario: existente.comentario ?? novoCapitulo.comentario,
    } : novoCapitulo;
    const capitulosAtualizados = ordenarCapitulosPorOrdem([
      ...obra.capitulos.filter((capitulo) => capitulo.id !== novoCapitulo.id),
      capituloAtualizado,
    ]);

    return {
      ...obra,
      autor: nomeProfileAutor || obra.autor,
      autorId: obra.autorId || usuarioIdLogado || userId,
      capitulos: capitulosAtualizados,
      progressoLeitura: calcularProgressoLeitura(capitulosAtualizados),
    };
  });
}
