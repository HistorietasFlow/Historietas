import { CHAVE_POSTS_SALVOS_COMUNIDADE } from "./community-storage-keys";
import type { CarregarJsonUsuarioComunidade } from "./community-user-json-loader";

export function carregarPostsSalvosLocaisComunidade(
  carregarJsonUsuarioComunidade: CarregarJsonUsuarioComunidade,
  userId?: string
): string[] {
  try {
    const postsSalvosParseados =
      carregarJsonUsuarioComunidade(CHAVE_POSTS_SALVOS_COMUNIDADE, userId) ||
      [];

    if (Array.isArray(postsSalvosParseados)) {
      return postsSalvosParseados.filter(
        (postId): postId is string => typeof postId === "string"
      );
    }

    return [];
  } catch {
    return [];
  }
}
