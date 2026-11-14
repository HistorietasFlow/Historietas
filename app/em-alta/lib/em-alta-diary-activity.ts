import { supabase } from "../../../lib/supabase/client";
import { idObraSupabaseValido } from "../../../lib/utils";
import type { ObraRanking } from "./em-alta-models";

export async function registrarColecaoRankingNoDiario(
  tipo: "favoritou_obra" | "concluiu_obra",
  obra: Pick<ObraRanking, "storageId" | "titulo"> | null,
  userIdEsperado?: string,
  execucaoEstaAtual: () => boolean = () => true,
) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id || "";
    const obraId = obra?.storageId?.trim() || "";

    if (!execucaoEstaAtual() || (userIdEsperado && userId !== userIdEsperado) || !userId || !obraId || !idObraSupabaseValido(obraId)) {
      return;
    }

    const payload = {
      user_id: userId,
      obra_id: obraId,
      tipo,
      texto:
        tipo === "favoritou_obra"
          ? `adicionou ${obra?.titulo || "uma obra"} à lista`
          : `concluiu ${obra?.titulo || "uma obra"}`,
      visibilidade: "parcial",
      metadata: {
        obra_titulo: obra?.titulo || "",
        origem: "em-alta",
      },
    };

    const { error } = await supabase.from("diario_atividades").insert(payload);

    if (error && ["PGRST204", "42703"].includes(error.code) && error.message.includes("visibilidade") && execucaoEstaAtual()) {
      await supabase.from("diario_atividades").insert({
        user_id: payload.user_id,
        obra_id: payload.obra_id,
        tipo: payload.tipo,
        texto: payload.texto,
        metadata: payload.metadata,
      });
    }
  } catch {
    // O ranking não deve falhar por causa do Diário.
  }
}
