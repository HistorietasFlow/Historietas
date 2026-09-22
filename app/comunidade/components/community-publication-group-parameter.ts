import { normalizarTexto } from "../../../lib/utils";

type GrupoPublicacaoObra = "" | "posts";

export function obterGrupoPublicacaoObraPorParametro(
  valor: string
): GrupoPublicacaoObra {
  return normalizarTexto(valor) === "posts" ? "posts" : "";
}

