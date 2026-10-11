import { criarSlugBase } from "../../../lib/utils";
import type {
  DiarioPerfilEstado,
  DiarioPerfilItem,
  DiarioPerfilResumoItem,
  DiarioPerfilSemCarregando,
} from "../types";
import { obterTimestampData } from "./profile-formatters";

export function ordenarItensDiarioPerfil(itens: DiarioPerfilItem[]) {
  return [...itens].sort(
    (itemA, itemB) =>
      obterTimestampData(itemB.data) - obterTimestampData(itemA.data),
  );
}

export function criarChaveMesclaDiarioPerfil(item: DiarioPerfilItem) {
  const obraId = item.obra?.id || "";
  const capituloId = item.obra?.ultimoCapituloLidoId || "";

  return [item.tipo, obraId || item.chave, capituloId].join("::");
}

export function criarChaveCardAtualDiarioPerfil(item: DiarioPerfilItem) {
  const obraId = item.obra?.id?.trim() || "";

  return [item.tipo, obraId || item.chave].join("::");
}

export function mesclarItensDiarioPerfil(
  itensPrincipais: DiarioPerfilItem[],
  itensComplementares: DiarioPerfilItem[],
) {
  const mapa = new Map<string, DiarioPerfilItem>();

  [...itensComplementares, ...itensPrincipais].forEach((item) => {
    mapa.set(criarChaveCardAtualDiarioPerfil(item), item);
  });

  return ordenarItensDiarioPerfil(Array.from(mapa.values()));
}

export function mesclarDiarioPerfilComLocal(
  diarioSupabase: DiarioPerfilSemCarregando,
  diarioLocal: DiarioPerfilSemCarregando,
): DiarioPerfilSemCarregando {
  const lendoAgora = mesclarItensDiarioPerfil(
    diarioSupabase.lendoAgora,
    diarioLocal.lendoAgora,
  );
  const queroLer = mesclarItensDiarioPerfil(
    diarioSupabase.queroLer,
    diarioLocal.queroLer,
  );
  const favoritas = mesclarItensDiarioPerfil(
    diarioSupabase.favoritas,
    diarioLocal.favoritas,
  );
  const concluidas = mesclarItensDiarioPerfil(
    diarioSupabase.concluidas,
    diarioLocal.concluidas,
  );
  const avaliacoes = mesclarItensDiarioPerfil(
    diarioSupabase.avaliacoes,
    diarioLocal.avaliacoes,
  );
  const reviews = mesclarItensDiarioPerfil(
    diarioSupabase.reviews,
    diarioLocal.reviews,
  );
  const atividades = ordenarItensDiarioPerfil(
    Array.from(
      new Map(
        [
          ...lendoAgora,
          ...queroLer,
          ...favoritas,
          ...concluidas,
          ...avaliacoes,
          ...reviews,
          ...diarioSupabase.atividades,
          ...diarioLocal.atividades,
        ].map((item) => [criarChaveMesclaDiarioPerfil(item), item]),
      ).values(),
    ),
  ).slice(0, 8);

  return {
    lendoAgora,
    queroLer,
    favoritas,
    concluidas,
    avaliacoes,
    reviews,
    atividades,
  };
}


export function montarItensDiarioTudoPerfil(
  diarioPerfil: Pick<
    DiarioPerfilEstado,
    | "lendoAgora"
    | "queroLer"
    | "favoritas"
    | "concluidas"
    | "avaliacoes"
    | "reviews"
    | "atividades"
  >,
) {
  const prioridadeTipos: Record<DiarioPerfilItem["tipo"], number> = {
    lendo: 0,
    concluida: 1,
    quero_ler: 2,
    favorita: 3,
    avaliacao: 4,
    review: 5,
    atividade: 6,
  };
  const itens = [
    ...diarioPerfil.lendoAgora,
    ...diarioPerfil.queroLer,
    ...diarioPerfil.favoritas,
    ...diarioPerfil.concluidas,
    ...diarioPerfil.avaliacoes,
    ...diarioPerfil.reviews,
    ...diarioPerfil.atividades,
  ];
  const itensPorObra = new Map<string, DiarioPerfilResumoItem>();

  itens.forEach((item) => {
    const obra = item.obra;

    if (!obra) {
      return;
    }

    const chaveObra = (obra.id || obra.slug || criarSlugBase(obra.titulo))
      .trim()
      .toLowerCase();

    if (!chaveObra) {
      return;
    }

    const existente = itensPorObra.get(chaveObra);

    if (!existente) {
      itensPorObra.set(chaveObra, {
        ...item,
        tipos: [item.tipo],
      });
      return;
    }

    const tipos = Array.from(
      new Set([...existente.tipos, item.tipo]),
    ).sort(
      (tipoA, tipoB) =>
        prioridadeTipos[tipoA] - prioridadeTipos[tipoB],
    );
    const itemMaisRecente =
      obterTimestampData(item.data) > obterTimestampData(existente.data);
    const base = itemMaisRecente ? item : existente;

    itensPorObra.set(chaveObra, {
      ...base,
      tipo: tipos[0] || base.tipo,
      tipos,
    });
  });

  return Array.from(itensPorObra.values()).sort(
    (itemA, itemB) =>
      obterTimestampData(itemB.data) - obterTimestampData(itemA.data),
  );
}
