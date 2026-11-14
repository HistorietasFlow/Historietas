import { supabase } from "../../../lib/supabase/client";
import { uuidDiarioEdicaoValido, type IntencaoDiarioEdicao } from "../lib/editar-capitulo-save-recovery";

type ResultadoDiario = Exclude<IntencaoDiarioEdicao["estado"], "pendente" | "inelegivel">;
// A indisponibilidade desta etapa nunca autoriza INSERT legado ou novo PATCH.
export async function registrarDiarioEdicaoCapitulo({capituloId, versao}: {capituloId: string; versao: string}): Promise<ResultadoDiario> {
  if (!uuidDiarioEdicaoValido(capituloId) || !uuidDiarioEdicaoValido(versao)) return "conflito";
  try {
    const {data, error, status} = await supabase.rpc("registrar_diario_edicao_capitulo", {p_capitulo_id: capituloId, p_versao: versao});
    if (error) {
      if (["55000", "42883", "PGRST202"].includes(error.code)) return "indisponivel";
      if (["PT409", "42501", "22023"].includes(error.code)) return "conflito";
      return "incerto";
    }
    if (status !== 200) return "incerto";
    // O SDK também retorna data=null para HTTP 200 sem corpo. Não presumir
    // tombstone nem confirmação; a mesma intenção pode ser consultada por RPC.
    if (data === null) return "incerto";
    return uuidDiarioEdicaoValido(data) ? "confirmado" : "incerto";
  } catch {return "incerto";}
}
