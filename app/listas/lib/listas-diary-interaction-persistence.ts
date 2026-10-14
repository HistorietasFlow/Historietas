import { supabase } from "../../../lib/supabase/client";

export async function removerCurtidaAnotacaoListas(
  anotacaoId: string,
  userId: string,
) {
  const { error } = await supabase
    .from("diario_anotacao_curtidas")
    .delete()
    .eq("anotacao_id", anotacaoId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function adicionarCurtidaAnotacaoListas(
  anotacaoId: string,
  userId: string,
) {
  const { error } = await supabase
    .from("diario_anotacao_curtidas")
    .insert({ anotacao_id: anotacaoId, user_id: userId });

  if (error) throw error;
}

export async function removerCurtidaComentarioAnotacaoListas(
  comentarioId: string,
  userId: string,
) {
  const { error } = await supabase
    .from("diario_comentario_curtidas")
    .delete()
    .eq("comentario_id", comentarioId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function adicionarCurtidaComentarioAnotacaoListas(
  comentarioId: string,
  userId: string,
) {
  const { error } = await supabase
    .from("diario_comentario_curtidas")
    .insert({ comentario_id: comentarioId, user_id: userId });

  if (error) throw error;
}

export async function inserirComentarioAnotacaoListas({
  anotacaoId,
  userId,
  texto,
  parentId,
}: {
  anotacaoId: string;
  userId: string;
  texto: string;
  parentId: string;
}) {
  const { data, error } = await supabase
    .from("diario_anotacao_comentarios")
    .insert({
      anotacao_id: anotacaoId,
      user_id: userId,
      texto,
      parent_id: parentId || null,
    })
    .select("id,anotacao_id,user_id,texto,parent_id,criado_em,atualizado_em")
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function removerComentarioAnotacaoListas(
  comentarioId: string,
  usuarioAtualId: string,
) {
  const { error } = await supabase
    .from("diario_anotacao_comentarios")
    .delete()
    .eq("id", comentarioId)
    .eq("user_id", usuarioAtualId);

  if (error) throw error;
}
