import { supabase } from "../../../lib/supabase/client";

export const TABELA_COMENTARIOS_CAPITULOS_CURTIDAS = "comentarios_capitulos_curtidas";

export async function salvarComentarioCapituloSupabase(
  capituloId: string,
  comentario: string,
  comentarioPaiId = ""
): Promise<Record<string, unknown> | null> {
  try {
    const { data: dadosUsuario } = await supabase.auth.getUser();
    const userId = dadosUsuario.user?.id || "";
    const capituloIdLimpo = capituloId.trim();
    const comentarioLimpo = comentario.trim();
    const comentarioPaiIdLimpo = comentarioPaiId.trim();
    const agora = new Date().toISOString();

    if (!userId || !capituloIdLimpo || !comentarioLimpo) {
      return null;
    }

    const payloadBase = {
      user_id: userId,
      capitulo_id: capituloIdLimpo,
      comentario: comentarioLimpo.slice(0, 420),
    };
    const payloadComResposta = {
      ...payloadBase,
      comentario_pai_id: comentarioPaiIdLimpo || null,
    };

    const { data: comentarioComAtualizacao, error: erroComAtualizacao } =
      await supabase
        .from("comentarios_capitulos")
        .insert({
          ...payloadComResposta,
          atualizado_em: agora,
        })
        .select(
          "id,user_id,comentario,comentario_pai_id,atualizado_em,criado_em"
        )
        .single();

    if (!erroComAtualizacao && comentarioComAtualizacao) {
      return comentarioComAtualizacao as Record<string, unknown>;
    }

    const { data: comentarioSemAtualizacao, error: erroSemAtualizacao } =
      await supabase
        .from("comentarios_capitulos")
        .insert(payloadComResposta)
        .select("id,user_id,comentario,comentario_pai_id,criado_em")
        .single();

    if (!erroSemAtualizacao && comentarioSemAtualizacao) {
      return comentarioSemAtualizacao as Record<string, unknown>;
    }

    if (comentarioPaiIdLimpo) {
      throw erroSemAtualizacao || erroComAtualizacao;
    }

    const { data: comentarioLegado, error: erroLegado } = await supabase
      .from("comentarios_capitulos")
      .insert(payloadBase)
      .select("id,user_id,comentario,criado_em")
      .single();

    if (!erroLegado && comentarioLegado) {
      return comentarioLegado as Record<string, unknown>;
    }

    throw erroLegado || erroSemAtualizacao || erroComAtualizacao;
  } catch (error) {
    console.warn("Não consegui salvar comentário do capítulo no Supabase:", error);
    return null;
  }
}
