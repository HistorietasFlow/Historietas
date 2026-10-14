import { supabase } from "../../../lib/supabase/client";

export async function sincronizarQueroLerListas(
  userId: string,
  obraId: string,
  ativo: boolean,
) {
  try {
    if (!userId.trim() || !obraId.trim()) {
      return;
    }

    const { error: erroDelete } = await supabase
      .from("seguindo_obras")
      .delete()
      .eq("user_id", userId)
      .eq("obra_id", obraId);

    if (erroDelete) {
      throw erroDelete;
    }

    if (!ativo) {
      return;
    }

    const payloadBase = {
      user_id: userId,
      obra_id: obraId,
    };

    const { error: erroComVisibilidade } = await supabase
      .from("seguindo_obras")
      .insert({
        ...payloadBase,
        visibilidade: "publico",
      });

    if (!erroComVisibilidade) {
      return;
    }

    const { error: erroSemVisibilidade } = await supabase
      .from("seguindo_obras")
      .insert(payloadBase);

    if (erroSemVisibilidade) {
      throw erroSemVisibilidade;
    }
  } catch (error) {
    console.warn("Não consegui sincronizar Quero ler na Lista Page:", error);
    // Assim como no perfil, a ação local permanece funcionando.
  }
}
