import { supabase } from "../../../../lib/supabase/client";
import type { TipoAlvoDenuncia } from "../lib/admin-comunidade-report-label-utils";

type RemoverConteudoDenunciadoModeracaoParams = {
  alvoTipo: TipoAlvoDenuncia;
  alvoId: string;
  observacaoFinal: string;
};

export async function removerConteudoDenunciadoModeracao({
  alvoTipo,
  alvoId,
  observacaoFinal,
}: RemoverConteudoDenunciadoModeracaoParams) {
  const { error: erroRemocaoTransacional } = await supabase.rpc(
    "remover_conteudo_denunciado_transacional",
    {
      p_alvo_tipo: alvoTipo,
      p_alvo_id: alvoId,
      p_observacao_admin: observacaoFinal.slice(0, 800),
    }
  );

  if (erroRemocaoTransacional) {
    throw erroRemocaoTransacional;
  }
}
