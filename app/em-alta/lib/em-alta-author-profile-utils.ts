import type { SupabaseProfileAutorRankingRow } from "./em-alta-models";

export function obterNomeProfileAutorRanking(
  profile?: SupabaseProfileAutorRankingRow | null,
) {
  return typeof profile?.nome === "string" && profile.nome.trim()
    ? profile.nome.trim()
    : "";
}

export function obterAvatarProfileAutorRanking(
  profile?: SupabaseProfileAutorRankingRow | null,
) {
  return typeof profile?.avatar_url === "string"
    ? profile.avatar_url.trim()
    : "";
}

export function adicionarProfileAutorRankingNoMapa(
  mapa: Map<string, SupabaseProfileAutorRankingRow>,
  profile: SupabaseProfileAutorRankingRow,
) {
  const userId =
    typeof profile.user_id === "string" ? profile.user_id.trim() : "";
  const id = typeof profile.id === "string" ? profile.id.trim() : "";

  if (userId) {
    mapa.set(userId, profile);
  }

  if (id) {
    mapa.set(id, profile);
  }
}
