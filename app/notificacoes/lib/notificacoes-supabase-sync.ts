import { supabase } from "../../../lib/supabase/client";
import { idObraSupabaseValido } from "../../../lib/utils";
import type { NotificacaoLocal } from "./notificacoes-models";

async function obterUserIdAtualNotificacoes(fallbackUserId = "") {
  const fallbackLimpo = fallbackUserId.trim();

  if (fallbackLimpo && fallbackLimpo !== "anon") {
    return fallbackLimpo;
  }

  try {
    const { data } = await supabase.auth.getUser();

    return data.user?.id || "";
  } catch {
    return "";
  }
}

export async function sincronizarNotificacoesLidasSupabase(
  notificacoesParaSincronizar: NotificacaoLocal[],
  lida: boolean,
  userIdAtual = ""
) {
  const idsNotificacoes = Array.from(
    new Set(
      notificacoesParaSincronizar
        .map((notificacao) => notificacao.id.trim())
        .filter(Boolean)
    )
  );

  if (idsNotificacoes.length === 0) {
    return;
  }

  try {
    const userId = await obterUserIdAtualNotificacoes(userIdAtual);

    if (!userId) {
      return;
    }

    const { error: erroRpc } = await supabase.rpc("marcar_notificacoes_lidas", {
      notificacao_ids: idsNotificacoes,
      novo_estado: lida,
    });

    if (!erroRpc) {
      return;
    }

    const { error: erroPorNotificacaoId } = await supabase
      .from("notificacoes")
      .update({ lida })
      .eq("user_id", userId)
      .in("notificacao_id", idsNotificacoes);

    if (!erroPorNotificacaoId) {
      return;
    }

    const idsUuid = idsNotificacoes.filter((id) =>
      idObraSupabaseValido(id)
    );

    if (idsUuid.length > 0) {
      await supabase
        .from("notificacoes")
        .update({ lida })
        .eq("user_id", userId)
        .in("id", idsUuid);
    }
  } catch {
    // O estado local continua funcionando se a sincronização remota falhar.
  }
}

export async function sincronizarNotificacaoLidaSupabase(
  notificacao: NotificacaoLocal,
  lida: boolean,
  userIdAtual = ""
) {
  await sincronizarNotificacoesLidasSupabase([notificacao], lida, userIdAtual);
}

export async function apagarNotificacoesSupabase(
  notificacoesParaApagar: NotificacaoLocal[],
  userIdAtual = ""
) {
  const ids = Array.from(
    new Set(
      notificacoesParaApagar
        .map((notificacao) => notificacao.id.trim())
        .filter(Boolean)
    )
  );

  if (ids.length === 0) {
    return;
  }

  try {
    const userId = await obterUserIdAtualNotificacoes(userIdAtual);

    if (!userId) {
      return;
    }

    await supabase
      .from("notificacoes")
      .delete()
      .eq("user_id", userId)
      .in("notificacao_id", ids);

    const idsUuid = ids.filter((id) => idObraSupabaseValido(id));

    if (idsUuid.length > 0) {
      await supabase
        .from("notificacoes")
        .delete()
        .eq("user_id", userId)
        .in("id", idsUuid);
    }
  } catch {
    // A remoção local continua funcionando se o Supabase falhar.
  }
}

export async function apagarNotificacaoSupabase(
  notificacao: NotificacaoLocal,
  userIdAtual = ""
) {
  await apagarNotificacoesSupabase([notificacao], userIdAtual);
}

export async function excluirNotificacoesLidasSupabase(userIdAtual = "") {
  try {
    const userId = await obterUserIdAtualNotificacoes(userIdAtual);

    if (!userId) {
      return false;
    }

    const { error } = await supabase.rpc("excluir_notificacoes_lidas");

    return !error;
  } catch {
    return false;
  }
}
