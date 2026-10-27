import { supabase } from "../../../../lib/supabase/client";

type IdsAlvosPrimariosModeracao = {
  postIds: string[];
  comentarioIds: string[];
  comentarioCapituloIds: string[];
  comentarioObraIds: string[];
  comentarioDiarioIds: string[];
};

export async function buscarAlvosPrimariosModeracao({
  postIds,
  comentarioIds,
  comentarioCapituloIds,
  comentarioObraIds,
  comentarioDiarioIds,
}: IdsAlvosPrimariosModeracao) {
  const [
    postsResposta,
    comentariosResposta,
    comentariosCapitulosResposta,
    comentariosObrasResposta,
    comentariosDiarioResposta,
  ] = await Promise.all([
    postIds.length > 0
      ? supabase.from("comunidade_posts").select(
          "id, autor_nome, categoria, tipo_publicacao, tem_spoiler, texto, obra_relacionada, criado_em"
        ).in("id", postIds).limit(500)
      : Promise.resolve({ data: [], error: null }),
    comentarioIds.length > 0
      ? supabase.from("comunidade_comentarios").select(
          "id, post_id, autor_nome, texto, criado_em"
        ).in("id", comentarioIds).limit(500)
      : Promise.resolve({ data: [], error: null }),
    comentarioCapituloIds.length > 0
      ? supabase.from("comentarios_capitulos").select(
          "id, capitulo_id, user_id, comentario, criado_em"
        ).in("id", comentarioCapituloIds).limit(500)
      : Promise.resolve({ data: [], error: null }),
    comentarioObraIds.length > 0
      ? supabase.from("comentarios_obras").select(
          "id, obra_id, user_id, comentario, criado_em"
        ).in("id", comentarioObraIds).limit(500)
      : Promise.resolve({ data: [], error: null }),
    comentarioDiarioIds.length > 0
      ? supabase.from("diario_anotacao_comentarios").select(
          "id, anotacao_id, user_id, texto, criado_em, atualizado_em"
        ).in("id", comentarioDiarioIds).limit(500)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const posts = postsResposta.error ? [] : postsResposta.data || [];
  const comentarios = comentariosResposta.error
    ? []
    : comentariosResposta.data || [];
  const comentariosCapitulos = comentariosCapitulosResposta.error
    ? []
    : comentariosCapitulosResposta.data || [];
  const comentariosObras = comentariosObrasResposta.error
    ? []
    : comentariosObrasResposta.data || [];
  const comentariosDiario = comentariosDiarioResposta.error
    ? []
    : comentariosDiarioResposta.data || [];

  return {
    posts,
    comentarios,
    comentariosCapitulos,
    comentariosObras,
    comentariosDiario,
  };
}
