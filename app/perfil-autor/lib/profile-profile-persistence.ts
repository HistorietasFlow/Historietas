import { supabase } from "../../../lib/supabase/client";
import type { TablesUpdate } from "../../../lib/supabase/database.types";
import { BIO_MAX_LENGTH, SOBRE_BIO_MAX_LENGTH } from "../constants";
import type { PerfilAutorSalvo } from "../types";
import { pegarTexto } from "./data-normalizers";
import {
  idAutorSupabaseValido,
  normalizarUsernamePerfilAutor,
} from "./profile-formatters";

export async function salvarPerfilUsuarioSupabase({
  userId,
  nome,
  perfil,
  username,
}: {
  userId: string;
  nome: string;
  perfil: PerfilAutorSalvo;
  username?: string | null;
}) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || !idAutorSupabaseValido(userIdLimpo)) {
    return { ok: false, erro: "ID de usuário inválido para salvar perfil." };
  }

  const atualizadoEm = new Date().toISOString();
  const avatarRemoto = perfil.avatar.trim();
  const payloadPerfilBase: Record<string, unknown> = {
    nome: nome.trim() || "Usuário",
    // Data URLs pertencem somente ao fallback local. Persisti-las no Postgres
    // duplicaria o arquivo e permitiria consumir a cota do banco por avatar.
    avatar_url:
      avatarRemoto.startsWith("data:") || avatarRemoto.startsWith("blob:")
        ? ""
        : avatarRemoto,
    bio: perfil.bio.slice(0, BIO_MAX_LENGTH),
    sobre_bio: perfil.sobreBio.slice(0, SOBRE_BIO_MAX_LENGTH),
    atualizado_em: atualizadoEm,
  };
  const usernameNormalizado =
    username === undefined
      ? undefined
      : username === null
        ? null
        : normalizarUsernamePerfilAutor(username);

  try {
    let perfilId = "";

    const { data: perfilPorUserId, error: erroUserId } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (erroUserId) {
      throw erroUserId;
    }

    if (
      perfilPorUserId &&
      typeof perfilPorUserId === "object" &&
      !Array.isArray(perfilPorUserId)
    ) {
      perfilId = pegarTexto(
        (perfilPorUserId as Record<string, unknown>).id,
      );
    }

    if (!perfilId) {
      const { data: perfilPorId, error: erroId } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userIdLimpo)
        .limit(1)
        .maybeSingle();

      if (erroId) {
        throw erroId;
      }

      if (
        perfilPorId &&
        typeof perfilPorId === "object" &&
        !Array.isArray(perfilPorId)
      ) {
        perfilId = pegarTexto(
          (perfilPorId as Record<string, unknown>).id,
        );
      }
    }

    const payloadAtualizacao: TablesUpdate<"profiles"> = {
      ...payloadPerfilBase,
    };

    if (usernameNormalizado !== undefined) {
      payloadAtualizacao.username = usernameNormalizado;
    }

    const { error } = perfilId
      ? await supabase
          .from("profiles")
          .update(payloadAtualizacao)
          .eq("id", perfilId)
      : await supabase.from("profiles").insert({
          id: userIdLimpo,
          user_id: userIdLimpo,
          tipo: "leitor",
          ...payloadAtualizacao,
        });

    return {
      ok: !error,
      erro: error?.message || "",
    };
  } catch (error) {
    return {
      ok: false,
      erro:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao salvar perfil.",
    };
  }
}
