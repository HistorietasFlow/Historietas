import { supabase } from "../../../../lib/supabase/client";

export async function verificarAcessoModeracao() {
  const { data: usuarioResposta, error: usuarioErro } =
    await supabase.auth.getUser();

  if (usuarioErro) {
    throw usuarioErro;
  }

  const user = usuarioResposta.user || null;

  if (!user) {
    return {
      user: null,
      adminConfirmado: false,
    };
  }

  const { data: adminResposta, error: adminErro } =
    await supabase.rpc("usuario_e_admin");

  if (adminErro) {
    throw adminErro;
  }

  const adminConfirmado = adminResposta === true;

  return {
    user,
    adminConfirmado,
  };
}
