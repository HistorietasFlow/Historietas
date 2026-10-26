import { calcularProgressoLeitura } from "./adicionar-capitulo-metrics-utils";
import { ordenarCapitulosPorOrdem } from "./adicionar-capitulo-chapter-order-utils";

type CapituloParaCriacaoLocal = {
  criadoEm: string;
  lido?: boolean;
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

    const capitulosAtualizados = ordenarCapitulosPorOrdem([
      ...obra.capitulos,
      novoCapitulo,
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
