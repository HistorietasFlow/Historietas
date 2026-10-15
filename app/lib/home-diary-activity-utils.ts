import { supabase } from "../../lib/supabase/client";
import { idObraSupabaseValido } from "../../lib/utils";

type ObraAtividadeDiarioHome = {
  id: string;
  titulo: string;
  slug: string;
  autor: string;
};

export async function registrarAtividadeDiarioHome({
  userId,
  tipo,
  obra,
  texto,
}: {
  userId: string;
  tipo: "favoritou_obra" | "concluiu_obra";
  obra: ObraAtividadeDiarioHome;
  texto: string;
}) {
  if (!userId.trim() || !idObraSupabaseValido(obra.id)) {
    return;
  }

  try {
    await supabase.from("diario_atividades").insert({
      user_id: userId,
      tipo,
      obra_id: obra.id,
      texto: texto.trim() || null,
      visibilidade: "parcial",
      metadata: {
        obra_titulo: obra.titulo,
        obra_slug: obra.slug,
        autor: obra.autor,
        origem: "home",
      },
    });
  } catch {
    // A Home não deve travar se o Diário não registrar a atividade.
  }
}
