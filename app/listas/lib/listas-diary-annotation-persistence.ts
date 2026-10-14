import { supabase } from "../../../lib/supabase/client";

export type RegistroAnotacaoListas = Record<string, unknown>;

type PayloadAnotacaoListas = {
  user_id: string;
  obra_id: string;
  tipo: string;
  texto: string;
  visibilidade: string;
  quem_pode_comentar: string;
  visibilidade_comentarios: string;
  permitir_curtidas: boolean;
  contem_spoiler: boolean;
  atualizado_em: string;
};

export const CAMPOS_ANOTACAO_LISTAS =
  "id,obra_id,tipo,texto,visibilidade,quem_pode_comentar,visibilidade_comentarios,permitir_curtidas,contem_spoiler,atualizado_em";

export async function atualizarRegistroAnotacaoListas(
  id: string,
  userId: string,
  payload: PayloadAnotacaoListas,
) {
  const resposta = await supabase
    .from("diario_anotacoes")
    .update({
      texto: payload.texto,
      visibilidade: payload.visibilidade,
      quem_pode_comentar: payload.quem_pode_comentar,
      visibilidade_comentarios: payload.visibilidade_comentarios,
      permitir_curtidas: payload.permitir_curtidas,
      contem_spoiler: payload.contem_spoiler,
      atualizado_em: payload.atualizado_em,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select(CAMPOS_ANOTACAO_LISTAS)
    .maybeSingle();

  if (resposta.error) {
    throw resposta.error;
  }

  return resposta.data ? (resposta.data as RegistroAnotacaoListas) : null;
}

export async function buscarRegistroAnotacaoExistenteListas(
  userId: string,
  obraId: string,
) {
  const resposta = await supabase
    .from("diario_anotacoes")
    .select(CAMPOS_ANOTACAO_LISTAS)
    .eq("user_id", userId)
    .eq("obra_id", obraId)
    .order("atualizado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (resposta.error) {
    throw resposta.error;
  }

  return resposta.data ? (resposta.data as RegistroAnotacaoListas) : null;
}

export async function inserirRegistroAnotacaoListas(
  payload: PayloadAnotacaoListas,
) {
  const resposta = await supabase
    .from("diario_anotacoes")
    .insert(payload)
    .select(CAMPOS_ANOTACAO_LISTAS)
    .single();

  if (resposta.error || !resposta.data) {
    throw (
      resposta.error || new Error("O banco nao confirmou a anotacao salva.")
    );
  }

  return resposta.data as RegistroAnotacaoListas;
}

export async function removerAnotacoesDuplicadasListas(
  userId: string,
  obraId: string,
  anotacaoId: string,
) {
  const { error: erroDuplicadas } = await supabase
    .from("diario_anotacoes")
    .delete()
    .eq("user_id", userId)
    .eq("obra_id", obraId)
    .neq("id", anotacaoId);

  if (erroDuplicadas) {
    console.warn(
      "Não consegui remover anotações duplicadas:",
      erroDuplicadas.message,
    );
  }
}

export async function removerRegistroAnotacaoListas(
  userId: string,
  obraId: string,
) {
  const { error } = await supabase
    .from("diario_anotacoes")
    .delete()
    .eq("user_id", userId)
    .eq("obra_id", obraId);

  if (error) throw error;
}
