import { supabase } from "../../../../lib/supabase/client";
import type { StatusDenuncia } from "../lib/admin-comunidade-status-utils";

type PersistirStatusDenunciaModeracaoParams = {
  denunciaId: string;
  novoStatus: StatusDenuncia;
  observacaoAtual: string;
  usuarioId: string;
  analisadoEm: string;
};

export async function persistirStatusDenunciaModeracao({
  denunciaId,
  novoStatus,
  observacaoAtual,
  usuarioId,
  analisadoEm,
}: PersistirStatusDenunciaModeracaoParams) {
  const { data, error } = await supabase
    .from("comunidade_denuncias")
    .update({
      status: novoStatus,
      observacao_admin: observacaoAtual.slice(0, 800),
      analisado_por: usuarioId,
      analisado_em: analisadoEm,
    })
    .eq("id", denunciaId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error(
      "A denúncia não foi encontrada ou não pôde ser atualizada."
    );
  }
}
