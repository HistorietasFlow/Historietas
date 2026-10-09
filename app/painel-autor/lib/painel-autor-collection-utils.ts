import { criarSlugBase, normalizarTexto } from "../../../lib/utils";

type ObraPainelIdentificavel = {
  id: string;
  slug: string;
  titulo: string;
};

export function obterIdentificadoresObraPainel(
  obra: ObraPainelIdentificavel
) {
  return Array.from(
    new Set(
      [
        obra.id,
        obra.slug,
        criarSlugBase(obra.titulo),
        normalizarTexto(obra.titulo),
      ]
        .map((valor) => valor.trim())
        .filter(Boolean)
    )
  );
}

export function colecaoTemObraPainel(
  colecao: string[],
  obra: ObraPainelIdentificavel
) {
  const itens = new Set(
    colecao
      .map((item) => item.trim())
      .filter(Boolean)
  );

  return obterIdentificadoresObraPainel(obra).some((identificador) =>
    itens.has(identificador)
  );
}

export function removerObraDaColecaoPainel(
  colecao: string[],
  obra: ObraPainelIdentificavel
) {
  const identificadoresObra = new Set(obterIdentificadoresObraPainel(obra));

  return colecao.filter((id) => !identificadoresObra.has(id.trim()));
}
