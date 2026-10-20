import { supabase } from "../../../lib/supabase/client";
import { pegarTexto } from "./notificacoes-data-normalizers";
import type { NotificacaoLocal } from "./notificacoes-models";

type EstadoSupabaseNotificacoes = {
  userId: string;
  obrasSeguidasIds: string[];
  notificacoesLidasIds: string[];
  notificacoesDiretas: NotificacaoLocal[];
};

async function carregarObrasSeguidasUsuario(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("seguindo_obras")
      .select("obra_id")
      .eq("user_id", userId)
      .limit(1000);

    if (error || !Array.isArray(data)) {
      return [];
    }

    return Array.from(
      new Set(data.map(({ obra_id }) => obra_id.trim()).filter(Boolean)),
    );
  } catch {
    return [];
  }
}

async function carregarNotificacoesLidasSupabase(userId: string): Promise<string[]> {
  const userIdLimpo = userId.trim();

  if (!userIdLimpo) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("notificacoes")
      .select("*")
      .eq("user_id", userIdLimpo)
      .eq("lida", true)
      .limit(2000);

    if (error || !Array.isArray(data)) {
      return [];
    }

    const ids = new Set<string>();

    data.forEach((item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return;
      }

      const registro = item as Record<string, unknown>;
      const metadata =
        registro.metadata &&
        typeof registro.metadata === "object" &&
        !Array.isArray(registro.metadata)
          ? (registro.metadata as Record<string, unknown>)
          : {};
      const id =
        pegarTexto(registro.notificacao_id) ||
        pegarTexto(metadata.notificacao_id) ||
        pegarTexto(registro.id);

      if (id) {
        ids.add(id);
      }
    });

    return Array.from(ids);
  } catch {
    return [];
  }
}

export async function carregarEstadoSupabaseNotificacoes(
  carregarNotificacoesDiretasSupabase: (
    userId: string
  ) => Promise<NotificacaoLocal[]>
): Promise<EstadoSupabaseNotificacoes | null> {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";

    if (!userId) {
      return null;
    }

    const [
      obrasSeguidasIds,
      notificacoesLidasIds,
      notificacoesDiretas,
    ] = await Promise.all([
      carregarObrasSeguidasUsuario(userId),
      carregarNotificacoesLidasSupabase(userId),
      carregarNotificacoesDiretasSupabase(userId),
    ]);

    return {
      userId,
      obrasSeguidasIds,
      notificacoesLidasIds,
      notificacoesDiretas,
    };
  } catch {
    return null;
  }
}
