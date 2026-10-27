import { supabase } from "../../../../lib/supabase/client";

type PersistirArquivamentoDenunciaModeracaoParams = {
  denunciaId: string;
};

export async function persistirArquivamentoDenunciaModeracao({
  denunciaId,
}: PersistirArquivamentoDenunciaModeracaoParams) {
  const { data, error } = await supabase
    .from("comunidade_denuncias")
    .update({ arquivada: true })
    .eq("id", denunciaId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error(
      "A denúncia não foi encontrada ou não pôde ser arquivada."
    );
  }
}
