import { criarSlugBase, normalizarTexto } from "../../../lib/utils";
import type { ObraRanking, TipoRanking } from "./em-alta-models";

export function normalizarListaIdsEmAlta(valor: unknown) {
  return Array.isArray(valor)
    ? Array.from(
        new Set(
          valor
            .filter((id): id is string => typeof id === "string")
            .map((id) => id.trim())
            .filter(Boolean),
        ),
      )
    : [];
}

export function obterIdentificadoresRankingObra(
  obra: Pick<ObraRanking, "storageId" | "titulo" | "href">,
) {
  const hrefSlug = obra.href.startsWith("/obra/")
    ? decodeURIComponent(obra.href.replace("/obra/", "").split(/[?#]/)[0] || "")
    : "";

  return Array.from(
    new Set(
      [
        obra.storageId,
        hrefSlug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ]
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  );
}

export function listaTemRankingObra(
  obra: Pick<ObraRanking, "storageId" | "titulo" | "href">,
  lista: string[],
) {
  const listaNormalizada = new Set(
    lista.map((id) => id.trim()).filter(Boolean),
  );

  return obterIdentificadoresRankingObra(obra).some((id) =>
    listaNormalizada.has(id),
  );
}

export function removerRankingObraDaLista(
  obra: Pick<ObraRanking, "storageId" | "titulo" | "href">,
  lista: string[],
) {
  const idsObra = new Set(obterIdentificadoresRankingObra(obra));

  return normalizarListaIdsEmAlta(lista).filter((id) => !idsObra.has(id));
}

export function adicionarRankingObraNaLista(
  obra: Pick<ObraRanking, "storageId" | "titulo" | "href">,
  lista: string[],
) {
  return normalizarListaIdsEmAlta([
    ...removerRankingObraDaLista(obra, lista),
    obra.storageId,
  ]);
}

export function ordenarRanking(lista: ObraRanking[], tipo: TipoRanking) {
  const novaLista = [...lista];

  if (tipo === "geral") {
    return novaLista.sort((obraA, obraB) => obraB.pontuacao - obraA.pontuacao);
  }

  if (tipo === "lidas") {
    return novaLista.sort((obraA, obraB) => obraB.views - obraA.views);
  }

  if (tipo === "curtidas") {
    return novaLista.sort((obraA, obraB) => obraB.curtidas - obraA.curtidas);
  }

  if (tipo === "comentadas") {
    return novaLista.sort(
      (obraA, obraB) => obraB.comentarios - obraA.comentarios,
    );
  }

  if (tipo === "salvas") {
    return novaLista.sort((obraA, obraB) => obraB.salvos - obraA.salvos);
  }

  if (tipo === "recentes") {
    return novaLista.sort(
      (obraA, obraB) => obraB.criadaEmTimestamp - obraA.criadaEmTimestamp,
    );
  }

  if (tipo === "capitulos") {
    return novaLista.sort((obraA, obraB) => obraB.capitulos - obraA.capitulos);
  }

  return novaLista;
}

export function pegarTopRanking(lista: ObraRanking[], tipo: TipoRanking) {
  return ordenarRanking(lista, tipo).slice(0, 5);
}

export function rankingTemInteracaoReal(obra: ObraRanking) {
  return (
    obra.views > 0 ||
    obra.curtidas > 0 ||
    obra.comentarios > 0 ||
    obra.salvos > 0 ||
    obra.avaliacoes > 0 ||
    obra.mediaAvaliacao > 0
  );
}
