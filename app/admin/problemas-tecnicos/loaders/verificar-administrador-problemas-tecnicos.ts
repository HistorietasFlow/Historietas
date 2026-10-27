import { supabase } from "../../../../lib/supabase/client";

export async function verificarAdministradorProblemasTecnicos() {
  const { data: respostaPrincipal, error: erroPrincipal } =
    await supabase.rpc("usuario_e_admin");

  if (!erroPrincipal) {
    return respostaPrincipal === true;
  }

  const { data: respostaSuporte, error: erroSuporte } =
    await supabase.rpc("suporte_usuario_e_admin");

  if (erroSuporte) {
    throw erroPrincipal;
  }

  return respostaSuporte === true;
}
