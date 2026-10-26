import { supabase } from "../../../lib/supabase/client";
import { obterTextoProfileAdicionarCapitulo } from "../lib/adicionar-capitulo-profile-utils";

export async function carregarNomeProfileAdicionarCapitulo(userId: string) {
  const usuarioId = userId.trim();
  if (!usuarioId) return "";
  try { const { data, error } = await supabase.from("profiles").select("id, user_id, nome").eq("user_id", usuarioId).limit(1).maybeSingle(); if (!error && data) { const nome = obterTextoProfileAdicionarCapitulo((data as Record<string, unknown>).nome); if (nome) return nome; } } catch { /* O perfil é complemento social. A criação do capítulo não deve depender dele. */ }
  try { const { data, error } = await supabase.from("profiles").select("id, user_id, nome").eq("id", usuarioId).limit(1).maybeSingle(); if (!error && data) { const nome = obterTextoProfileAdicionarCapitulo((data as Record<string, unknown>).nome); if (nome) return nome; } } catch { /* Compatibilidade com bases onde profiles.id é o próprio auth.users.id. */ }
  return "";
}
