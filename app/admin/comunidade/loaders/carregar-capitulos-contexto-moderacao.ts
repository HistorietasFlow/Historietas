import { supabase } from "../../../../lib/supabase/client";

type ComentarioCapituloParaContexto = {
  capitulo_id: string;
};

type BuscarCapitulosContextoModeracaoParams = {
  capituloIdsDenunciados: string[];
  comentariosCapitulos: ComentarioCapituloParaContexto[];
};

export async function buscarCapitulosContextoModeracao({
  capituloIdsDenunciados,
  comentariosCapitulos,
}: BuscarCapitulosContextoModeracaoParams) {
  const capituloIdsContexto = Array.from(
    new Set([
      ...capituloIdsDenunciados,
      ...comentariosCapitulos
        .map((comentario) => comentario.capitulo_id)
        .filter(Boolean),
    ])
  );

  if (capituloIdsContexto.length === 0) {
    return [];
  }

  const { data: capitulosResposta, error: capitulosErro } = await supabase
    .from("capitulos")
    .select(
      "id, obra_id, user_id, titulo, texto, ordem, publicado, criado_em"
    )
    .in("id", capituloIdsContexto)
    .limit(500);

  return capitulosErro
    ? []
    : (capitulosResposta || []);
}
