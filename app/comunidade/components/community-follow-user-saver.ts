import {
  deixarDeSeguirUsuario,
  solicitarOuSeguirUsuario,
} from "../../../lib/historietasPrivacy";
import { idSupabaseValidoComunidade } from "./community-supabase-id-validator";
import type { ContextoSeguimentoComunidade } from "./community-user-follow-context";

type ContextoOperacao = Pick<ContextoSeguimentoComunidade, "usuarioId" | "vigente">;

const operacoesPorAlvo = new Map<string, {
  seguidorId: string;
  contexto: ContextoOperacao;
  ativo: boolean;
  resultado: ReturnType<typeof solicitarOuSeguirUsuario>;
}>();

export async function salvarSeguindoUsuarioComunidade(
  seguidorId: string,
  seguidoId: string,
  ativo: boolean,
  contexto: ContextoOperacao
) {
  const seguidorIdLimpo = seguidorId.trim();
  const seguidoIdLimpo = seguidoId.trim();

  if (
    !idSupabaseValidoComunidade(seguidorIdLimpo) ||
    !idSupabaseValidoComunidade(seguidoIdLimpo) ||
    seguidorIdLimpo === seguidoIdLimpo ||
    contexto.usuarioId !== seguidorIdLimpo || !contexto.vigente()
  ) {
    return {
      ok: false,
      estado: "nenhum" as const,
      erro: "Usuário inválido.",
    };
  }

  const pendente = operacoesPorAlvo.get(seguidoIdLimpo);
  if (pendente) {
    // O helper compartilhado agrupa por alvo, sem distinguir contas. Outra
    // conta pode tentar novamente quando a operação anterior tiver terminado.
    if (pendente.seguidorId !== seguidorIdLimpo ||
      pendente.contexto !== contexto || pendente.ativo !== ativo) {
      return {
        ok: false,
        estado: "nenhum" as const,
        erro: "Não foi possível atualizar este usuário agora.",
      };
    }
    return pendente.resultado;
  }

  const operacao = {
    seguidorId: seguidorIdLimpo,
    contexto,
    ativo,
    resultado: ativo
      ? solicitarOuSeguirUsuario(seguidoIdLimpo)
      : deixarDeSeguirUsuario(seguidoIdLimpo),
  };
  operacoesPorAlvo.set(seguidoIdLimpo, operacao);
  try {
    return await operacao.resultado;
  } finally {
    if (operacoesPorAlvo.get(seguidoIdLimpo) === operacao) {
      operacoesPorAlvo.delete(seguidoIdLimpo);
    }
  }
}
