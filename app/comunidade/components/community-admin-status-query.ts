import { supabase } from "../../../lib/supabase/client";

export async function consultarUsuarioEhAdminComunidade(): Promise<boolean> {
  try {
    const { data: adminData, error: adminError } =
      await supabase.rpc("usuario_e_admin");

    return !adminError && adminData === true;
  } catch {
    return false;
  }
}
