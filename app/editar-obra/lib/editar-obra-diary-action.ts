import { supabase } from "../../../lib/supabase/client";
import { criarSlugBase } from "../../../lib/utils";

type ObraDiarioEdicaoObra = {
  id: string;
  titulo: string;
  formato: string;
  genero: string;
  link: string;
  slug: string;
};

export async function registrarDiarioEdicaoObra({
  userId,
  obra,
  visibilidade,
  atualizadoEm,
}: {
  userId: string;
  obra: ObraDiarioEdicaoObra;
  visibilidade: "publico" | "privado";
  atualizadoEm: string;
}) {
  try {
    const payload = {
      user_id: userId,
      tipo: "editou_obra",
      obra_id: obra.id,
      texto: "",
      visibilidade,
      metadata: {
        obra_titulo: obra.titulo,
        titulo_obra: obra.titulo,
        formato: obra.formato,
        genero: obra.genero,
        href: obra.link || `/obra/${obra.slug || criarSlugBase(obra.titulo)}`,
      },
      criado_em: atualizadoEm,
      atualizado_em: atualizadoEm,
    };

    const { error } = await supabase.from("diario_atividades").insert(payload);

    if (!error) {
      return;
    }

    await supabase.from("diario_atividades").insert({
      user_id: userId,
      tipo: "editou_obra",
      obra_id: obra.id,
      texto: "",
      visibilidade,
      criado_em: atualizadoEm,
    });
  } catch (error) {
    console.warn("Não consegui registrar a edição da obra no Diário:", error);
  }
}
