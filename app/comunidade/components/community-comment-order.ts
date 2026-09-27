export type OrdenacaoComentariosComunidade = "relevantes" | "recentes";

export function ordenacaoComentariosEhRelevantesComunidade(
  ordenacaoComentarios: OrdenacaoComentariosComunidade
) {
  return ordenacaoComentarios === "relevantes";
}

export function ordenacaoComentariosEhRecentesComunidade(
  ordenacaoComentarios: OrdenacaoComentariosComunidade
) {
  return ordenacaoComentarios === "recentes";
}
