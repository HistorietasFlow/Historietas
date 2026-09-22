import { supabase } from "../../../lib/supabase/client";

export async function criarNotificacaoComunidadeSupabase(
  {
    destinatarioId,
    tipo,
    titulo,
    mensagem,
    link,
    notificacaoId,
  }: {
    destinatarioId: string;
    tipo: string;
    titulo: string;
    mensagem: string;
    link: string;
    notificacaoId: string;
  },
  idSupabaseValidoComunidade: (id: string) => boolean
) {
  const destinatarioIdLimpo = destinatarioId.trim();
  const tipoLimpo = tipo.trim();
  const tituloLimpo = titulo.trim();
  const mensagemLimpa = mensagem.trim();
  const linkLimpo = link.trim();
  const notificacaoIdLimpo = notificacaoId.trim();

  if (
    !idSupabaseValidoComunidade(destinatarioIdLimpo) ||
    !tipoLimpo ||
    !tituloLimpo ||
    !mensagemLimpa ||
    !linkLimpo ||
    !notificacaoIdLimpo
  ) {
    return false;
  }

  try {
    const { error } = await supabase.rpc("criar_notificacao_social", {
      p_user_id: destinatarioIdLimpo,
      p_tipo: tipoLimpo,
      p_titulo: tituloLimpo,
      p_mensagem: mensagemLimpa,
      p_link: linkLimpo,
      p_notificacao_id: notificacaoIdLimpo,
    });

    return !error;
  } catch {
    return false;
  }
}
