import { supabase } from "../../../lib/supabase/client";
import {
  criarPayloadProfileLogin,
  type PerfilExistenteLogin,
} from "../lib/login-profile-payload";

type SincronizarProfileLoginUmaVezParams = {
  userIdLimpo: string;
  nomeFinal: string;
};

export async function sincronizarProfileLoginUmaVez({
  userIdLimpo,
  nomeFinal,
}: SincronizarProfileLoginUmaVezParams) {
  let perfilAtual: PerfilExistenteLogin | null = null;

  const { data: perfilPorUserId, error: erroPorUserId } = await supabase
    .from("profiles_publicos")
    .select("id,user_id,nome,bio,sobre_bio,avatar_url")
    .eq("user_id", userIdLimpo)
    .limit(1)
    .maybeSingle();

  if (!erroPorUserId && perfilPorUserId) {
    perfilAtual = perfilPorUserId as PerfilExistenteLogin;
  }

  let erroPorId: unknown = null;

  if (!perfilAtual) {
    const respostaPorId = await supabase
      .from("profiles_publicos")
      .select("id,user_id,nome,bio,sobre_bio,avatar_url")
      .eq("id", userIdLimpo)
      .limit(1)
      .maybeSingle();

    erroPorId = respostaPorId.error;

    if (!respostaPorId.error && respostaPorId.data) {
      perfilAtual = respostaPorId.data as PerfilExistenteLogin;
    }
  }

  if (!perfilAtual && (erroPorUserId || erroPorId)) {
    throw erroPorUserId || erroPorId;
  }

  const agora = new Date().toISOString();

  const perfilPayload = criarPayloadProfileLogin(
    perfilAtual,
    userIdLimpo,
    nomeFinal,
    agora,
  );

  if (perfilAtual?.id) {
    const { data: perfilAtualizado, error: erroAtualizacao } =
      await supabase
        .from("profiles")
        .update(perfilPayload)
        .eq("id", perfilAtual.id)
        .select("id")
        .maybeSingle();

    if (erroAtualizacao) {
      throw erroAtualizacao;
    }

    if (!perfilAtualizado) {
      throw new Error(
        "O perfil existente não pôde ser atualizado ou não ficou visível após a atualização.",
      );
    }

    return;
  }

  const { data: perfilCriado, error: erroCriacao } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userIdLimpo,
        tipo: "leitor",
        ...perfilPayload,
      },
      {
        onConflict: "id",
        ignoreDuplicates: false,
      },
    )
    .select("id")
    .maybeSingle();

  if (erroCriacao) {
    throw erroCriacao;
  }

  if (!perfilCriado) {
    throw new Error(
      "O perfil não pôde ser criado ou não ficou visível após a criação.",
    );
  }
}

