import {
  deixarDeSeguirUsuario,
  solicitarOuSeguirUsuario,
} from "../../../lib/historietasPrivacy";
import { idSupabaseValidoComunidade } from "./community-supabase-id-validator";

export async function salvarSeguindoUsuarioComunidade(
  seguidorId: string,
  seguidoId: string,
  ativo: boolean
) {
  const seguidorIdLimpo = seguidorId.trim();
  const seguidoIdLimpo = seguidoId.trim();

  if (
    !idSupabaseValidoComunidade(seguidorIdLimpo) ||
    !idSupabaseValidoComunidade(seguidoIdLimpo) ||
    seguidorIdLimpo === seguidoIdLimpo
  ) {
    return {
      ok: false,
      estado: "nenhum" as const,
      erro: "Usuário inválido.",
    };
  }

  if (!ativo) {
    return deixarDeSeguirUsuario(seguidoIdLimpo);
  }

  return solicitarOuSeguirUsuario(seguidoIdLimpo);
}
