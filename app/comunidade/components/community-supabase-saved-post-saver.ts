import { supabase } from "../../../lib/supabase/client";
import { erroTabelaOpcionalComunidadeIgnoravel } from "./community-supabase-optional-table-error-check";

export async function salvarPostSalvoSupabaseComunidade(
  userId: string,
  postId: string,
  ativo: boolean
) {
  const userIdLimpo = userId.trim();
  const postIdLimpo = postId.trim();

  if (!userIdLimpo || !postIdLimpo) {
    return false;
  }

  const tabelas = ["comunidade_salvos", "comunidade_post_salvos"] as const;

  for (const tabela of tabelas) {
    try {
      const { error: erroDelete } = await supabase
        .from(tabela)
        .delete()
        .eq("user_id", userIdLimpo)
        .eq("post_id", postIdLimpo);

      if (erroDelete) {
        if (erroTabelaOpcionalComunidadeIgnoravel(erroDelete)) {
          continue;
        }

        return false;
      }

      if (!ativo) {
        return true;
      }

      const { error: erroInsert } = await supabase.from(tabela).insert({
        user_id: userIdLimpo,
        usuario_id: userIdLimpo,
        post_id: postIdLimpo,
      });

      if (!erroInsert) {
        return true;
      }

      if (!erroTabelaOpcionalComunidadeIgnoravel(erroInsert)) {
        return false;
      }
    } catch {
      continue;
    }
  }

  return false;
}
