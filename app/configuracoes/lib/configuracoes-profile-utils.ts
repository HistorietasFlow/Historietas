import { normalizarUsernameConfiguracoes, pegarTexto } from "./configuracoes-account-utils";
import type { PerfilConfiguracoesSupabase } from "./configuracoes-account-models";

export function normalizarPerfilConfiguracoesSupabase(
  perfil: Record<string, unknown>,
): PerfilConfiguracoesSupabase {
  return {
    nome: pegarTexto(perfil.nome),
    username: normalizarUsernameConfiguracoes(pegarTexto(perfil.username)),
  };
}
