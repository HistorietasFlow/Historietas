import { supabase } from "../../../lib/supabase/client";

type ResultadoSincronizacaoCurtidaComentarioSupabaseComunidade =
  | { sucesso: true }
  | { sucesso: false; etapa: "remocao"; erro: unknown }
  | { sucesso: false; etapa: "insercao"; erro: unknown };

export async function sincronizarCurtidaComentarioSupabaseComunidade(
  comentarioId: string,
  usuarioId: string,
  jaCurtiu: boolean
): Promise<ResultadoSincronizacaoCurtidaComentarioSupabaseComunidade> {
  const { error: erroRemocao } = await supabase
    .from("comunidade_comentario_curtidas")
    .delete()
    .eq("comentario_id", comentarioId)
    .eq("usuario_id", usuarioId);

  if (erroRemocao) {
    return { sucesso: false, etapa: "remocao", erro: erroRemocao };
  }

  if (!jaCurtiu) {
    const { error: erroInsercao } = await supabase
      .from("comunidade_comentario_curtidas")
      .insert({
        comentario_id: comentarioId,
        usuario_id: usuarioId,
      });

    if (erroInsercao) {
      return { sucesso: false, etapa: "insercao", erro: erroInsercao };
    }
  }

  return { sucesso: true };
}
