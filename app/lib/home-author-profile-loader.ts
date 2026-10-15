import { supabase } from "../../lib/supabase/client";
import { normalizarPerfilSupabaseHome } from "./home-author-profile-utils";
import type {
  PerfilSupabaseHome,
  PerfilSupabaseHomeRow,
} from "./home-author-profile-utils";
import { salvarPerfisSupabaseHomeNoStorage } from "./home-author-storage-utils";

export async function carregarPerfisSupabaseHome(autorIds: string[], userId = "") {
  const idsUnicos = Array.from(
    new Set(
      autorIds
        .map((autorId) => autorId.trim())
        .filter(Boolean)
    )
  );
  const perfisPorUsuario = new Map<string, PerfilSupabaseHome>();

  if (idsUnicos.length === 0) {
    return perfisPorUsuario;
  }

  const linhas: PerfilSupabaseHomeRow[] = [];

  try {
    const { data, error } = await supabase
      .from("profiles_publicos")
      .select("id, user_id, nome, avatar_url, bio, sobre_bio")
      .in("user_id", idsUnicos)
      .limit(1000);

    if (error) {
      console.warn("Não consegui carregar profiles da Home por user_id:", error.message);
    } else if (Array.isArray(data)) {
      linhas.push(...data);
    }
  } catch (error) {
    console.warn("Não consegui acessar profiles da Home por user_id:", error);
  }

  try {
    const { data, error } = await supabase
      .from("profiles_publicos")
      .select("id, user_id, nome, avatar_url, bio, sobre_bio")
      .in("id", idsUnicos)
      .limit(1000);

    if (error) {
      console.warn("Não consegui carregar profiles da Home por id:", error.message);
    } else if (Array.isArray(data)) {
      linhas.push(...data);
    }
  } catch (error) {
    console.warn("Não consegui acessar profiles da Home por id:", error);
  }

  const perfisNormalizados = linhas
    .map((perfil) => normalizarPerfilSupabaseHome(perfil))
    .filter((perfil): perfil is PerfilSupabaseHome => Boolean(perfil));

  perfisNormalizados.forEach((perfil) => {
    perfisPorUsuario.set(perfil.userId, perfil);
  });

  linhas.forEach((linha) => {
    const perfil = normalizarPerfilSupabaseHome(linha);

    if (!perfil) {
      return;
    }

    [linha.user_id, linha.id].forEach((chave) => {
      const chaveLimpa = chave?.trim() || "";

      if (chaveLimpa) {
        perfisPorUsuario.set(chaveLimpa, perfil);
      }
    });
  });

  salvarPerfisSupabaseHomeNoStorage(perfisNormalizados, userId);

  return perfisPorUsuario;
}
