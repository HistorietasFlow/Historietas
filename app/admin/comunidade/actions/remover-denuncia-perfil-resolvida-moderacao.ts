import { supabase } from "../../../../lib/supabase/client";

type PersistirRemocaoDenunciaPerfilResolvidaModeracaoParams = {
  denunciaId: string;
};

export async function persistirRemocaoDenunciaPerfilResolvidaModeracao({
  denunciaId,
}: PersistirRemocaoDenunciaPerfilResolvidaModeracaoParams) {
  const { data, error } = await supabase
    .from("denuncias_perfis")
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
      "A denúncia de perfil resolvida não foi encontrada ou não pôde ser removida."
    );
  }
}
