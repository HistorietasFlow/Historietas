import { supabase } from "../../../../lib/supabase/client";

type ComentarioDiarioParaContexto = {
  anotacao_id: string;
};

type BuscarAnotacoesDiarioContextoModeracaoParams = {
  diarioAnotacaoIds: string[];
  comentariosDiario: ComentarioDiarioParaContexto[];
};

export async function buscarAnotacoesDiarioContextoModeracao({
  diarioAnotacaoIds,
  comentariosDiario,
}: BuscarAnotacoesDiarioContextoModeracaoParams) {
  const diarioAnotacaoIdsContexto = Array.from(
    new Set([
      ...diarioAnotacaoIds,
      ...comentariosDiario
        .map((comentario) => comentario.anotacao_id)
        .filter(Boolean),
    ])
  );

  if (diarioAnotacaoIdsContexto.length === 0) {
    return [];
  }

  const {
    data: diarioAnotacoesResposta,
    error: diarioAnotacoesErro,
  } = await supabase
    .from("diario_anotacoes")
    .select(
      "id, obra_id, user_id, tipo, texto, visibilidade, contem_spoiler, criado_em, atualizado_em"
    )
    .in("id", diarioAnotacaoIdsContexto)
    .limit(500);

  return diarioAnotacoesErro
    ? []
    : (diarioAnotacoesResposta || []);
}
