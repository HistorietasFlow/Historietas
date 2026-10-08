export function normalizarModoLista(valor: string | null) {
  return valor === "perfil" || valor === "autores" ? valor : "obras";
}

export function normalizarOrigemPerfil(valor: string | null) {
  return valor === "biblioteca" ? "biblioteca" : "diario";
}

export function normalizarCategoriaPerfil(valor: string | null) {
  return valor === "lendo" ||
    valor === "quero-ler" ||
    valor === "favoritas" ||
    valor === "concluidas" ||
    valor === "avaliacoes" ||
    valor === "historico" ||
    valor === "tudo"
    ? valor
    : "tudo";
}

export function normalizarOrdenacao(valor: string | null) {
  return valor === "titulo" ||
    valor === "avaliacao" ||
    valor === "popularidade"
    ? valor
    : "recentes";
}
