import { supabase } from "../../../lib/supabase/client";
import { adicionarProfileAutorRankingNoMapa } from "./em-alta-author-profile-utils";
import type { SupabaseProfileAutorRankingRow } from "./em-alta-models";

export async function carregarProfilesAutoresRanking(userIds: string[]) {
  const idsUnicos = Array.from(
    new Set(userIds.map((userId) => userId.trim()).filter(Boolean)),
  );
  const profilesPorUsuario = new Map<string, SupabaseProfileAutorRankingRow>();

  if (idsUnicos.length === 0) {
    return profilesPorUsuario;
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,user_id,nome,avatar_url")
      .in("user_id", idsUnicos)
      .limit(1000);

    if (error) {
      console.warn(
        "Não consegui carregar profiles por user_id no ranking:",
        error.message,
      );
    } else {
      (data || []).forEach(
        (profile) => {
          adicionarProfileAutorRankingNoMapa(profilesPorUsuario, profile);
        },
      );
    }
  } catch (error) {
    console.warn(
      "Não consegui acessar profiles por user_id no ranking:",
      error,
    );
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,user_id,nome,avatar_url")
      .in("id", idsUnicos)
      .limit(1000);

    if (error) {
      console.warn(
        "Não consegui carregar profiles por id no ranking:",
        error.message,
      );
    } else {
      (data || []).forEach(
        (profile) => {
          adicionarProfileAutorRankingNoMapa(profilesPorUsuario, profile);
        },
      );
    }
  } catch (error) {
    console.warn("Não consegui acessar profiles por id no ranking:", error);
  }

  return profilesPorUsuario;
}
