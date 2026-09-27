export type OrdenacaoComentariosComunidade = "relevantes" | "recentes";

type SelecionarOrdenacaoComentariosComunidadeParams = {
  setOrdenacaoComentarios: (
    ordenacaoComentarios: OrdenacaoComentariosComunidade
  ) => void;
  setMenuOrdenacaoAberto: (menuOrdenacaoAberto: boolean) => void;
};

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

export function selecionarOrdenacaoComentariosRelevantesComunidade({
  setOrdenacaoComentarios,
  setMenuOrdenacaoAberto,
}: SelecionarOrdenacaoComentariosComunidadeParams) {
  setOrdenacaoComentarios("relevantes");
  setMenuOrdenacaoAberto(false);
}

export function selecionarOrdenacaoComentariosRecentesComunidade({
  setOrdenacaoComentarios,
  setMenuOrdenacaoAberto,
}: SelecionarOrdenacaoComentariosComunidadeParams) {
  setOrdenacaoComentarios("recentes");
  setMenuOrdenacaoAberto(false);
}
