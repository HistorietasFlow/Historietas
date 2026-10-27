import { supabase } from "../../../../lib/supabase/client";

type PersistirRestauracaoDenunciaModeracaoParams = {
  denunciaId: string;
};

export async function persistirRestauracaoDenunciaModeracao({
  denunciaId,
}: PersistirRestauracaoDenunciaModeracaoParams) {
  const { data, error } = await supabase
    .from("comunidade_denuncias")
    .update({ arquivada: false })
    .eq("id", denunciaId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error(
      "A denúncia não foi encontrada ou não pôde ser restaurada."
    );
  }
}
