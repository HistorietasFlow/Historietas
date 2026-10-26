import { supabase } from "../../../lib/supabase/client";
export async function sincronizarAutorObraProfileAdicionarCapitulo(obraId: string, userId: string, nomeProfile: string) {
  const obraIdLimpo = obraId.trim(); const usuarioId = userId.trim(); const nomeAutor = nomeProfile.trim();
  if (!obraIdLimpo || !usuarioId || !nomeAutor) return;
  try { await supabase.from("obras").update({ autor: nomeAutor, atualizado_em: new Date().toISOString() }).eq("id", obraIdLimpo).eq("user_id", usuarioId); } catch { /* Se a atualização do nome falhar, o capítulo e o backup local continuam funcionando. */ }
}
