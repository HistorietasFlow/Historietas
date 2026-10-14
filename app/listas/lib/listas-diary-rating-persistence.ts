import { supabase } from "../../../lib/supabase/client";

export async function salvarAvaliacaoDiarioListasPersistida(
  perfilUserId: string,
  nota: number,
) {
  const nomeRpc =
    nota > 0 ? "salvar_avaliacao_diario" : "remover_avaliacao_diario";
  const parametros =
    nota > 0
      ? { p_diario_user_id: perfilUserId, p_nota: nota }
      : { p_diario_user_id: perfilUserId };
  const { data, error } = await supabase.rpc(nomeRpc, parametros);
  if (error) throw error;
  return data;
}
