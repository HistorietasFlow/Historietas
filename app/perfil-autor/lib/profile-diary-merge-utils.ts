import type { DiarioPerfilItem, DiarioPerfilSemCarregando } from "../types";
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
