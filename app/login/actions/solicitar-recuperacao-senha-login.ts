import { supabase } from "../../../lib/supabase/client";

export async function solicitarRecuperacaoSenhaLogin(emailFinal: string) {
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
    "/redefinir-senha",
  )}`;

  const { error } = await supabase.auth.resetPasswordForEmail(
    emailFinal,
    { redirectTo },
  );

  if (error) {
    return { ok: false };
  }

  return { ok: true };
}
