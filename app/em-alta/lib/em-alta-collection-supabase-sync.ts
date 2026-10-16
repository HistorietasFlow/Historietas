import { supabase } from "../../../lib/supabase/client";
import { idObraSupabaseValido } from "../../../lib/utils";
import type { ObraRanking } from "./em-alta-models";

export async function sincronizarColecaoRankingSupabase(
  tabela: "favoritos" | "concluidas",
  obra: Pick<ObraRanking, "storageId" | "titulo"> | null,
  ativo: boolean,
) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";
    const obraId = obra?.storageId?.trim() || "";

    if (!userId || !obraId || !idObraSupabaseValido(obraId)) {
      return;
    }

    await supabase
      .from(tabela)
      .delete()
      .eq("user_id", userId)
      .eq("obra_id", obraId);

    if (!ativo) {
      return;
    }

    const payloadBase = {
      user_id: userId,
      obra_id: obraId,
    };

    const { error } = await supabase.from(tabela).insert({
      ...payloadBase,
      visibilidade: "parcial",
    });

    if (error) {
      await supabase.from(tabela).insert(payloadBase);
    }
  } catch (error) {
    console.warn(`Não consegui sincronizar ${tabela} pelo Em Alta:`, error);
  }
}
