import { supabase } from "../../../lib/supabase/client";
import { idAutorSupabaseValido } from "./profile-formatters";
import { carregarCurtidasTopFiveLocais } from "./profile-top-five-local-utils";

export async function carregarCurtidasTopFivePerfil(
  perfilUserId: string,
  usuarioId = "",
  operacaoAindaAtual?: () => boolean,
) {
  const estadoLocal = carregarCurtidasTopFiveLocais(perfilUserId, usuarioId);
  const perfilUserIdLimpo = perfilUserId.trim();
  const usuarioIdLimpo = usuarioId.trim();

  if (operacaoAindaAtual && !operacaoAindaAtual()) {
    return estadoLocal;
  }

  if (!idAutorSupabaseValido(perfilUserIdLimpo)) {
    return estadoLocal;
  }

  try {
    const { count, error } = await supabase
      .from("top5_curtidas")
      .select("perfil_user_id", { count: "exact", head: true })
      .eq("perfil_user_id", perfilUserIdLimpo);

    if (operacaoAindaAtual && !operacaoAindaAtual()) {
      return estadoLocal;
    }

    if (error) {
      return estadoLocal;
    }

    let curtiu = estadoLocal.curtiu;

    if (usuarioIdLimpo && idAutorSupabaseValido(usuarioIdLimpo)) {
      if (operacaoAindaAtual && !operacaoAindaAtual()) {
        return estadoLocal;
      }

      const { data: minhaCurtida, error: erroMinhaCurtida } = await supabase
        .from("top5_curtidas")
        .select("perfil_user_id")
        .eq("perfil_user_id", perfilUserIdLimpo)
        .eq("usuario_id", usuarioIdLimpo)
        .limit(1)
        .maybeSingle();

      if (operacaoAindaAtual && !operacaoAindaAtual()) {
        return estadoLocal;
      }

      if (!erroMinhaCurtida) {
        curtiu = estadoLocal.curtiu || Boolean(minhaCurtida);
      }
    }

    return {
      total: Math.max(count ?? 0, estadoLocal.total),
      curtiu,
    };
  } catch {
    return estadoLocal;
  }
}

export async function salvarCurtidaTopFiveSupabase(
  perfilUserId: string,
  usuarioId: string,
  curtir: boolean,
  operacaoAindaAtual?: () => boolean,
) {
  const perfilUserIdLimpo = perfilUserId.trim();
  const usuarioIdLimpo = usuarioId.trim();

  if (
    !idAutorSupabaseValido(perfilUserIdLimpo) ||
    !idAutorSupabaseValido(usuarioIdLimpo)
  ) {
    return false;
  }

  if (operacaoAindaAtual && !operacaoAindaAtual()) {
    return false;
  }

  try {
    const { error: erroDelete } = await supabase
      .from("top5_curtidas")
      .delete()
      .eq("perfil_user_id", perfilUserIdLimpo)
      .eq("usuario_id", usuarioIdLimpo);

    if (operacaoAindaAtual && !operacaoAindaAtual()) {
      return false;
    }

    if (erroDelete) {
      return false;
    }

    if (!curtir) {
      return true;
    }

    const { error: erroInsert } = await supabase
      .from("top5_curtidas")
      .insert({
        perfil_user_id: perfilUserIdLimpo,
        usuario_id: usuarioIdLimpo,
      });

    if (operacaoAindaAtual && !operacaoAindaAtual()) {
      return false;
    }

    return !erroInsert;
  } catch {
    return false;
  }
}
