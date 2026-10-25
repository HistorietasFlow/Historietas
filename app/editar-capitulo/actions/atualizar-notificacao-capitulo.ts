import { supabase } from "../../../lib/supabase/client";
import { idObraSupabaseValido } from "../../../lib/utils";
import { criarHrefLeituraCapitulo } from "../lib/editar-capitulo-route-utils";

type ObraParaNotificacaoCapitulo = {
  id: string;
  titulo: string;
  slug: string;
  publicado: boolean;
};

export async function atualizarNotificacaoCapituloSupabase({
  userId,
  obra,
  capituloId,
  tituloCapitulo,
  numeroCapitulo,
  atualizadoEm,
}: {
  userId: string;
  obra: ObraParaNotificacaoCapitulo;
  capituloId: string;
  tituloCapitulo: string;
  numeroCapitulo: number;
  atualizadoEm: string;
}) {
  const usuarioId = userId.trim();

  if (
    !usuarioId ||
    !obra.publicado ||
    !idObraSupabaseValido(obra.id) ||
    !idObraSupabaseValido(capituloId)
  ) {
    return;
  }

  const hrefCapitulo = criarHrefLeituraCapitulo(
    obra,
    capituloId,
    numeroCapitulo
  );

  try {
    const { error } = await supabase.rpc("criar_notificacoes_capitulo", {
      p_obra_id: obra.id,
      p_capitulo_id: capituloId,
      p_titulo: "Capítulo atualizado",
      p_mensagem: `${tituloCapitulo} foi atualizado em ${obra.titulo}.`,
      p_href: hrefCapitulo,
      p_tipo: "novo-capitulo",
      p_criado_em: atualizadoEm,
    });

    if (error) {
      console.warn("Não consegui criar notificações da edição do capítulo:", error.message);
    }
  } catch (error) {
    console.warn("Não consegui notificar leitores da edição do capítulo:", error);
  }
}
