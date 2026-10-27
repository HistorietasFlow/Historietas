import { supabase } from "../../../../lib/supabase/client";
import type { StatusDenunciaPerfil } from "../lib/admin-comunidade-status-utils";

type PersistirStatusDenunciaPerfilModeracaoParams = {
  denunciaId: string;
  novoStatus: StatusDenunciaPerfil;
  atualizadoEm: string;
};

export async function persistirStatusDenunciaPerfilModeracao({
  denunciaId,
  novoStatus,
  atualizadoEm,
}: PersistirStatusDenunciaPerfilModeracaoParams) {
  const { data, error } = await supabase
    .from("denuncias_perfis")
    .update({
      status: novoStatus,
      atualizado_em: atualizadoEm,
    })
    .eq("id", denunciaId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error(
      "A denúncia de perfil não foi encontrada ou não pôde ser atualizada."
    );
  }
}
