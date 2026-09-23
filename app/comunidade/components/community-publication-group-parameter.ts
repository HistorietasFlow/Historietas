import { normalizarTexto } from "../../../lib/utils";
import type { GrupoPublicacaoObra } from "./community-publication-group";

export function obterGrupoPublicacaoObraPorParametro(
  valor: string
): GrupoPublicacaoObra {
  return normalizarTexto(valor) === "posts" ? "posts" : "";
}
