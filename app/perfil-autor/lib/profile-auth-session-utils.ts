import { supabase } from "../../../lib/supabase/client";

export async function usuarioEstaLogado() {
  try {
    const { data } = await supabase.auth.getUser();

    return Boolean(data.user);
  } catch {
    return false;
  }
}
