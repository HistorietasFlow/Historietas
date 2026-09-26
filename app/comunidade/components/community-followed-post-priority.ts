import type { PostComunidade } from "./community-post-model";
import type { AbaFeedComunidade } from "./community-feed-tab";
import type { OrdenacaoComunidade } from "./community-sort-order";

export function obterPrioridadeAutorSeguidoComunidade(
  post: PostComunidade,
  usuariosSeguidosIds: string[]
) {
  return usuariosSeguidosIds.includes(post.autorId) ? 1 : 0;
}

export function compararPrioridadesAutoresSeguidosComunidade(
  seguindoA: number,
  seguindoB: number
) {
  return seguindoB - seguindoA;
}

export function devePriorizarAutoresSeguidosComunidade(
  abaFeedAtiva: AbaFeedComunidade,
  ordenacaoAtiva: OrdenacaoComunidade
) {
  return abaFeedAtiva === "Para você" && ordenacaoAtiva === "Recentes";
}
