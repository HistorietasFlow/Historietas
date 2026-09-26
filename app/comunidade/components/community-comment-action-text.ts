export function obterTextoBotaoRemoverComentarioComunidade(
  comentarioRemovendo: boolean
) {
  return comentarioRemovendo ? "Removendo..." : "Remover";
}

export function obterTextoBotaoDenunciarComentarioComunidade(
  comentarioDenunciando: boolean
) {
  return comentarioDenunciando ? "Enviando..." : "Denunciar";
}
