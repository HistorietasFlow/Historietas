import { supabase } from "../../../lib/supabase/client";

export async function obterUsuarioAutenticadoComunidadeAtual() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user?.id?.trim()) {
      return null;
    }

    return data.user;
  } catch {
    return null;
  }
}
