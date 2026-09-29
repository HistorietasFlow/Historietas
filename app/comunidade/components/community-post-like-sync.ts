import { supabase } from "../../../lib/supabase/client";

type ResultadoSincronizacaoCurtidaPostSupabaseComunidade =
  | { sucesso: true }
  | { sucesso: false; etapa: "remocao"; erro: unknown }
  | { sucesso: false; etapa: "insercao"; erro: unknown };

export async function sincronizarCurtidaPostSupabaseComunidade(
  postId: string,
  usuarioId: string,
  jaCurtiu: boolean
): Promise<ResultadoSincronizacaoCurtidaPostSupabaseComunidade> {
  const { error: erroRemocao } = await supabase
    .from("comunidade_curtidas")
    .delete()
    .eq("post_id", postId)
    .eq("usuario_id", usuarioId);

  if (erroRemocao) {
    return { sucesso: false, etapa: "remocao", erro: erroRemocao };
  }

  if (!jaCurtiu) {
    const { error: erroInsercao } = await supabase
      .from("comunidade_curtidas")
      .insert({
        post_id: postId,
        usuario_id: usuarioId,
      });

    if (erroInsercao) {
      return { sucesso: false, etapa: "insercao", erro: erroInsercao };
    }
  }

  return { sucesso: true };
}
