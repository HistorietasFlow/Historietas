export function normalizarTermoBuscaUsuariosComunidade(termoBusca: string) {
  return termoBusca.trim().replace(/^@+/, "");
}
