import { dataRegistro } from "./listas-diary-annotation-utils";
import { timestampData } from "./listas-format-utils";
import { obterIdentificadoresObraListas } from "./listas-local-work-utils";

type RegistroGenerico = Record<string, unknown>;

type CapituloListaLike = {
  id: string;
  ordem: number;
};

type ObraListaLike = {
  id: string;
  slug: string;
  link: string;
  publicadaEm: string;
  capitulos: CapituloListaLike[];
};

type ItemPerfilListaLike<
  TObra extends ObraListaLike = ObraListaLike,
  TCategoria extends string = string,
> = {
  chave: string;
  obra: TObra;
  categorias: TCategoria[];
  data: string;
  ultimaLeituraEm?: string;
  nota: number;
  progresso: number;
  capituloAtual: string;
  capituloAtualId: string;
  capitulosLidosIds: string[];
};

export function obterHrefContinuarLeituraListas<
  TObra extends ObraListaLike,
>(
  item: Pick<
    ItemPerfilListaLike<TObra>,
    "obra" | "capitulosLidosIds" | "capituloAtualId"
  >,
) {
  const obra = item.obra;
  const capitulosLidos = new Set(item.capitulosLidosIds);
  const indiceAtual = obra.capitulos.findIndex(
    (capitulo) => capitulo.id === item.capituloAtualId,
  );
  const proximoAposAtual =
    indiceAtual >= 0
      ? obra.capitulos
          .slice(indiceAtual + 1)
          .find((capitulo) => !capitulosLidos.has(capitulo.id))
      : null;
  const capitulo =
    proximoAposAtual ||
    obra.capitulos.find((itemCapitulo) => !capitulosLidos.has(itemCapitulo.id)) ||
    obra.capitulos.find((itemCapitulo) => itemCapitulo.id === item.capituloAtualId) ||
    null;

  if (!capitulo) {
    return obra.link;
  }

  const indice = obra.capitulos.findIndex((itemCapitulo) => itemCapitulo.id === capitulo.id);
  const numero = capitulo.ordem > 0 ? capitulo.ordem : indice + 1;

  return `/obra/${encodeURIComponent(obra.slug)}/capitulo/${Math.max(1, numero)}`;
}

export function criarItemPerfil<
  TCategoria extends string,
  TObra extends ObraListaLike,
  TExtras extends Partial<ItemPerfilListaLike<TObra, TCategoria>> = Partial<
    ItemPerfilListaLike<TObra, TCategoria>
  >,
>(
  categoria: TCategoria,
  obra: TObra,
  registro: RegistroGenerico,
  extras: TExtras = {} as TExtras,
): ItemPerfilListaLike<TObra, TCategoria> & TExtras {
  return {
    chave: `${categoria}-${obra.id}-${dataRegistro(registro) || obra.publicadaEm}`,
    obra,
    categorias: [categoria],
    data: dataRegistro(registro) || obra.publicadaEm,
    nota: 0,
    progresso: 0,
    capituloAtual: "",
    capituloAtualId: "",
    capitulosLidosIds: [],
    ...extras,
  };
}

export function ordenarPorData<
  TObra extends ObraListaLike,
  TCategoria extends string,
  TItem extends ItemPerfilListaLike<TObra, TCategoria>,
>(itens: TItem[]) {
  return [...itens].sort((a, b) => timestampData(b.data) - timestampData(a.data));
}

export function mesclarTudoPerfil<
  TObra extends ObraListaLike,
  TCategoria extends string,
  TItem extends ItemPerfilListaLike<TObra, TCategoria>,
>(fontes: TItem[][]) {
  const mapa = new Map<string, TItem>();

  fontes.flat().forEach((item) => {
    const chave = item.obra.id || item.obra.slug;
    const atual = mapa.get(chave);

    if (!atual) {
      mapa.set(chave, {
        ...item,
        chave: `tudo-${chave}`,
        categorias: Array.from(new Set(item.categorias)),
      } as TItem);
      return;
    }

    const itemMaisRecente = timestampData(item.data) > timestampData(atual.data);

    mapa.set(chave, {
      ...(itemMaisRecente ? item : atual),
      chave: `tudo-${chave}`,
      categorias: Array.from(
        new Set([...atual.categorias, ...item.categorias]),
      ),
      nota: Math.max(atual.nota, item.nota),
      progresso: Math.max(atual.progresso, item.progresso),
      capituloAtual: item.capituloAtual || atual.capituloAtual,
      capituloAtualId: item.capituloAtualId || atual.capituloAtualId,
      capitulosLidosIds: Array.from(
        new Set([...atual.capitulosLidosIds, ...item.capitulosLidosIds]),
      ),
      ultimaLeituraEm:
        timestampData(item.ultimaLeituraEm || "") >
        timestampData(atual.ultimaLeituraEm || "")
          ? item.ultimaLeituraEm
          : atual.ultimaLeituraEm,
    } as TItem);
  });

  return ordenarPorData(Array.from(mapa.values()));
}

export function normalizarIdentificadorColecaoListas(valor: string) {
  return valor.trim().toLowerCase();
}

export function criarMapaObrasPorIdentificadorListas<
  TObra extends Pick<ObraListaLike, "id" | "slug"> & {
    titulo: string;
  },
>(obras: TObra[]) {
  const mapa = new Map<string, TObra>();

  obras.forEach((obra) => {
    obterIdentificadoresObraListas(obra).forEach((identificador) => {
      const chave = normalizarIdentificadorColecaoListas(identificador);

      if (chave && !mapa.has(chave)) {
        mapa.set(chave, obra);
      }
    });
  });

  return mapa;
}

export function encontrarObraColecaoLocalListas<TObra>(
  identificador: string,
  obrasPorIdentificador: Map<string, TObra>,
) {
  return (
    obrasPorIdentificador.get(
      normalizarIdentificadorColecaoListas(identificador),
    ) || null
  );
}

export function mesclarItensLocaisCategoriaPerfil<
  TObra extends ObraListaLike & { titulo: string },
  TCategoria extends string,
  TItem extends ItemPerfilListaLike<TObra, TCategoria>,
>(
  categoria: string,
  itensRemotos: TItem[],
  idsLocais: string[],
  obrasPorIdentificador: Map<string, TObra>,
  obrasExcluidasIds: Set<string> = new Set<string>(),
) {
  const itensPorObra = new Map<string, TItem>();

  itensRemotos.forEach((item) => {
    const chave = item.obra.id || item.obra.slug;

    if (chave) {
      itensPorObra.set(chave, item);
    }
  });

  idsLocais.forEach((identificador) => {
    const obra = encontrarObraColecaoLocalListas(
      identificador,
      obrasPorIdentificador,
    );

    if (!obra || obrasExcluidasIds.has(obra.id)) {
      return;
    }

    const chave = obra.id || obra.slug;

    if (!chave || itensPorObra.has(chave)) {
      return;
    }

    itensPorObra.set(
      chave,
      criarItemPerfil<TCategoria, TObra>(
        categoria as TCategoria,
        obra,
        {
          obra_id: obra.id,
          criado_em: obra.publicadaEm,
          origem_local: true,
        },
      ) as TItem,
    );
  });

  return ordenarPorData(Array.from(itensPorObra.values()));
}
