import { supabase } from "../../../../lib/supabase/client";

export async function salvarAvaliacaoRemotaObra({
  obraId,
  userId,
  nota,
}: {
  obraId: string;
  userId: string;
  nota: number;
}) {
  if (!obraId.trim() || !userId.trim()) {
    return;
  }

  if (nota <= 0) {
    const { error: erroRemocao } = await supabase
      .from("obra_avaliacoes")
      .delete()
      .eq("obra_id", obraId)
      .eq("user_id", userId);

    if (erroRemocao) {
      throw erroRemocao;
    }

    return;
  }

  const { error: erroSalvar } = await supabase
    .from("obra_avaliacoes")
    .upsert(
      {
        obra_id: obraId,
        user_id: userId,
        nota,
      },
      {
        onConflict: "obra_id,user_id",
      },
    );

  if (erroSalvar) {
    throw erroSalvar;
  }
}
