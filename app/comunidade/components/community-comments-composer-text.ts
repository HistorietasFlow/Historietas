export function obterTextoCampoComentarioComunidade(podeComentar: boolean) {
  return podeComentar ? "Adicionar comentário..." : "Entre para comentar.";
}

export function obterTextoBotaoEnviarComentarioComunidade(
  comentarioEnviando: boolean
) {
  return comentarioEnviando ? "..." : "↑";
}
