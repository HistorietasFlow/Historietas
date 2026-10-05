import { supabase } from "../../../../lib/supabase/client";
import type { TablesInsert } from "../../../../lib/supabase/database.types";
import { idObraSupabaseValido } from "../../../../lib/utils";

export async function salvarRegistroObraPublicaSupabase(
  tabela: "favoritos" | "concluidas",
  userId: string,
  obraId: string,
  ativo: boolean
) {
  if (!userId || !obraId || !idObraSupabaseValido(obraId)) {
    return;
  }

  if (!ativo) {
    const { error: erroDelete } = await supabase
      .from(tabela)
      .delete()
      .eq("user_id", userId)
      .eq("obra_id", obraId);

    if (erroDelete) {
      throw erroDelete;
    }

    return;
  }

  const { error: erroUpsert } = await supabase.from(tabela).upsert(
    {
      user_id: userId,
      obra_id: obraId,
      visibilidade: "publico",
    },
    {
      onConflict: "user_id,obra_id",
      ignoreDuplicates: true,
    },
  );

  if (erroUpsert) {
    throw erroUpsert;
  }
}

export async function salvarCurtidaObraPublicaSupabase(
  userId: string,
  obraId: string,
  ativo: boolean,
  execucaoAtual: () => boolean = () => true,
) {
  if (
    !userId ||
    !obraId ||
    !idObraSupabaseValido(obraId) ||
    !execucaoAtual()
  ) {
    return;
  }

  if (!ativo) {
    const { error: erroDelete } = await supabase
      .from("obra_curtidas")
      .delete()
      .eq("obra_id", obraId)
      .eq("user_id", userId);

    if (erroDelete) {
      throw erroDelete;
    }

    return;
  }

  const tentativas: Array<TablesInsert<"obra_curtidas">> = [
    {
      obra_id: obraId,
      user_id: userId,
      visibilidade: "publico",
    },
    {
      obra_id: obraId,
      user_id: userId,
    },
  ];

  let ultimoErro: unknown = null;

  for (const payload of tentativas) {
    if (!execucaoAtual()) {
      return;
    }

    const { error } = await supabase.from("obra_curtidas").upsert(payload, {
      onConflict: "user_id,obra_id",
      ignoreDuplicates: true,
    });

    if (!error) {
      return;
    }

    ultimoErro = error;
  }

  throw ultimoErro || new Error("Não foi possível salvar a curtida da obra.");
}
