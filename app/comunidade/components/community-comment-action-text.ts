export function obterTextoBotaoResponderComentarioComunidade() {
  return "Responder";
}

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

export function obterAriaLabelCurtidaComentarioComunidade(
  usuarioCurtiuComentario: boolean,
  quantidadeCurtidas: number
) {
  return `${
    usuarioCurtiuComentario
      ? "Remover curtida do comentário"
      : "Curtir comentário"
  }. ${quantidadeCurtidas} ${
    quantidadeCurtidas === 1 ? "curtida" : "curtidas"
  }`;
}
