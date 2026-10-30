import { DiarySummaryCard } from "../components/diary-summary-card";
import { criarHrefListaDiarioPerfilAutor } from "../lib/profile-diary-item-utils";
import type { DiarioPerfilResumoItem } from "../types";

export function usePerfilAutorDiaryItemRenderer(perfilAutorId: string) {
  const renderizarItemDiarioPerfil = (item: DiarioPerfilResumoItem) => {
    const obra = item.obra;

    if (!obra) {
      return null;
    }

    const hrefLista = criarHrefListaDiarioPerfilAutor(
      perfilAutorId,
      obra.id,
    );

    return (
      <DiarySummaryCard
        key={obra.id || item.chave}
        href={hrefLista}
        obra={obra}
      />
    );
  };

  return { renderizarItemDiarioPerfil };
}
