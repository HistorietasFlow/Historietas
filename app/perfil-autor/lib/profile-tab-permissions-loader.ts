import { supabase } from "../../../lib/supabase/client";
import type { PermissoesAbasPerfil } from "../../../lib/historietasPrivacy";

function permissoesConfirmadas(data: unknown): data is PermissoesAbasPerfil {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const registro = data as Record<string, unknown>;
  return ["obras", "sobre", "diario", "comunidade", "biblioteca", "atividades"]
    .every(chave => typeof registro[chave] === "boolean");
}

// Falha ou resposta incompleta não confirmam acesso ao perfil exibido.
export async function carregarPermissoesAbasPerfilConfirmadas(userId: string): Promise<PermissoesAbasPerfil> {
  const { data, error } = await supabase.rpc("carregar_permissoes_abas_perfil", { p_user_id: userId });
  if (error) throw error;
  if (!permissoesConfirmadas(data)) {
    throw new Error("Permissões do perfil não confirmadas.");
  }
  return {
    obras: data.obras, sobre: data.sobre, diario: data.diario,
    comunidade: data.comunidade, biblioteca: data.biblioteca, atividades: data.atividades,
  };
}
