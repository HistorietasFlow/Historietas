import { createClient } from "@supabase/supabase-js";
import type { SessaoRecuperacao } from "./redefinir-senha-recovery-utils";

export class ContextoRecuperacaoObsoleto extends Error {}

export async function atualizarSenhaNaSessaoRecuperacao(
  sessao: SessaoRecuperacao,
  password: string,
  estaAtual: () => boolean,
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
  // O singleton pode mudar de sessão enquanto o SDK aguarda um lock. Esta
  // instância mantém somente os tokens já verificados, sem cookies/storage.
  const cliente = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await cliente.auth.setSession({
    access_token: sessao.accessToken, refresh_token: sessao.refreshToken,
  });
  if (!estaAtual()) throw new ContextoRecuperacaoObsoleto();
  if (error) throw error;
  if (data.user?.id !== sessao.usuarioId) throw new ContextoRecuperacaoObsoleto();
  return cliente.auth.updateUser({ password });
}
