import { supabase } from "../../../../lib/supabase/client";

export type ReincidenciaModeracaoRow = {
  user_id: string | null;
  total_denuncias: number | string | null;
};

export async function buscarReincidenciasModeracao() {
  const { data, error } = await supabase.rpc(
    "listar_reincidencias_moderacao"
  );

  if (error) {
    throw error;
  }

  const proximoMapa: Record<string, number> = {};

  ((data || []) as unknown as ReincidenciaModeracaoRow[]).forEach((item) => {
    const userId = typeof item.user_id === "string" ? item.user_id.trim() : "";
    const total = Number(item.total_denuncias || 0);

    if (userId && Number.isFinite(total) && total > 0) {
      proximoMapa[userId] = total;
    }
  });

  return proximoMapa;
}
