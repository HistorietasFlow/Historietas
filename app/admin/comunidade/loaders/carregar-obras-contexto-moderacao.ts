import { supabase } from "../../../../lib/supabase/client";

type CapituloParaContexto = {
  obra_id: string;
};

type ComentarioObraParaContexto = {
  obra_id: string;
};

type AnotacaoDiarioParaContexto = {
  obra_id: string;
};

type BuscarObrasContextoModeracaoParams = {
  obraIdsDenunciadas: string[];
  capitulos: CapituloParaContexto[];
  comentariosObras: ComentarioObraParaContexto[];
  diarioAnotacoes: AnotacaoDiarioParaContexto[];
};

export async function buscarObrasContextoModeracao({
  obraIdsDenunciadas,
  capitulos,
  comentariosObras,
  diarioAnotacoes,
}: BuscarObrasContextoModeracaoParams) {
  const obraIdsContexto = Array.from(
    new Set([
      ...obraIdsDenunciadas,
      ...capitulos.map((capitulo) => capitulo.obra_id).filter(Boolean),
      ...comentariosObras
        .map((comentario) => comentario.obra_id)
        .filter(Boolean),
      ...diarioAnotacoes
        .map((anotacao) => anotacao.obra_id)
        .filter(Boolean),
    ])
  );

  if (obraIdsContexto.length === 0) {
    return [];
  }

  const { data: obrasResposta, error: obrasErro } = await supabase
    .from("obras")
    .select(
      "id, user_id, titulo, autor, slug, link, publicado, criada_em"
    )
    .in("id", obraIdsContexto)
    .limit(500);

  return obrasErro
    ? []
    : (obrasResposta || []);
}
