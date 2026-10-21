import { supabase } from "../../../lib/supabase/client";
import {
  idUsuarioSupabaseValido,
  normalizarUsernameConfiguracoes,
  pegarTexto,
} from "./configuracoes-account-utils";

export async function salvarPerfilConfiguracoesSupabase({
  userId,
  nome,
  username,
}: {
  userId: string;
  nome: string;
  username: string;
}) {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo || !idUsuarioSupabaseValido(userIdLimpo)) {
    return { ok: false, erro: "Usuário inválido." };
  }

  const usernameLimpo = normalizarUsernameConfiguracoes(username);
  const nomeLimpo = nome.trim() || "Usuário";
  const atualizadoEm = new Date().toISOString();

  try {
    let perfilId = "";
    let erroBusca = "";

    const { data: perfilPorUserId, error: erroUserId } = await supabase
      .from("profiles")
      .select("id,user_id")
      .eq("user_id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    if (erroUserId) {
      erroBusca = erroUserId.message;
    } else if (perfilPorUserId && typeof perfilPorUserId === "object") {
      perfilId = pegarTexto(
        (perfilPorUserId as Record<string, unknown>).id,
      );
    }

    if (!perfilId) {
      const { data: perfilPorId, error: erroId } = await supabase
        .from("profiles")
        .select("id,user_id")
        .eq("id", userIdLimpo)
        .limit(1)
        .maybeSingle();

      if (erroId) {
        erroBusca = erroBusca || erroId.message;
      } else if (perfilPorId && typeof perfilPorId === "object") {
        perfilId = pegarTexto((perfilPorId as Record<string, unknown>).id);
      }
    }

    const payloadAtualizacao = {
      nome: nomeLimpo,
      username: usernameLimpo || null,
      atualizado_em: atualizadoEm,
    };

    if (perfilId) {
      const { data: perfilAtualizado, error } = await supabase
        .from("profiles")
        .update(payloadAtualizacao)
        .eq("id", perfilId)
        .select("id")
        .maybeSingle();

      if (error) {
        return { ok: false, erro: error.message };
      }

      if (!perfilAtualizado) {
        return {
          ok: false,
          erro: "A atualização do perfil não foi confirmada.",
        };
      }

      return { ok: true, erro: "" };
    }

    if (erroBusca) {
      return { ok: false, erro: erroBusca };
    }

    const { data: perfilCriado, error } = await supabase
      .from("profiles")
      .insert({
        id: userIdLimpo,
        user_id: userIdLimpo,
        tipo: "leitor",
        avatar_url: "",
        bio: "",
        sobre_bio: "",
        ...payloadAtualizacao,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      return { ok: false, erro: error.message };
    }

    if (!perfilCriado) {
      return {
        ok: false,
        erro: "A criação do perfil não foi confirmada.",
      };
    }

    return { ok: true, erro: "" };
  } catch (error) {
    return {
      ok: false,
      erro: error instanceof Error ? error.message : "Erro inesperado.",
    };
  }
}
