import { supabase } from "../../../lib/supabase/client";
import { idObraSupabaseValido } from "../../../lib/utils";
import { criarHrefLeituraCapitulo } from "../lib/adicionar-capitulo-route-utils";

type ObraParaNotificacoesNovoCapitulo = {
  id: string;
  titulo: string;
  slug: string;
  publicado: boolean;
};

type CapituloParaNotificacoesNovoCapitulo = {
  id: string;
  titulo: string;
};

export async function registrarNotificacoesNovoCapituloSupabase({
  userId,
  obra,
  capitulo,
  numeroCapitulo,
  criadoEm,
}: {
  userId: string;
  obra: ObraParaNotificacoesNovoCapitulo;
  capitulo: CapituloParaNotificacoesNovoCapitulo;
  numeroCapitulo: number;
  criadoEm: string;
}) {
  const usuarioId = userId.trim();

  if (
    !usuarioId ||
    !obra.publicado ||
    !idObraSupabaseValido(obra.id) ||
    !idObraSupabaseValido(capitulo.id)
  ) {
    return;
  }

  try {
    const href = criarHrefLeituraCapitulo(obra, capitulo, numeroCapitulo);
    const tituloNotificacao = "Novo capítulo publicado";
    const mensagemNotificacao = `${capitulo.titulo} foi adicionado em ${obra.titulo}.`;

    const { error } = await supabase.rpc("criar_notificacoes_capitulo", {
      p_obra_id: obra.id,
      p_capitulo_id: capitulo.id,
      p_titulo: tituloNotificacao,
      p_mensagem: mensagemNotificacao,
      p_href: href,
      p_tipo: "novo-capitulo",
      p_criado_em: criadoEm,
    });

    if (error) {
      console.warn("Não consegui criar notificações do novo capítulo:", error.message);
    }
  } catch (error) {
    console.warn("Não consegui notificar leitores do novo capítulo:", error);
  }
}
