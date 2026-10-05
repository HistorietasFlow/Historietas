import { supabase } from "../../../../lib/supabase/client";
import { idObraSupabaseValido } from "../../../../lib/utils";
import type { DiarioAtividadeObraTipo, DiarioAtividadeObraVisibilidade } from "./obra-activity-utils";
import type { ObraDinamica } from "./obra-data-utils";

export async function removerAtividadeDiarioObra({
  userId,
  obra,
  tipo,
  execucaoAtual = () => true,
}: {
  userId: string;
  obra: ObraDinamica;
  tipo: DiarioAtividadeObraTipo;
  execucaoAtual?: () => boolean;
}) {
  if (
    !userId ||
    !obra.id ||
    !idObraSupabaseValido(obra.id) ||
    !execucaoAtual()
  ) {
    return;
  }

  try {
    const { error } = await supabase
      .from("diario_atividades")
      .delete()
      .eq("user_id", userId)
      .eq("obra_id", obra.id)
      .eq("tipo", tipo);

    if (error) {
      console.warn("Não consegui remover atividade do Diário da obra:", error.message);
    }
  } catch (error) {
    console.warn("Não consegui acessar diario_atividades na obra:", error);
  }
}

export async function registrarAtividadeDiarioObra({
  userId,
  obra,
  tipo,
  nota,
  texto,
  visibilidade,
  execucaoAtual = () => true,
}: {
  userId: string;
  obra: ObraDinamica;
  tipo: DiarioAtividadeObraTipo;
  nota?: number;
  texto?: string;
  visibilidade: DiarioAtividadeObraVisibilidade;
  execucaoAtual?: () => boolean;
}) {
  if (
    !userId ||
    !obra.id ||
    !idObraSupabaseValido(obra.id) ||
    !execucaoAtual()
  ) {
    return;
  }

  const notaNormalizada =
    typeof nota === "number" && Number.isFinite(nota) && nota > 0
      ? Math.round(nota * 2) / 2
      : null;
  const payloadBase = {
    user_id: userId,
    tipo,
    obra_id: obra.id,
    texto: texto?.trim() || null,
    visibilidade,
    metadata: {
      origem: "obra_publica",
      titulo: obra.titulo,
      slug: obra.slug,
      autor: obra.autor,
      genero: obra.genero,
      formato: obra.formato,
    },
  };

  try {
    await removerAtividadeDiarioObra({
      userId,
      obra,
      tipo,
      execucaoAtual,
    });

    if (!execucaoAtual()) {
      return;
    }

    const { error } = await supabase.from("diario_atividades").insert({
      ...payloadBase,
      nota: notaNormalizada,
    });

    if (!error || !execucaoAtual()) {
      return;
    }

    const { error: erroFallback } = await supabase
      .from("diario_atividades")
      .insert(payloadBase);

    if (erroFallback) {
      console.warn("Não consegui registrar atividade do Diário da obra:", erroFallback.message);
    }
  } catch (error) {
    console.warn("Não consegui acessar diario_atividades na obra:", error);
  }
}
