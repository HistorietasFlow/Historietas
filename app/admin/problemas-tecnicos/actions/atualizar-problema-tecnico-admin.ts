import { supabase } from "../../../../lib/supabase/client";
import type { TablesUpdate } from "../../../../lib/supabase/database.types";

export async function atualizarProblemaTecnicoAdmin({
  id,
  payload,
  usuarioIdEsperado,
  atualizadoEmEsperado,
  execucaoEstaAtual = () => true,
}: {
  id: string;
  usuarioIdEsperado: string;
  atualizadoEmEsperado: string;
  execucaoEstaAtual?: () => boolean;
  payload: TablesUpdate<"problemas_tecnicos">;
}) {
  if (!usuarioIdEsperado || !atualizadoEmEsperado || !execucaoEstaAtual()) {
    return { data: null, error: new Error("A versão ou a identidade do chamado não pôde ser confirmada.") };
  }
  const { data: usuario, error: erroUsuario } = await supabase.auth.getUser();
  if (erroUsuario || usuario.user?.id !== usuarioIdEsperado || !execucaoEstaAtual()) {
    return { data: null, error: new Error("A identidade do administrador mudou. Atualize a página.") };
  }
  return supabase
    .from("problemas_tecnicos")
    .update(payload)
    .eq("id", id)
    .eq("atualizado_em", atualizadoEmEsperado)
    .select(
      "id,user_id,email_contato,categoria,titulo,descricao,pagina_url,navegador,dispositivo,status,prioridade,observacao_admin,analisado_por,analisado_em,criado_em,atualizado_em",
    )
    .maybeSingle();
}
