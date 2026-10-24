import { supabase } from "../../../lib/supabase/client";

export async function removerReferenciasSupabaseObraExcluidaPainel(
  userId: string,
  obraId: string,
  capituloIds: string[]
) {
  const usuarioId = userId.trim();
  const obraIdLimpo = obraId.trim();
  const capitulosValidos = capituloIds.map((id) => id.trim()).filter(Boolean);

  if (!usuarioId || !obraIdLimpo) {
    return;
  }

  try {
    await Promise.allSettled([
      supabase.from("favoritos").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("concluidas").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("seguindo_obras").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("obra_curtidas").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("obra_avaliacoes").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("progresso_leitura").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("diario_atividades").delete().eq("user_id", usuarioId).eq("obra_id", obraIdLimpo),
      supabase.from("comentarios_obras").delete().eq("obra_id", obraIdLimpo),
    ]);

    if (capitulosValidos.length > 0) {
      await Promise.allSettled([
        supabase.from("curtidas_capitulos").delete().eq("user_id", usuarioId).in("capitulo_id", capitulosValidos),
        supabase.from("salvos_capitulos").delete().eq("user_id", usuarioId).in("capitulo_id", capitulosValidos),
        supabase.from("comentarios_capitulos").delete().eq("user_id", usuarioId).in("capitulo_id", capitulosValidos),
      ]);
    }
  } catch {
    // A exclusão principal da obra continua mesmo se a limpeza social falhar.
  }
}
