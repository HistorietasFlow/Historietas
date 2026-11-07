import { supabase } from "../../../lib/supabase/client";

// Nunca use o cache do leitor ou o capítulo aberto como confirmação de leitura.
export async function carregarAcessoComentariosCapitulo(
  obraId: string,
  capituloId: string,
  usuarioId: string,
): Promise<boolean> {
  if (!obraId || !capituloId || !usuarioId) return false;

  const { data: sessao, error: erroSessao } = await supabase.auth.getUser();
  if (erroSessao || sessao.user?.id !== usuarioId) return false;

  const [progresso, propriedade] = await Promise.all([
    supabase.from("progresso_leitura").select("lido")
      .eq("user_id", usuarioId).eq("obra_id", obraId)
      .eq("capitulo_id", capituloId).maybeSingle(),
    supabase.from("obras").select("user_id")
      .eq("id", obraId).eq("user_id", usuarioId).maybeSingle(),
  ]);

  return (!propriedade.error && propriedade.data?.user_id === usuarioId) ||
    (!progresso.error && progresso.data?.lido === true);
}
