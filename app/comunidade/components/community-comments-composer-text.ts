export function obterTextoCampoComentarioComunidade(podeComentar: boolean) {
  return podeComentar ? "Adicionar comentário..." : "Entre para comentar.";
}

export function obterTextoBotaoEnviarComentarioComunidade(
  comentarioEnviando: boolean
) {
  return comentarioEnviando ? "..." : "↑";
}

export function obterAriaLabelMencaoComentarioComunidade() {
  return "Adicionar menção";
}

export function obterAriaLabelEnvioComentarioComunidade() {
  return "Enviar comentário";
}
