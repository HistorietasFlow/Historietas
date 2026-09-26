import { normalizarTexto } from "../../../lib/utils";

export function normalizarTermoBuscaUsuariosComunidade(termoBusca: string) {
  return termoBusca.trim().replace(/^@+/, "");
}

export function normalizarTermoComparacaoUsuariosComunidade(
  termoLimpo: string
) {
  return normalizarTexto(termoLimpo);
}
