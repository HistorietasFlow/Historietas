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

export function removerObraDaListaEmBreve(
  obra: Pick<ObraEmBreveCard, "id" | "slug" | "titulo">,
  lista: string[]
) {
  const idsObra = new Set(obterIdentificadoresObraEmBreve(obra));

  return normalizarListaIdsEmBreve(lista).filter((id) => !idsObra.has(id));
}

export function adicionarObraNaListaEmBreve(
  obra: Pick<ObraEmBreveCard, "id" | "slug" | "titulo">,
  lista: string[]
) {
  const obraId = obra.id.trim();

  return normalizarListaIdsEmBreve([
    ...removerObraDaListaEmBreve(obra, lista),
    ...(obraId ? [obraId] : obterIdentificadoresObraEmBreve(obra)),
  ]);
}

export function normalizarLancamentosSalvosComObrasEmBreve(
  lista: string[],
  obras: ObraEmBreveCard[]
) {
  const obraIdPorIdentificador = new Map<string, string>();

  obras.forEach((obra) => {
    const obraId = obra.id.trim();

    if (!obraId) {
      return;
    }

    obterIdentificadoresObraEmBreve(obra).forEach((identificador) => {
      obraIdPorIdentificador.set(identificador, obraId);
    });
  });

  return normalizarListaIdsEmBreve(
    normalizarListaIdsEmBreve(lista).map(
      (identificador) => obraIdPorIdentificador.get(identificador) || identificador
    )
  );
}
