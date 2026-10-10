import { supabase } from "../../../lib/supabase/client";
import type { NotificacaoSocialPerfilAutorPayload } from "../types";
import { idAutorSupabaseValido } from "./profile-formatters";

export function avisarAtualizacaoNotificacoesPerfilAutor() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("historietas:notificacoes-atualizadas"),
    );
  }
}

export async function removerNotificacoesSociaisPerfilAutor(
  receptorId: string,
  notificacaoIds: string[],
) {
  const receptorIdLimpo = receptorId.trim();
  const idsLimpos = Array.from(
    new Set(
      notificacaoIds
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  );

  if (
    !receptorIdLimpo ||
    !idAutorSupabaseValido(receptorIdLimpo) ||
    idsLimpos.length === 0
  ) {
    return false;
  }

  try {
    const { error } = await supabase
      .from("notificacoes")
      .delete()
      .eq("user_id", receptorIdLimpo)
      .in("notificacao_id", idsLimpos);

    if (error) {
      console.warn(
        "Não consegui remover notificação social antiga:",
        error.message,
      );
      return false;
    }

    avisarAtualizacaoNotificacoesPerfilAutor();
    return true;
  } catch (error) {
    console.warn(
      "Não consegui remover notificação social antiga:",
      error,
    );
    return false;
  }
}

export async function criarNotificacaoSocialPerfilAutor({
  receptorId,
  tipo,
  titulo,
  mensagem,
  link,
  notificacaoId,
}: NotificacaoSocialPerfilAutorPayload) {
  const receptorIdLimpo = receptorId.trim();
  const tipoLimpo = tipo.trim();
  const notificacaoIdLimpo = notificacaoId.trim();

  if (
    !receptorIdLimpo ||
    !idAutorSupabaseValido(receptorIdLimpo) ||
    !tipoLimpo ||
    !notificacaoIdLimpo
  ) {
    return false;
  }

  try {
    const { error } = await supabase.rpc("criar_notificacao_social", {
      p_user_id: receptorIdLimpo,
      p_tipo: tipoLimpo,
      p_titulo: titulo.trim() || "Nova notificação",
      p_mensagem: mensagem.trim() || "Você recebeu uma nova notificação.",
      p_link: link.trim() || "/notificacoes",
      p_notificacao_id: notificacaoIdLimpo,
    });

    if (error) {
      console.warn("Não consegui criar notificação social:", error.message);
      return false;
    }

    avisarAtualizacaoNotificacoesPerfilAutor();
    return true;
  } catch (error) {
    console.warn("Não consegui criar notificação social:", error);
    return false;
  }
}
