import { supabase } from "../../../lib/supabase/client";
import { idObraSupabaseValido } from "../../../lib/utils";
import {
  normalizarPerfilNotificacao,
  type PerfilNotificacao,
} from "./notificacoes-profile-utils";

export async function carregarPerfisNotificacoes(userIds: string[]) {
  const ids = Array.from(
    new Set(
      userIds
        .map((id) => id.trim())
        .filter((id) => idObraSupabaseValido(id))
    )
  );
  const perfis = new Map<string, PerfilNotificacao>();

  if (ids.length === 0) {
    return perfis;
  }

  const selecoesProfiles = [
    "id,user_id,nome,avatar_url",
    "id,user_id,nome_usuario,avatar_url",
    "id,user_id,username,avatar_url",
    "id,user_id,display_name,avatar_url",
    "id,user_id,apelido,avatar_url",
  ] as const;

  async function carregarPorColuna(
    coluna: "user_id" | "id",
    idsBusca: string[]
  ) {
    if (idsBusca.length === 0) {
      return;
    }

    for (const campos of selecoesProfiles) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(campos)
          .in(coluna, idsBusca)
          .limit(1000);

        if (error || !Array.isArray(data)) {
          continue;
        }

        data.forEach((item) => {
          const row = item as Record<string, unknown>;
          const perfil = normalizarPerfilNotificacao(row, "", "Usuário");

          if (perfil.userId && idObraSupabaseValido(perfil.userId)) {
            perfis.set(perfil.userId, perfil);
          }
        });

        return;
      } catch {
        // Tenta uma seleção menor ou outra coluna.
      }
    }
  }

  await carregarPorColuna("user_id", ids);

  const idsFaltantes = ids.filter((id) => !perfis.has(id));

  await carregarPorColuna("id", idsFaltantes);

  return perfis;
}
