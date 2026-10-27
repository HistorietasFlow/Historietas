import { supabase } from "../../../../lib/supabase/client";

export async function buscarProblemasTecnicosAdmin() {
  return supabase
    .from("problemas_tecnicos")
    .select(
      "id,user_id,email_contato,categoria,titulo,descricao,pagina_url,navegador,dispositivo,status,prioridade,observacao_admin,analisado_por,analisado_em,criado_em,atualizado_em",
    )
    .order("criado_em", { ascending: false })
    .limit(300);
}
