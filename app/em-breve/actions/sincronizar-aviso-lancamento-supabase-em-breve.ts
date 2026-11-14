import { supabase } from "../../../lib/supabase/client";
import { erroEhRegistroDuplicadoEmBreve } from "../lib/em-breve-error-utils";

export async function sincronizarAvisoLancamentoSupabaseEmBreve(
  userId: string,
  obraId: string,
  ativo: boolean
) {
  const userIdLimpo = userId.trim();
  const obraIdLimpo = obraId.trim();

  if (!userIdLimpo || !obraIdLimpo) {
    return false;
  }

  try {
    if (!ativo) {
      const { error } = await supabase
        .from("seguindo_obras")
        .delete()
        .eq("user_id", userIdLimpo)
        .eq("obra_id", obraIdLimpo);

      if (error) {
        console.warn("Não consegui remover o aviso real do Em breve:", error.message);
        return false;
      }

      return true;
    }

    const { data: registroExistente, error: erroConsulta } = await supabase
      .from("seguindo_obras")
      .select("obra_id")
      .eq("user_id", userIdLimpo)
      .eq("obra_id", obraIdLimpo)
      .limit(1)
      .maybeSingle();

    if (!erroConsulta && registroExistente) {
      return true;
    }

    if (erroConsulta) return false;

    const payloadBase = {
      user_id: userIdLimpo,
      obra_id: obraIdLimpo,
    };

    const { error: erroComVisibilidade } = await supabase
      .from("seguindo_obras")
      .insert({
        ...payloadBase,
        visibilidade: "publico",
      });

    if (!erroComVisibilidade || erroEhRegistroDuplicadoEmBreve(erroComVisibilidade)) {
      return true;
    }

    if (erroComVisibilidade.code !== "42703" &&
      !(erroComVisibilidade.code === "PGRST204" && erroComVisibilidade.message.includes("visibilidade"))) return false;

    const { error: erroSemVisibilidade } = await supabase
      .from("seguindo_obras")
      .insert(payloadBase);

    if (!erroSemVisibilidade || erroEhRegistroDuplicadoEmBreve(erroSemVisibilidade)) {
      return true;
    }

    console.warn(
      "Não consegui ativar o aviso real do Em breve:",
      erroSemVisibilidade.message
    );
    return false;
  } catch (error) {
    console.warn("Não consegui sincronizar aviso real do Em breve:", error);
    return false;
  }
}
