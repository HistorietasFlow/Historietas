import { supabase } from "../../../../lib/supabase/client";
import { pegarTexto } from "./top5-work-normalizers";

export async function carregarNomePerfilTop5(
  userId: string,
  nomeAtual: string,
) {
  const { data: perfilAtual, error: erroPerfilAtual } = await supabase
    .from("profiles")
    .select("nome")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!erroPerfilAtual) {
    return pegarTexto(perfilAtual?.nome) || nomeAtual;
  }

  return nomeAtual;
}
