export function deveDesabilitarInteracaoComentarioComunidade(
  podeComentar: boolean,
  comentarioEnviando: boolean
) {
  return !podeComentar || comentarioEnviando;
}

export function envioComentarioEstaAtivoComunidade(
  podeComentar: boolean,
  comentarioEnviando: boolean
) {
  return podeComentar && !comentarioEnviando;
}
