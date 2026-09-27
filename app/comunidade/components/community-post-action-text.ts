import type { PostComunidade } from "./community-post-model";

export function obterTextoBotaoSalvarPostComunidade(
  postSalvando: boolean,
  postSalvo: boolean
): string {
  return postSalvando
    ? "Salvando..."
    : postSalvo
      ? "Remover dos salvos"
      : "Salvar publicação";
}

export function obterTextoBotaoCompartilharPostComunidade(
  postCompartilhando: boolean
): string {
  return postCompartilhando ? "Compartilhando..." : "Compartilhar";
}

export function obterTextoBotaoFixarPostComunidade(
  postFixando: boolean,
  post: PostComunidade
): string {
  return postFixando
    ? "Atualizando..."
    : post.fixado
      ? "Desfixar publicação"
      : "Fixar publicação";
}
