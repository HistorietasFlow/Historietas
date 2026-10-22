import { supabase } from "../../../lib/supabase/client";

export async function registrarDiarioPublicacao({
  userId,
  obraId,
  capituloId = null,
  tipo,
  tituloObra,
  tituloCapitulo = "",
  criadaEm,
}: {
  userId: string;
  obraId: string;
  capituloId?: string | null;
  tipo: "publicou_obra" | "publicou_capitulo";
  tituloObra: string;
  tituloCapitulo?: string;
  criadaEm: string;
}) {
  try {
    const payload = {
      user_id: userId,
      tipo,
      obra_id: obraId,
      capitulo_id: capituloId,
      texto: "",
      visibilidade: "publico",
      metadata: {
        obra_titulo: tituloObra,
        titulo_obra: tituloObra,
        capitulo_titulo: tituloCapitulo,
      },
      criado_em: criadaEm,
      atualizado_em: criadaEm,
    };

    const { error } = await supabase.from("diario_atividades").insert(payload);

    if (!error) {
      return;
    }

    await supabase.from("diario_atividades").insert({
      user_id: userId,
      tipo,
      obra_id: obraId,
      capitulo_id: capituloId,
      texto: "",
      visibilidade: "publico",
      criado_em: criadaEm,
    });
  } catch (error) {
    console.warn("Não consegui registrar a publicação no Diário:", error);
  }
}


