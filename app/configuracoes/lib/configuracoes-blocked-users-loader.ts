import { supabase } from "../../../lib/supabase/client";
import {
  idUsuarioSupabaseValido,
  normalizarUsernameConfiguracoes,
  pegarTexto,
} from "./configuracoes-account-utils";
import type {
  UsuarioBloqueadoConfiguracoes,
  UsuarioBloqueadoConfiguracoesRpcRow,
} from "./configuracoes-account-models";

export async function listarUsuariosBloqueadosConfiguracoes(): Promise<
  UsuarioBloqueadoConfiguracoes[]
> {
  const { data, error } = await supabase.rpc(
    "listar_usuarios_bloqueados",
    { p_limite: 100 },
  );

  if (error) {
    throw error;
  }

  return (data || []).map(
    (item: UsuarioBloqueadoConfiguracoesRpcRow) => ({
      userId: pegarTexto(item.user_id),
      nome: pegarTexto(item.nome, "Usuário"),
      username: normalizarUsernameConfiguracoes(
        pegarTexto(item.username),
      ),
      avatar: pegarTexto(item.avatar_url),
      bloqueadoEm: pegarTexto(item.bloqueado_em),
    }),
  ).filter((item: UsuarioBloqueadoConfiguracoes) => idUsuarioSupabaseValido(item.userId));
}
