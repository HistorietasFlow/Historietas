import { normalizarTermoBuscaUsuariosComunidade } from "./community-user-search-term-normalizer";

export function deveExibirInstrucaoBuscaUsuariosComunidade(
  termoBusca: string
) {
  return normalizarTermoBuscaUsuariosComunidade(termoBusca).length < 2;
}
