import { supabase } from "../../../../lib/supabase/client";
import type { TablesUpdate } from "../../../../lib/supabase/database.types";

export async function atualizarProblemaTecnicoAdmin({
  id,
  payload,
}: {
  id: string;
  payload: TablesUpdate<"problemas_tecnicos">;
}) {
  return supabase
    .from("problemas_tecnicos")
    .update(payload)
    .eq("id", id)
    .select(
      "id,user_id,email_contato,categoria,titulo,descricao,pagina_url,navegador,dispositivo,status,prioridade,observacao_admin,analisado_por,analisado_em,criado_em,atualizado_em",
    )
    .maybeSingle();
}
