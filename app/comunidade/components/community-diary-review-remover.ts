import { supabase } from "../../../lib/supabase/client";

export async function removerReviewComunidadeDoDiario({
  userId,
  postId,
}: {
  userId: string;
  postId: string;
}) {
  const userIdLimpo = userId.trim();
  const postIdLimpo = postId.trim();

  if (!userIdLimpo || !postIdLimpo) {
    return false;
  }

  let removeuSemErro = false;

  try {
    const { error: erroContains } = await supabase
      .from("diario_atividades")
      .delete()
      .eq("user_id", userIdLimpo)
      .eq("tipo", "publicou_review")
      .contains("metadata", { post_id: postIdLimpo });

    if (!erroContains) {
      removeuSemErro = true;
    }

    const { error: erroCaminhoJson } = await supabase
      .from("diario_atividades")
      .delete()
      .eq("user_id", userIdLimpo)
      .eq("tipo", "publicou_review")
      .eq("metadata->>post_id", postIdLimpo);

    if (!erroCaminhoJson) {
      removeuSemErro = true;
    }

    if (erroContains && erroCaminhoJson) {
      console.warn(
        "Não consegui remover a review do Diário:",
        erroCaminhoJson.message || erroContains.message
      );
    }
  } catch (error) {
    console.warn("Não consegui acessar o Diário para remover a review:", error);
  }

  return removeuSemErro;
}
