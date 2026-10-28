import { criarSlugBase, normalizarTexto } from "../../../lib/utils";
import type { ObraEmBreveCard } from "./em-breve-work-normalizers";

export function normalizarListaIdsEmBreve(valor: unknown) {
  return Array.isArray(valor)
    ? Array.from(
        new Set(
          valor
            .filter((id): id is string => typeof id === "string")
            .map((id) => id.trim())
            .filter(Boolean)
        )
      )
    : [];
}

export function obterIdentificadoresObraEmBreve(
  obra: Pick<ObraEmBreveCard, "id" | "slug" | "titulo">
) {
  return Array.from(
    new Set(
      [obra.id, obra.slug, criarSlugBase(obra.titulo), normalizarTexto(obra.titulo)]
        .map((id) => id.trim())
        .filter(Boolean)
    )
  );
}

export function listaTemObraEmBreve(
  obra: Pick<ObraEmBreveCard, "id" | "slug" | "titulo">,
  lista: string[]
) {
  const listaNormalizada = new Set(normalizarListaIdsEmBreve(lista));

  return obterIdentificadoresObraEmBreve(obra).some((id) =>
    listaNormalizada.has(id)
  );
}
