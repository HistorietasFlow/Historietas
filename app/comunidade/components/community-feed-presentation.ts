import type { AbaFeedComunidade } from "./community-feed-tab";
import type { PostComunidade } from "./community-post-model";
import type { UsuarioComunidade } from "./community-user";

export function temPostsVisiveisComunidade(
  postsVisiveis: PostComunidade[]
): boolean {
  return postsVisiveis.length > 0;
}

export function deveExibirCarregamentoAdicionalComunidade(
  carregandoFeed: boolean,
  postsVisiveis: PostComunidade[],
  temMaisPostsComunidade: boolean
): boolean {
  return !carregandoFeed && postsVisiveis.length > 0 && temMaisPostsComunidade;
}

export function obterTextoEstadoVazioFeedComunidade(
  abaFeedAtiva: AbaFeedComunidade,
  usuario: UsuarioComunidade | null,
  mostrarApenasSalvos: boolean,
  filtrosAtivos: boolean
): string {
  return abaFeedAtiva === "Seguindo"
    ? usuario
      ? "Nenhuma publicação de pessoas que você segue."
      : "Entre na sua conta para ver publicações de quem você segue."
    : mostrarApenasSalvos
      ? "Nenhuma publicação salva"
      : filtrosAtivos
        ? "Nenhuma publicação encontrada"
        : "Nenhuma publicação ainda";
}
