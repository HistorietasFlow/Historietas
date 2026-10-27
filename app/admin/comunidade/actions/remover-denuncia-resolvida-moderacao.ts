import { supabase } from "../../../../lib/supabase/client";

type PersistirRemocaoDenunciaResolvidaModeracaoParams = {
  denunciaId: string;
};

export async function persistirRemocaoDenunciaResolvidaModeracao({
  denunciaId,
}: PersistirRemocaoDenunciaResolvidaModeracaoParams) {
  const { data, error } = await supabase
    .from("comunidade_denuncias")
    .delete()
    .eq("id", denunciaId)
    .eq("status", "resolvida")
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.id) {
    throw new Error(
      "A denúncia resolvida não foi encontrada ou não pôde ser removida."
    );
  }
}
