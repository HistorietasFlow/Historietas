export function obterTituloComentariosComunidade(
  quantidadeComentarios: number
) {
  return quantidadeComentarios === 1
    ? "1 comentário"
    : `${quantidadeComentarios} comentários`;
}
