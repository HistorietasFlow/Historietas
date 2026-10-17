import { supabase } from "../../../lib/supabase/client";

export async function sincronizarObraUsuarioSupabase(
  tabela: "seguindo_obras" | "favoritos" | "concluidas",
  obraId: string,
  ativo: boolean,
) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;

    if (!userId) {
      return;
    }

    await supabase
      .from(tabela)
      .delete()
      .eq("user_id", userId)
      .eq("obra_id", obraId);

    if (ativo) {
      const visibilidade = tabela === "seguindo_obras" ? "privado" : "parcial";
      const payloadBase = {
        user_id: userId,
        obra_id: obraId,
      };
      const { error: erroComVisibilidade } = await supabase.from(tabela).insert({
        ...payloadBase,
        visibilidade,
      });

      if (!erroComVisibilidade) {
        return;
      }

      const { error: erroSemVisibilidade } = await supabase
        .from(tabela)
        .insert(payloadBase);

      if (erroSemVisibilidade) {
        throw erroSemVisibilidade;
      }
    }
  } catch (error) {
    console.warn(`Não consegui sincronizar ${tabela} no Supabase:`, error);
  }
}
